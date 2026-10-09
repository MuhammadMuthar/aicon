import { useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  FileSpreadsheet,
  FileUp,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Store,
  UploadCloud,
} from "lucide-react";
import type { SampleSummary } from "@/lib/types";

interface Props {
  samples: SampleSummary[];
  photoAvailable: boolean;
  online: boolean;
  busy: boolean;
  onSample: (id: string) => void;
  onUpload: (files: File[]) => void;
  onMethod: () => void;
  onResume?: () => void;
}

function LedgerIllustration() {
  return (
    <div className="ledger-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-grid" />
      <div className="art-spark spark-one">✦</div>
      <div className="art-spark spark-two">✧</div>
      <div className="paper-ledger">
        <div className="paper-binding" />
        <div className="paper-header">
          <span>MY BUSINESS KHATA</span>
          <span>2026</span>
        </div>
        <div className="paper-table">
          <div>
            <span>Date</span>
            <span>Entry</span>
            <span>Amount</span>
          </div>
          {[
            ["02 Oct", "Daily sales", "8,400"],
            ["03 Oct", "Stock purchase", "3,200"],
            ["04 Oct", "Daily sales", "9,600"],
            ["05 Oct", "Udhaar recovered", "1,800"],
          ].map((row) => (
            <div key={row[0]}>
              {row.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="paper-total">
          <span>Your everyday records</span>
          <span>↗</span>
        </div>
      </div>
      <div className="art-score">
        <span className="art-check">
          <Check size={17} />
        </span>
        <div>
          <strong>More than a notebook.</strong>
          <span>A story of your business.</span>
        </div>
      </div>
      <div className="art-tag">
        <ScanLine size={15} /> Paper to possibility
      </div>
    </div>
  );
}

export default function UploadView({
  samples,
  photoAvailable,
  online,
  busy,
  onSample,
  onUpload,
  onMethod,
  onResume,
}: Props) {
  const photos = useRef<HTMLInputElement>(null);
  const csv = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  function receive(input: HTMLInputElement) {
    if (input.files?.length) onUpload(Array.from(input.files));
    input.value = "";
  }

  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" /> YOUR BUSINESS, SEEN CLEARLY
          </span>
          <h1>
            Small business.
            <br />
            <span>Bigger possibilities.</span>
          </h1>
          <p>
            Turn your everyday khata into a credit story.
            <br className="desktop-break" /> Understand where you stand—and what
            comes next.
          </p>
        </div>
        <span className="intro-badge">
          <ShieldCheck size={15} /> Explainable by design
        </span>
      </div>
      {onResume && (
        <div className="resume-banner">
          <span>Your current ledger is ready to continue.</span>
          <button onClick={onResume}>
            Resume assessment <ArrowRight size={16} />
          </button>
        </div>
      )}
      <section className="start-grid" aria-label="Start an assessment">
        <div className="upload-card card">
          <div className="card-heading">
            <span className="section-icon orange">
              <FileUp size={21} />
            </span>
            <div>
              <h2>Start with your khata</h2>
              <p>A few pages. A whole new perspective.</p>
            </div>
            <span className="step-marker">01</span>
          </div>
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (photoAvailable && !busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!busy && online) onUpload(Array.from(e.dataTransfer.files));
            }}
          >
            <div className="upload-icon">
              <UploadCloud size={30} strokeWidth={1.5} />
            </div>
            <h3>
              {photoAvailable
                ? "Drop your khata pages here"
                : "Your notebook, now digital"}
            </h3>
            <p>
              {photoAvailable
                ? "or choose photos from your device"
                : online
                  ? "Photo reading is unavailable. Start with a CSV or sample."
                  : "Explore a sample while the live service is unavailable."}
            </p>
            <button
              className="button primary"
              disabled={!photoAvailable || busy}
              onClick={() => photos.current?.click()}
            >
              <FileUp size={17} /> Upload photos <ArrowRight size={16} />
            </button>
            {photoAvailable && (
              <button
                className="camera-button"
                onClick={() => camera.current?.click()}
                disabled={busy}
              >
                <Camera size={15} /> Take a photo
              </button>
            )}
            <span className="upload-formats">
              JPG, PNG, WebP or HEIC · Up to 6 pages · 8 MB each
            </span>
          </div>
          <input
            ref={photos}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            hidden
            aria-label="Upload khata photos"
            onChange={(e) => receive(e.currentTarget)}
          />
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            aria-label="Take a khata photo"
            onChange={(e) => receive(e.currentTarget)}
          />
          <input
            ref={csv}
            type="file"
            accept=".csv,text/csv"
            hidden
            aria-label="Upload CSV"
            onChange={(e) => receive(e.currentTarget)}
          />
          <div className="upload-alternative">
            <span>
              <FileSpreadsheet size={19} />
              <span>
                Already have a spreadsheet?
                <small>date, type, amount, description, page</small>
              </span>
            </span>
            <button
              className="text-button"
              disabled={!online || busy}
              onClick={() => csv.current?.click()}
            >
              Import CSV <ChevronRight size={16} />
            </button>
          </div>
          <div className="privacy-note">
            <LockKeyhole size={13} />
            <span>Used for this assessment. No account needed.</span>
          </div>
        </div>
        <div className="story-card">
          <span className="story-kicker">FROM PAPER TO POSSIBILITY</span>
          <h2>
            Your hard work
            <br />
            deserves to count.
          </h2>
          <p>
            Sales, purchases, a little udhaar.
            <br />
            There’s a credit story in every entry.
          </p>
          <LedgerIllustration />
          <div className="story-bottom">
            <span>
              <BadgeCheck size={17} /> Real records. Clear reasoning.
            </span>
            <button
              onClick={onMethod}
              aria-label="See how your ledger is analysed"
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </section>
      <section className="sample-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">TAKE IT FOR A TEST RUN</span>
            <h2>No khata handy? Try a sample.</h2>
            <p>
              Meet three fictional businesses. See three different credit
              stories.
            </p>
          </div>
          <span className="subtle-badge">
            <Sparkles size={13} /> No upload needed
          </span>
        </div>
        <div className="sample-grid">
          {[...samples]
            .sort(
              (a, b) =>
                ["rahim", "nadia", "bilal"].indexOf(a.id) -
                ["rahim", "nadia", "bilal"].indexOf(b.id),
            )
            .map((sample, index) => (
              <button
                key={sample.id}
                className={`sample-card sample-${index}`}
                disabled={busy}
                onClick={() => onSample(sample.id)}
                aria-label={`Try ${sample.business_name}`}
              >
                <div className="sample-card-top">
                  <span className="sample-icon">
                    <Store size={23} strokeWidth={1.6} />
                  </span>
                  <span className="sample-type">
                    {sample.id === "nadia"
                      ? "HOME BUSINESS"
                      : sample.id === "bilal"
                        ? "GENERAL STORE"
                        : "KIRYANA STORE"}
                  </span>
                  <ArrowRight size={18} className="sample-arrow" />
                </div>
                <h3>{sample.business_name}</h3>
                <p>{sample.description}</p>
                <div className="sample-card-footer">
                  <span>{sample.months} months of history</span>
                  <span className="small-dot" />
                  <span>{sample.entries} entries</span>
                </div>
              </button>
            ))}
        </div>
      </section>
      <section className="journey-strip" aria-label="Assessment steps">
        <div className="journey-intro">
          <span className="section-icon">
            <ScanLine size={21} />
          </span>
          <div>
            <h3>A little clarity goes a long way.</h3>
            <p>Three simple steps to your credit profile.</p>
          </div>
        </div>
        <div className="journey-step">
          <span>1</span>
          <div>
            <strong>Bring your records</strong>
            <small>Photo, CSV or sample</small>
          </div>
        </div>
        <ChevronRight className="journey-arrow" size={17} />
        <div className="journey-step">
          <span>2</span>
          <div>
            <strong>Check the details</strong>
            <small>You stay in control</small>
          </div>
        </div>
        <ChevronRight className="journey-arrow" size={17} />
        <div className="journey-step">
          <span>3</span>
          <div>
            <strong>See your possibilities</strong>
            <small>Score, insights & next steps</small>
          </div>
        </div>
      </section>
    </>
  );
}
