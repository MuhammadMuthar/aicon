"""Request/response models. Keep in sync with docs/API.md (the web app relies on it)."""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

# One khata line above PKR 1 billion is a misread; it would also overflow the profile maths.
MAX_AMOUNT = 1_000_000_000


class EntryType(str, Enum):
    sale = "sale"                          # cash received for goods/services
    purchase = "purchase"                  # stock bought for resale
    expense = "expense"                    # rent, electricity, wages, transport...
    udhaar_given = "udhaar_given"          # goods given to a customer on credit
    udhaar_recovered = "udhaar_recovered"  # customer paid back credit


class LedgerEntry(BaseModel):
    date: date
    description: str = ""
    type: EntryType
    amount: float = Field(gt=0, le=MAX_AMOUNT, description="PKR, always positive")
    page: int | None = Field(default=None, description="Source page number (1-based)")
    confidence: float | None = Field(default=None, ge=0, le=1, description="Extraction confidence")


class PageInfo(BaseModel):
    page: int
    stated_total: float | None = Field(default=None, description="Total written at the bottom of the page, if any")


class Ledger(BaseModel):
    business_name: str | None = None
    entries: list[LedgerEntry]
    pages: list[PageInfo] = []


class ExtractResponse(Ledger):
    source: Literal["gemini", "csv"]
    warnings: list[str] = []


class SampleSummary(BaseModel):
    id: str
    business_name: str
    description: str
    months: int
    entries: int


class AnalyzeRequest(Ledger):
    explain: bool = True
    languages: list[Literal["en", "ur"]] = ["en", "ur"]


class MonthlyFlow(BaseModel):
    month: str  # YYYY-MM
    inflow: float
    outflow: float
    udhaar_given: float
    udhaar_recovered: float


class Profile(BaseModel):
    months_of_history: float
    avg_monthly_inflow: float
    avg_monthly_outflow: float
    avg_monthly_surplus: float
    inflow_volatility: float
    net_margin: float
    active_day_ratio: float
    udhaar_ratio: float
    recovery_rate: float
    inflow_trend: float
    udhaar_outstanding: float
    monthly: list[MonthlyFlow]


class Factor(BaseModel):
    feature: str
    label: str
    value: float
    display_value: str
    impact: float = Field(description="Contribution to the log-odds vs. an average shop; + helps, - hurts")
    direction: Literal["up", "down"]


class Score(BaseModel):
    score: int = Field(ge=0, le=100)
    band: Literal["ready", "building", "not_yet"]
    repay_probability: float
    factors: list[Factor]


class LoanSuggestion(BaseModel):
    eligible: bool
    monthly_instalment: float
    tenure_months: int
    principal: float
    note: str


class Flag(BaseModel):
    kind: Literal["page_total_mismatch", "outlier", "duplicate", "low_confidence", "short_history"]
    severity: Literal["info", "warning"]
    message: str
    entry_index: int | None = None
    page: int | None = None


class Explanation(BaseModel):
    language: Literal["en", "ur"]
    summary: str
    strengths: list[str]
    concerns: list[str]
    next_steps: list[str]
    source: Literal["gemini", "template"]


class AnalyzeResponse(BaseModel):
    business_name: str | None
    profile: Profile
    score: Score
    loan: LoanSuggestion
    flags: list[Flag]
    explanations: list[Explanation]
    model_info: dict
