import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  ENTRY_LABELS,
  type EntryType,
  type Flag,
  type Ledger,
} from "@/lib/types";
import { money } from "@/lib/api";

interface Props {
  ledger: Ledger;
  flags: Flag[];
  warnings: string[];
  onChange: (ledger: Ledger) => void;
  onAnalyze: () => void;
  onUpload: (files: File[]) => void;
  onBack: () => void;
  busy: boolean;
  photoAvailable: boolean;
  online: boolean;
}
const PAGE_SIZE = 12;

export default function LedgerView({
  ledger,
  flags,
  warnings,
  onChange,
  onAnalyze,
  onUpload,
  onBack,
  busy,
  photoAvailable,
  online,
}: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [onlyFlagged, setOnlyFlagged] = useState(flags.length > 0);
  const files = useRef<HTMLInputElement>(null);
  // Entry-level flags (outlier, duplicate, low confidence) also carry a page, so
  // only page-level flags (no entry_index, e.g. a wrong page total) match by page.
  const flagsFor = (index: number) =>
    flags.filter(
      (f) =>
        f.entry_index === index ||
        (f.entry_index == null &&
          f.page != null &&
          f.page === ledger.entries[index].page),
    );
  const needsReview = (index: number) => {
    const entry = ledger.entries[index];
    return (
      (entry.confidence != null && entry.confidence < 0.8) ||
      flagsFor(index).length > 0
    );
  };
  const attention = ledger.entries.filter((_, i) => needsReview(i)).length;
  const filtered = ledger.entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry, index }) =>
        (!onlyFlagged || !attention || needsReview(index)) &&
        (!type || entry.type === type) &&
        `${entry.description} ${entry.date} ${ENTRY_LABELS[entry.type]}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const shown = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const inflow = ledger.entries
    .filter((e) => ["sale", "udhaar_recovered"].includes(e.type))
    .reduce((n, e) => n + (Number.isFinite(e.amount) ? e.amount : 0), 0);
  const outflow = ledger.entries
    .filter((e) => ["purchase", "expense"].includes(e.type))
    .reduce((n, e) => n + (Number.isFinite(e.amount) ? e.amount : 0), 0);
  function edit(index: number, field: string, value: string | number) {
    onChange({
      ...ledger,
      entries: ledger.entries.map((e, i) =>
        i === index ? { ...e, [field]: value } : e,
      ),
    });
  }
  function addRow() {
    onChange({
      ...ledger,
      entries: [
        ...ledger.entries,
        {
          date:
            ledger.entries.at(-1)?.date ||
            new Date().toISOString().slice(0, 10),
          description: "",
          type: "sale",
          amount: 0,
          page: ledger.pages.at(-1)?.page ?? 1,
        },
      ],
    });
    setSearch("");
    setType("");
    setPage(Math.floor(ledger.entries.length / PAGE_SIZE));
  }
  function exportCsv() {
    const escape = (s: string | number | null | undefined) => {
      let value = String(s ?? "");
      if (/^[=+\-@\t\r]/.test(value)) value = "'" + value;
      return '"' + value.replaceAll('"', '""') + '"';
    };
    const data = [
      "date,type,amount,description,page",
      ...ledger.entries.map((e) =>
        [e.date, e.type, e.amount, e.description, e.page].map(escape).join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "khata-ledger.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to overview
      </button>
      <div className="view-heading">
        <div>
          <span className="eyebrow">STEP 02 · CHECK THE DETAILS</span>
          <h1>Every entry matters.</h1>
          <p>
            Review your records. Make a correction. Then see the bigger picture.
          </p>
        </div>
        <span className="subtle-badge">
          <CheckCheck size={14} /> Editable ledger
        </span>
      </div>
      {warnings.map((warning, i) => (
        <div className="notice warning-notice" key={i}>
          <AlertTriangle size={17} />
          {warning}
        </div>
      ))}
      <div className="ledger-summary">
        <div>
          <span>Total cash inflow</span>
          <strong>
            <small>PKR</small> {money(inflow)}
          </strong>
        </div>
        <div>
          <span>Total cash outflow</span>
          <strong>
            <small>PKR</small> {money(outflow)}
          </strong>
        </div>
        <div>
          <span>Ledger entries</span>
          <strong>
            {ledger.entries.length}
            <small>
              {" "}
              across {new Set(ledger.entries.map((e) => e.page ?? 1)).size}{" "}
              pages
            </small>
          </strong>
        </div>
        <div>
          <span>Entries to review</span>
          <strong className={attention ? "text-amber" : "text-green"}>
            {attention}
            <small> {attention ? "need a closer look" : "looking clear"}</small>
          </strong>
        </div>
      </div>
      <section className="card ledger-card">
        <div className="ledger-card-title">
          <div className="business-name">
            <label htmlFor="business-name">BUSINESS NAME</label>
            <input
              id="business-name"
              value={ledger.business_name || ""}
              placeholder="Your business name"
              onChange={(e) =>
                onChange({ ...ledger, business_name: e.target.value })
              }
              disabled={busy}
            />
          </div>
          <div className="button-row">
            <button
              className="button secondary compact-button"
              onClick={exportCsv}
              disabled={busy}
            >
              <ArrowDownToLine size={15} /> Export CSV
            </button>
            <button
              className="button secondary compact-button"
              onClick={() => files.current?.click()}
              disabled={!online || busy}
            >
              <FilePlus2 size={15} /> Add pages / CSV
            </button>
            <input
              hidden
              ref={files}
              type="file"
              multiple
              accept={
                photoAvailable
                  ? "image/jpeg,image/png,image/webp,image/heic,image/heif,.csv"
                  : ".csv"
              }
              aria-label="Add ledger pages"
              onChange={(e) => {
                if (e.target.files?.length)
                  onUpload(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="ledger-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search entries"
              placeholder="Search entries…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            className="filter-select"
            aria-label="Filter by entry type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All entry types</option>
            {Object.entries(ENTRY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {attention > 0 && (
            <button
              className={`review-filter ${onlyFlagged ? "selected" : ""}`}
              aria-pressed={onlyFlagged}
              onClick={() => {
                setOnlyFlagged(!onlyFlagged);
                setPage(0);
              }}
            >
              <AlertTriangle size={13} /> Needs review ({attention})
            </button>
          )}
          <span className="toolbar-count">{filtered.length} entries</span>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          aria-label="Editable ledger table, scroll horizontally on smaller screens"
        >
          <table className="ledger-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Entry type</th>
                <th scope="col">
                  Amount <span>(PKR)</span>
                </th>
                <th scope="col">Page</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ entry, index }) => {
                const rowFlags = flagsFor(index);
                const flagged = needsReview(index);
                return (
                  <tr key={index} className={flagged ? "flagged-row" : ""}>
                    <td>
                      <input
                        type="date"
                        value={entry.date}
                        aria-label={`Date for entry ${index + 1}`}
                        disabled={busy}
                        onChange={(e) => edit(index, "date", e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <div className="description-cell">
                        <input
                          value={entry.description}
                          aria-label={`Description for entry ${index + 1}`}
                          placeholder="Add a description"
                          disabled={busy}
                          onChange={(e) =>
                            edit(index, "description", e.target.value)
                          }
                        />
                        {flagged && (
                          <span
                            title={
                              rowFlags.map((f) => f.message).join("\n") ||
                              "Low extraction confidence"
                            }
                            aria-label="Entry needs review"
                          >
                            <AlertTriangle size={15} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className={`entry-select type-${entry.type}`}
                        value={entry.type}
                        aria-label={`Type for entry ${index + 1}`}
                        disabled={busy}
                        onChange={(e) =>
                          edit(index, "type", e.target.value as EntryType)
                        }
                      >
                        {Object.entries(ENTRY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="amount-input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          Number.isFinite(entry.amount) ? entry.amount : ""
                        }
                        aria-label={`Amount for entry ${index + 1}`}
                        disabled={busy}
                        onChange={(e) =>
                          edit(index, "amount", e.target.valueAsNumber)
                        }
                        required
                      />
                    </td>
                    <td>
                      <span className="page-pill">{entry.page ?? "—"}</span>
                    </td>
                    <td>
                      <button
                        className="icon-button delete-button"
                        aria-label={`Delete entry ${index + 1}`}
                        disabled={busy}
                        onClick={() =>
                          onChange({
                            ...ledger,
                            entries: ledger.entries.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={6} className="empty-table">
                    {ledger.entries.length
                      ? "No entries match your search."
                      : "Your ledger is empty. Add an entry to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-bottom">
          <button className="text-button" onClick={addRow} disabled={busy}>
            <Plus size={16} /> Add entry
          </button>
          <div className="pagination">
            <span>
              {filtered.length ? currentPage * PAGE_SIZE + 1 : 0}–
              {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={currentPage === pages - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <div className="analysis-action">
        <div>
          <span className="action-check">
            <CheckCheck size={20} />
          </span>
          <div>
            <strong>Happy with your records?</strong>
            <p>
              Your score is based on these entries. You can come back and edit
              anytime.
            </p>
          </div>
        </div>
        <button
          className="button primary"
          onClick={onAnalyze}
          disabled={busy || !ledger.entries.length}
        >
          Analyse my khata <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
