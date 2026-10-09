"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  CircleHelp,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  analyze,
  appendLedger,
  cachedAnalysis,
  connect,
  demos,
  extract,
  request,
  validateLedger,
} from "@/lib/api";
import type {
  AnalyzeResponse,
  Health,
  Ledger,
  SampleSummary,
  View,
} from "@/lib/types";
import UploadView from "./upload-view";
import LedgerView from "./ledger-view";
import ReportView from "./report-view";
import MethodView from "./method-view";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-symbol">
        <BookOpen size={22} strokeWidth={2.2} />
      </span>
      <span>
        khata<span className="brand-dot">.</span>
      </span>
    </span>
  );
}

function ResetDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="reset-title"
      onCancel={onCancel}
    >
      <span className="section-icon">
        <FileCheck2 size={24} />
      </span>
      <h2 id="reset-title">Start a new assessment?</h2>
      <p>
        Your current ledger and report will be cleared from this workspace. You
        can export your ledger before starting again.
      </p>
      <div className="button-row">
        <button className="button secondary" onClick={onCancel} autoFocus>
          Keep working
        </button>
        <button className="button primary" onClick={onConfirm}>
          Start fresh <ArrowRight size={16} />
        </button>
      </div>
    </dialog>
  );
}

export default function Workspace() {
  const [view, setView] = useState<View>("overview");
  const [health, setHealth] = useState<Health | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "demo">(
    "connecting",
  );
  const [samples, setSamples] = useState<SampleSummary[]>(
    demos.map((d) => d.summary),
  );
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    // A sleeping free-tier API (Render) takes up to a minute to wake, longer than
    // one request timeout. Keep retrying so photo upload turns on once it is up.
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const attempt = (n: number) =>
      connect()
        .then(([h, s]) => {
          if (active) {
            setHealth(h);
            setSamples(s);
            setConnection("live");
          }
        })
        .catch(() => {
          if (!active) return;
          setConnection((c) => (c === "live" ? c : "demo"));
          if (n < 20) retry = setTimeout(() => attempt(n + 1), 5000);
        });
    attempt(1);
    return () => {
      active = false;
      clearTimeout(retry);
    };
  }, []);

  function navigate(target: View) {
    setView(target);
    setMobileMenu(false);
    setError(null);
  }
  function reset() {
    setLedger(null);
    setResult(null);
    setWarnings([]);
    setCached(false);
    setConfirmReset(false);
    navigate("overview");
  }
  async function loadSample(id: string) {
    setBusy("Opening your sample ledger…");
    setError(null);
    try {
      let data: Ledger;
      try {
        data = await request<Ledger>(`/api/samples/${id}`, undefined, 5000);
      } catch {
        const demo = demos.find((d) => d.summary.id === id);
        if (!demo) throw new Error("This sample isn't available right now.");
        data = structuredClone(demo.ledger);
        setConnection("demo");
      }
      setLedger(data);
      setResult(null);
      setWarnings([]);
      setCached(false);
      navigate("ledger");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function upload(files: File[], append = false) {
    setBusy("Reading your ledger… Photos can take up to a minute.");
    setError(null);
    try {
      const data = await extract(files);
      const next: Ledger = {
        business_name: data.business_name,
        entries: data.entries,
        pages: data.pages,
      };
      setLedger(append && ledger ? appendLedger(ledger, next) : next);
      setResult(null);
      setCached(false);
      setWarnings(data.warnings);
      navigate("ledger");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  function updateLedger(next: Ledger) {
    setLedger(next);
    setResult(null);
    setCached(false);
    setError(null);
  }
  async function runAnalysis() {
    if (!ledger) return;
    const invalid = validateLedger(ledger);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy("Building your credit profile and explanations…");
    setError(null);
    try {
      let data: AnalyzeResponse;
      try {
        data = await analyze(ledger);
        setCached(false);
        setConnection("live");
      } catch (e) {
        const snapshot = cachedAnalysis(ledger);
        if (!snapshot) throw e;
        data = snapshot;
        setCached(true);
        setConnection("demo");
      }
      setResult(data);
      navigate("report");
    } catch (e) {
      setError(
        (e as Error).message +
          " Edited ledgers need the live service to calculate a new score.",
      );
    } finally {
      setBusy(null);
    }
  }

  const nav = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutDashboard,
      enabled: true,
    },
    {
      id: "ledger" as const,
      label: "My ledger",
      icon: BookOpen,
      enabled: !!ledger,
    },
    {
      id: "report" as const,
      label: "Credit report",
      icon: ChartNoAxesCombined,
      enabled: !!result,
    },
  ];
  const photoAvailable = connection === "live" && !!health?.llm_enabled;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${mobileMenu ? "is-open" : ""}`}
        aria-label="Main navigation"
        onKeyDown={(e) => {
          if (e.key === "Escape") setMobileMenu(false);
        }}
      >
        <button
          className="brand-button"
          onClick={() => navigate("overview")}
          aria-label="Khata home"
        >
          <Brand />
        </button>
        <div className="workspace-label">
          <span className="workspace-avatar">UM</span>
          <div>
            Team workspace<small>Uswa & Mutahar</small>
          </div>
          <span className="workspace-tier">DEMO</span>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
              disabled={!item.enabled || !!busy}
              aria-current={view === item.id ? "page" : undefined}
              title={
                !item.enabled
                  ? item.id === "ledger"
                    ? "Open a sample or upload a ledger first"
                    : "Analyse your ledger to see a report"
                  : undefined
              }
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {view === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <button
          className="new-assessment"
          onClick={() =>
            ledger ? setConfirmReset(true) : navigate("overview")
          }
          disabled={!!busy}
        >
          <Plus size={17} /> New assessment
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="mini-star">
              <Sparkles size={16} />
            </span>
            <strong>Every entry tells a story.</strong>
            <p>Let your business records open new possibilities.</p>
            <button onClick={() => navigate("method")}>
              See how it works <ArrowRight size={14} />
            </button>
          </div>
          <button
            className={`nav-item ${view === "method" ? "active" : ""}`}
            onClick={() => navigate("method")}
            aria-current={view === "method" ? "page" : undefined}
          >
            <CircleHelp size={19} /> How it works
          </button>
          <div className="sidebar-credit">
            Built for small businesses.
            <br />
            <span>AICON ’26 · Financial Operations</span>
          </div>
        </div>
      </aside>
      <div className="main-shell" inert={mobileMenu}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
              aria-expanded={mobileMenu}
              aria-controls="workspace-navigation"
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>
              {
                {
                  overview: "Overview",
                  ledger: "My ledger",
                  report: "Credit report",
                  method: "How it works",
                }[view]
              }
            </strong>
          </div>
          <div className="topbar-right">
            <span className={`connection-status ${connection}`}>
              <span />
              {connection === "connecting"
                ? "Connecting"
                : connection === "live"
                  ? "Service connected"
                  : "Sample demo"}
            </span>
            <span className="topbar-divider" />
            <span className="user-avatar" title="Team Uswa & Mutahar">
              UM
            </span>
          </div>
        </header>
        <main id="main-content" className="content">
          {busy && (
            <div className="notice progress-notice" role="status">
              <LoaderCircle size={19} className="spin" />
              <span>{busy}</span>
            </div>
          )}
          {error && (
            <div className="notice error-notice" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <UploadView
              samples={samples}
              photoAvailable={photoAvailable}
              online={connection === "live"}
              busy={!!busy}
              onSample={loadSample}
              onUpload={(files) => upload(files)}
              onMethod={() => navigate("method")}
              onResume={ledger ? () => navigate("ledger") : undefined}
            />
          )}
          {view === "ledger" && ledger && (
            <LedgerView
              ledger={ledger}
              flags={result?.flags || []}
              warnings={warnings}
              onChange={updateLedger}
              onAnalyze={runAnalysis}
              onUpload={(files) => upload(files, true)}
              onBack={() => navigate("overview")}
              busy={!!busy}
              photoAvailable={photoAvailable}
              online={connection === "live"}
            />
          )}
          {view === "report" && result && (
            <ReportView
              result={result}
              cached={cached}
              onEdit={() => navigate("ledger")}
              onMethod={() => navigate("method")}
            />
          )}
          {view === "method" && (
            <MethodView
              model={
                result?.model_info ||
                health?.model ||
                demos[0].analysis.model_info
              }
              onStart={() => navigate("overview")}
            />
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} /> A clearer picture. A fairer starting
              point.
            </span>
            <span>
              Khata-to-Credit <span className="footer-dot">·</span> Team Uswa &
              Mutahar
            </span>
          </footer>
        </main>
      </div>
      {confirmReset && (
        <ResetDialog
          onCancel={() => setConfirmReset(false)}
          onConfirm={reset}
        />
      )}
    </div>
  );
}
