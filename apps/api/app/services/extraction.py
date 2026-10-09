"""Khata photo (or CSV) -> structured ledger entries."""

from __future__ import annotations

import csv
import io
from datetime import date

from pydantic import BaseModel, Field

from app.schemas import EntryType, ExtractResponse, LedgerEntry, PageInfo
from app.services import llm

SYSTEM_PROMPT = """You digitise handwritten shop ledgers (khata / bahi-khata) from Pakistan.
Pages may be in Urdu, English, Roman Urdu or a mix, with Urdu or Western digits.

Read every line item on every page and return it as structured data. Rules:
- One output entry per written line item. Never invent entries; skip lines you cannot read at all.
- amount: the rupee amount as a positive number (no commas, no "Rs").
- date: ISO YYYY-MM-DD. If a line has no date, use the most recent date written above it on the page.
  If the year is not written, assume {year}. If no date at all is readable, return null.
- type, mapped from the meaning of the line:
  * sale            - cash sales, "bikri", "naqd", "فروخت", "نقد", daily sale totals
  * purchase        - stock bought for resale, "maal", "khareed", "خریداری", wholesaler / supplier names
  * expense         - rent "kiraya/کرایہ", electricity "bijli/بجلی", wages "tankhwah", transport, other running costs
  * udhaar_given    - goods given on credit to a named customer, "udhaar", "baqi", "ادھار", "باقی"
  * udhaar_recovered - a customer paying back credit, "wasooli", "jama", "وصولی", "جمع", "ada"
- description: short English or Roman Urdu text of what the line says (customer or item name).
- confidence: 0-1, how sure you are of the amount and type together.
- stated_total: if the page has a total written at the bottom ("total", "kul", "میزان", "کل"),
  return that number; otherwise null. Do not compute it yourself.
"""


class _RawEntry(BaseModel):
    date: str | None = Field(description="YYYY-MM-DD or null")
    description: str
    type: EntryType
    amount: float
    confidence: float


class _RawPage(BaseModel):
    page: int
    stated_total: float | None
    entries: list[_RawEntry]


class _RawLedger(BaseModel):
    business_name: str | None
    pages: list[_RawPage]


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def extract_from_images(images: list[tuple[bytes, str]], year: int) -> ExtractResponse:
    parts = []
    for i, (data, mime) in enumerate(images, start=1):
        parts.append(f"Page {i}:")
        parts.append(llm.image_part(data, mime))
    parts.append("Extract all pages. Number pages in the order given, starting at 1.")

    raw: _RawLedger = llm.generate_json(parts, _RawLedger, SYSTEM_PROMPT.format(year=year))

    entries: list[LedgerEntry] = []
    pages: list[PageInfo] = []
    warnings: list[str] = []
    last_date: date | None = None
    dropped = 0
    for p in raw.pages:
        pages.append(PageInfo(page=p.page, stated_total=p.stated_total))
        for r in p.entries:
            d = _parse_date(r.date) or last_date
            if d is None or r.amount <= 0:
                dropped += 1
                continue
            last_date = d
            entries.append(LedgerEntry(
                date=d, description=r.description.strip(), type=r.type,
                amount=round(r.amount, 2), page=p.page,
                confidence=max(0.0, min(1.0, r.confidence)),
            ))
    if dropped:
        warnings.append(f"{dropped} line(s) skipped because no date or amount could be read.")
    if not entries:
        warnings.append("No ledger entries could be read. Try a sharper, well-lit photo taken from directly above.")
    entries.sort(key=lambda e: (e.date, e.page or 0))
    return ExtractResponse(business_name=raw.business_name, entries=entries, pages=pages, source="gemini", warnings=warnings)


CSV_HELP = "CSV needs columns: date (YYYY-MM-DD), type, amount; optional: description, page."


def extract_from_csv(data: bytes) -> ExtractResponse:
    text = data.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    cols = {c.strip().lower() for c in (reader.fieldnames or [])}
    if not {"date", "type", "amount"} <= cols:
        raise ValueError(CSV_HELP)
    entries, warnings = [], []
    for n, row in enumerate(reader, start=2):
        row = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
        try:
            entries.append(LedgerEntry(
                date=date.fromisoformat(row["date"]),
                type=EntryType(row["type"].lower()),
                amount=float(row["amount"].replace(",", "")),
                description=row.get("description", ""),
                page=int(row["page"]) if row.get("page") else None,
            ))
        except Exception:
            warnings.append(f"Row {n} skipped (could not read date/type/amount).")
    if not entries:
        raise ValueError("No valid rows. " + CSV_HELP)
    entries.sort(key=lambda e: e.date)
    return ExtractResponse(entries=entries, source="csv", warnings=warnings)
