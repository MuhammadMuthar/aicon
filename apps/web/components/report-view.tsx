import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChartColumnIncreasing,
  Check,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Info,
  Languages,
  PencilLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { compact, money } from "@/lib/api";
import { BANDS, type AnalyzeResponse } from "@/lib/types";

interface Props {
  result: AnalyzeResponse;
  cached: boolean;
  onEdit: () => void;
  onMethod: () => void;
}

export default function ReportView({
  result: r,
  cached,
  onEdit,
  onMethod,
}: Props) {
  const [language, setLanguage] = useState<"en" | "ur">("en");
  const [showData, setShowData] = useState(false);
  const explanation = r.explanations.find((e) => e.language === language);
  const band = r.score.band;
  const gaugeLength = Math.PI * 78;
  const maxImpact = Math.max(
    ...r.score.factors.map((f) => Math.abs(f.impact)),
    0.01,
  );
  const maxFlow = Math.max(
    ...r.profile.monthly.flatMap((m) => [m.inflow, m.outflow]),
    1,
  );
  const warnings = r.flags.filter((f) => f.severity === "warning").length;
  const monthName = (month: string) =>
    new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });

  return (
    <>
      <div className="view-heading report-heading">
        <div>
          <span className="eyebrow">STEP 03 · YOUR CREDIT STORY</span>
          <h1>
            A clearer picture.
            <br className="mobile-break" /> A better next step.
          </h1>
          <p>
            {r.business_name || "Your business"}{" "}
            <span className="inline-dot">·</span>{" "}
            {r.profile.months_of_history.toFixed(1)} months of records
          </p>
        </div>
        <button className="button secondary" onClick={onEdit}>
          <PencilLine size={16} /> Review ledger
        </button>
      </div>
      {cached && (
        <div className="notice warning-notice">
          <Info size={18} />
          <span>
            <strong>Sample demo report.</strong> The live service is
            unavailable. This is a precomputed assessment of the unchanged
            fictional sample, not a new calculation.
          </span>
        </div>
      )}
      <section className="result-top-grid">
        <div className={`card score-card band-${band}`}>
          <div className="card-label">
            <span>
              <BadgeCheck size={16} /> CREDIT READINESS
            </span>
            <span
              className="info-hint"
              title="Prototype score from a model trained on synthetic shops"
            >
              <Info size={15} />
            </span>
          </div>
          <div
            className="gauge"
            role="img"
            aria-label={`Credit-readiness score ${r.score.score} out of 100, ${BANDS[band]}`}
          >
            <svg viewBox="0 0 200 112" aria-hidden="true">
              <path d="M 22 96 A 78 78 0 0 1 178 96" className="gauge-track" />
              <path
                d="M 22 96 A 78 78 0 0 1 178 96"
                className="gauge-value"
                strokeDasharray={`${(gaugeLength * r.score.score) / 100} ${gaugeLength}`}
              />
              <text x="100" y="84" className="gauge-score">
                {r.score.score}
              </text>
              <text x="100" y="106" className="gauge-total">
                OUT OF 100
              </text>
            </svg>
          </div>
          <span className={`band-pill ${band}`}>
            <span />
            {BANDS[band]}
          </span>
          <p>
            {band === "ready"
              ? "Your records show a strong foundation for credit."
              : band === "building"
                ? "Your business is on its way. A few changes can help."
                : "Strengthen your records before taking on a loan."}
          </p>
          <div className="score-scale">
            <span>Not yet &lt;55</span>
            <span>Building 55–74</span>
            <span>Ready 75+</span>
          </div>
        </div>
        <div className="card loan-card">
          <div className="card-label">
            <span>
              <Coins size={17} /> A POSSIBLE NEXT STEP
            </span>
            <span className="subtle-badge">
              {r.loan.tenure_months}-month term
            </span>
          </div>
          <h2>
            {r.loan.eligible
              ? "An affordable starting point."
              : "A little more groundwork."}
          </h2>
          <p>
            {r.loan.eligible
              ? "A suggested loan size, grounded in your cash flow."
              : "Your current records do not support a suggested loan yet."}
          </p>
          <div className="loan-amount">
            <span>PKR</span>
            <strong>{money(r.loan.principal)}</strong>
          </div>
          <div className="loan-details">
            <div>
              <span>Monthly instalment</span>
              <strong>PKR {money(r.loan.monthly_instalment)}</strong>
            </div>
            <div>
              <span>Average monthly surplus</span>
              <strong>PKR {money(r.profile.avg_monthly_surplus)}</strong>
            </div>
          </div>
          <div className="loan-note">
            <Info size={15} />
            <span>{r.loan.note}</span>
          </div>
        </div>
        <div className="profile-card">
          <div className="card-label">
            <span>
              <TrendingUp size={17} /> BUSINESS SNAPSHOT
            </span>
          </div>
          <div className="profile-stat">
            <span>Monthly cash coming in</span>
            <strong>PKR {compact(r.profile.avg_monthly_inflow)}</strong>
            <small>Average across your records</small>
          </div>
          <div className="profile-stat">
            <span>Net margin</span>
            <strong>
              {(r.profile.net_margin * 100).toFixed(1)}
              <small>%</small>
            </strong>
            <small>Cash surplus as a share of inflow</small>
          </div>
          <div className="profile-stat">
            <span>Udhaar recovered</span>
            <strong>
              {(r.profile.recovery_rate * 100).toFixed(0)}
              <small>%</small>
            </strong>
            <small>Of the credit given to customers</small>
          </div>
        </div>
      </section>
      <div className="report-middle-grid">
        <section className="card factor-card">
          <div className="section-card-heading">
            <div>
              <h2>What shapes your score?</h2>
              <p>Every factor has a visible contribution.</p>
            </div>
            <span className="section-icon">
              <ChartColumnIncreasing size={20} />
            </span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot green" /> Helps your score
            </span>
            <span>
              <i className="legend-dot coral" /> Holds it back
            </span>
          </div>
          <div className="factor-chart">
            {r.score.factors.map((f) => (
              <div className="factor-row" key={f.feature}>
                <div className="factor-label">
                  <span>{f.label}</span>
                  <small>{f.display_value}</small>
                </div>
                <div
                  className="factor-track"
                  role="img"
                  aria-label={`${f.label}: ${f.display_value}, ${f.direction === "up" ? "helps" : "hurts"} score; contribution ${f.impact.toFixed(2)} log-odds`}
                >
                  <span className="factor-center" />
                  <span
                    className={`factor-bar ${f.direction}`}
                    style={{
                      width: `${Math.max(1, (Math.abs(f.impact) / maxImpact) * 47)}%`,
                      ...(f.direction === "up"
                        ? { left: "50%" }
                        : { right: "50%" }),
                    }}
                  />
                </div>
                <span className={`factor-direction ${f.direction}`}>
                  {f.direction === "up" ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="chart-footnote">
            Contribution relative to an average synthetic shop. Bar lengths show
            the strength of each contribution, not percentage points.
          </p>
        </section>
        <section className="card cashflow-card">
          <div className="section-card-heading">
            <div>
              <h2>The rhythm of your business.</h2>
              <p>Monthly cash inflow and outflow.</p>
            </div>
            <span className="section-icon">
              <TrendingUp size={20} />
            </span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot green" /> Inflow
            </span>
            <span>
              <i className="legend-dot gray" /> Outflow
            </span>
            <span className="chart-unit">PKR</span>
          </div>
          <div className="cash-chart">
            <div className="chart-y-axis">
              {[1, 0.75, 0.5, 0.25, 0].map((n) => (
                <span key={n}>{compact(maxFlow * n)}</span>
              ))}
            </div>
            <div className="cash-plot">
              <div className="chart-gridlines">
                {[0, 1, 2, 3, 4].map((n) => (
                  <span key={n} />
                ))}
              </div>
              <div className="cash-columns">
                {r.profile.monthly.map((m) => (
                  <div className="month-column" key={m.month}>
                    <div className="month-bars">
                      <div
                        className="cash-bar inflow"
                        style={{ height: `${(m.inflow / maxFlow) * 100}%` }}
                        role="img"
                        aria-label={`${monthName(m.month)} inflow PKR ${money(m.inflow)}`}
                        title={`Inflow: PKR ${money(m.inflow)}`}
                      />
                      <div
                        className="cash-bar outflow"
                        style={{ height: `${(m.outflow / maxFlow) * 100}%` }}
                        role="img"
                        aria-label={`${monthName(m.month)} outflow PKR ${money(m.outflow)}`}
                        title={`Outflow: PKR ${money(m.outflow)}`}
                      />
                    </div>
                    <span>{monthName(m.month)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            className="text-button chart-data-toggle"
            onClick={() => setShowData(!showData)}
            aria-expanded={showData}
          >
            {showData ? "Hide" : "View"} monthly data <ChevronRight size={14} />
          </button>
          {showData && (
            <div className="table-scroll">
              <table className="data-table">
                <caption className="sr-only">Monthly cash flow in PKR</caption>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Inflow</th>
                    <th>Outflow</th>
                  </tr>
                </thead>
                <tbody>
                  {r.profile.monthly.map((m) => (
                    <tr key={m.month}>
                      <td>{monthName(m.month)}</td>
                      <td>{money(m.inflow)}</td>
                      <td>{money(m.outflow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="cashflow-bottom">
            <span>Outstanding udhaar</span>
            <strong>PKR {money(r.profile.udhaar_outstanding)}</strong>
          </div>
        </section>
      </div>
      <section className="card explanation-card">
        <div className="explanation-header">
          <div className="section-card-heading">
            <span className="section-icon orange">
              <Sparkles size={21} />
            </span>
            <div>
              <span className="eyebrow muted">CLARITY, IN YOUR LANGUAGE</span>
              <h2>Your numbers. Made human.</h2>
            </div>
          </div>
          <div
            className="language-toggle"
            role="group"
            aria-label="Explanation language"
          >
            <button
              className={language === "en" ? "selected" : ""}
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              <Languages size={14} /> English
            </button>
            <button
              className={
                language === "ur" ? "selected urdu-toggle" : "urdu-toggle"
              }
              aria-pressed={language === "ur"}
              onClick={() => setLanguage("ur")}
              lang="ur"
            >
              اردو
            </button>
          </div>
        </div>
        {explanation ? (
          <div
            className={`explanation-body ${language === "ur" ? "urdu-content" : ""}`}
            dir={language === "ur" ? "rtl" : "ltr"}
            lang={language}
          >
            <p className="explanation-summary">{explanation.summary}</p>
            <div className="explanation-columns">
              <div>
                <h3>
                  <Check size={17} />
                  {language === "ur" ? "آپ کی طاقتیں" : "What's working well"}
                </h3>
                <ul>
                  {explanation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>
                  <AlertTriangle size={16} />
                  {language === "ur"
                    ? "بہتری کی گنجائش"
                    : "Where you can improve"}
                </h3>
                <ul>
                  {explanation.concerns.length ? (
                    explanation.concerns.map((s, i) => <li key={i}>{s}</li>)
                  ) : (
                    <li>
                      {language === "ur"
                        ? "کوئی اہم تشویش نہیں۔"
                        : "No major concerns in this assessment."}
                    </li>
                  )}
                </ul>
              </div>
              <div className="next-steps">
                <h3>
                  <ArrowRight size={17} />
                  {language === "ur" ? "اگلے قدم" : "Your next steps"}
                </h3>
                <ol>
                  {explanation.next_steps.map((s, i) => (
                    <li key={i}>
                      <span>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-explanation">
            An explanation in this language is not available. Try the other
            language or analyse your ledger again.
          </p>
        )}
      </section>
      <section className="card integrity-card">
        <div className="section-card-heading">
          <div>
            <h2>
              <ShieldCheck size={20} /> A second look at the details.
            </h2>
            <p>
              {r.flags.length
                ? `${r.flags.length} finding${r.flags.length === 1 ? "" : "s"} to keep your records honest and clear.`
                : "No integrity flags were found in these records."}
            </p>
          </div>
          <span
            className={`subtle-badge ${warnings ? "amber-badge" : "green-badge"}`}
          >
            {warnings ? `${warnings} to review` : "Checks complete"}
          </span>
        </div>
        {r.flags.length ? (
          <div className="flag-list">
            {r.flags.map((f, i) => (
              <div className={`flag-item ${f.severity}`} key={i}>
                <span className="flag-icon">
                  {f.severity === "warning" ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Info size={18} />
                  )}
                </span>
                <div>
                  <strong>
                    {
                      {
                        page_total_mismatch: "Page total doesn't add up",
                        outlier: "Unusual amount",
                        duplicate: "Possible duplicate",
                        low_confidence: "Check the handwriting",
                        short_history: "A little more history will help",
                      }[f.kind]
                    }
                  </strong>
                  <p>{f.message}</p>
                  <small>
                    {f.entry_index != null
                      ? `Entry ${f.entry_index + 1}`
                      : "Ledger check"}
                    {f.page != null ? ` · Page ${f.page}` : ""}
                  </small>
                </div>
                <button className="text-button" onClick={onEdit}>
                  Review <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="all-clear">
            <ClipboardCheck size={24} />
            <span>
              Page totals and entry checks passed. Keep recording your business
              consistently.
            </span>
          </div>
        )}
      </section>
      <div className="report-disclaimer">
        <Info size={17} />
        <p>
          <strong>A helpful starting point, not a lending decision.</strong>{" "}
          This prototype is trained on synthetic shop profiles, not real
          repayment outcomes. Scores and loan suggestions are illustrative.{" "}
          <button onClick={onMethod}>
            Explore the model <ArrowRight size={13} />
          </button>
        </p>
      </div>
    </>
  );
}
