import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Calculator,
  ChevronRight,
  Eye,
  Info,
  Languages,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ModelInfo } from "@/lib/types";

export default function MethodView({
  model,
  onStart,
}: {
  model: ModelInfo;
  onStart: () => void;
}) {
  const stages = [
    {
      icon: ScanLine,
      title: "Read your records",
      tag: "GEMINI VISION",
      detail:
        "Handwritten English, Urdu or Roman Urdu becomes structured entries. CSVs and samples skip the photo-reading step.",
    },
    {
      icon: Calculator,
      title: "Check the details",
      tag: "INTEGRITY CHECKS",
      detail:
        "Page totals, unusual amounts, duplicates and low-confidence handwriting get a second look. You can correct every entry.",
    },
    {
      icon: BrainCircuit,
      title: "Build your profile",
      tag: "EXPLAINABLE ML",
      detail:
        "A logistic-regression model reads eight cash-flow features. Each factor's exact contribution is visible in your report.",
    },
    {
      icon: Languages,
      title: "Make it understandable",
      tag: "ENGLISH + URDU",
      detail:
        "Gemini explains the computed numbers and suggests next steps. If it is unavailable, grounded templates keep the report useful.",
    },
  ];
  return (
    <>
      <div className="view-heading">
        <div>
          <span className="eyebrow">A LITTLE TRANSPARENCY GOES A LONG WAY</span>
          <h1>
            No mystery.
            <br />
            Just a clearer picture.
          </h1>
          <p>From a handwritten page to a credit profile you can understand.</p>
        </div>
        <span className="intro-badge">
          <Eye size={16} /> Open by design
        </span>
      </div>
      <section className="method-hero">
        <div>
          <span className="section-icon">
            <BookOpenCheck size={25} />
          </span>
          <h2>
            Your khata is the starting point.
            <br />
            You stay in control.
          </h2>
          <p>
            AI helps read and explain. A separate, transparent model calculates
            the score. Your editable records connect the two.
          </p>
          <button className="button primary" onClick={onStart}>
            Explore an assessment <ArrowRight size={16} />
          </button>
        </div>
        <div className="method-principles">
          <div>
            <ShieldCheck size={22} />
            <strong>Every score has a reason.</strong>
            <p>See which factors help and which hold it back.</p>
          </div>
          <div>
            <Languages size={22} />
            <strong>Clarity in two languages.</strong>
            <p>
              English and Urdu explanations, side by side with your records.
            </p>
          </div>
          <div>
            <BookOpenCheck size={22} />
            <strong>Your records, your corrections.</strong>
            <p>Review the ledger before any score is calculated.</p>
          </div>
        </div>
      </section>
      <section className="pipeline-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">THE JOURNEY OF AN ENTRY</span>
            <h2>Four steps. Nothing hidden.</h2>
          </div>
        </div>
        <div className="pipeline-grid">
          {stages.map((s, i) => (
            <article className="card pipeline-card" key={s.title}>
              <div className="pipeline-top">
                <span className="section-icon">
                  <s.icon size={24} />
                </span>
                <span>0{i + 1}</span>
              </div>
              <span className="pipeline-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.detail}</p>
              {i < 3 && <ChevronRight size={20} className="pipeline-arrow" />}
            </article>
          ))}
        </div>
      </section>
      <section className="card model-card">
        <div className="section-card-heading">
          <div>
            <span className="eyebrow muted">MEET THE MODEL</span>
            <h2>
              Simple enough to inspect.
              <br />
              Honest about its limits.
            </h2>
          </div>
          <span className="subtle-badge">
            <BrainCircuit size={14} /> Logistic regression
          </span>
        </div>
        <div className="model-details">
          <div>
            <span>Model</span>
            <strong>{model.name}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>v{model.version}</strong>
          </div>
          <div>
            <span>Trained</span>
            <strong>
              {new Date(model.trained_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Karachi",
              })}
            </strong>
          </div>
          <div>
            <span>Training data</span>
            <strong>{model.training_data}</strong>
          </div>
        </div>
        <div className="model-metrics">
          {[
            [
              "test_auc",
              "Test AUC",
              "Ranking performance on synthetic held-out data",
            ],
            [
              "test_brier",
              "Brier score",
              "Probability calibration; lower is better",
            ],
            [
              "n_train",
              "Training shops",
              "Synthetic profiles used to fit the model",
            ],
            ["n_test", "Test shops", "Held-out synthetic profiles"],
          ]
            .filter(([key]) => model.metrics[key] != null)
            .map(([key, label, detail]) => (
              <div key={key}>
                <span>{label}</span>
                <strong>
                  {model.metrics[key].toLocaleString("en", {
                    maximumFractionDigits: 3,
                  })}
                </strong>
                <p>{detail}</p>
              </div>
            ))}
        </div>
        <p className="model-limit">
          <Info size={17} /> These metrics describe synthetic test data. They do
          not establish real-world lending performance or fairness.
        </p>
      </section>
      <div className="disclosure-grid">
        <section className="card disclosure-card">
          <ShieldCheck size={24} />
          <h3>Fictional data. Real transparency.</h3>
          <p>
            Our three sample businesses and model training population are
            synthetic. No real personal or financial data is included in the
            demo. A lender would need to validate and retrain the model on
            authorised repayment outcomes.
          </p>
        </section>
        <section className="card disclosure-card">
          <Sparkles size={24} />
          <h3>A starting point, not a promise.</h3>
          <p>
            The score indicates credit readiness under the model’s assumptions.
            Loan suggestions illustrate affordability; they are not loan offers
            or approvals. Always review extraction errors and integrity findings
            before using an assessment.
          </p>
        </section>
      </div>
    </>
  );
}
