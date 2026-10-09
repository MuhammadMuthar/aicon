import demoData from "./demo-data.json";
import type { AnalyzeResponse, Health, Ledger, SampleSummary } from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
export const demos = demoData as {
  summary: SampleSummary;
  ledger: Ledger;
  analysis: AnalyzeResponse;
}[];

export async function request<T>(
  path: string,
  init?: RequestInit,
  timeout = 10000,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeout),
  }).catch((error: Error) => {
    throw new Error(
      error.name === "TimeoutError"
        ? "The service is taking longer than expected. Please try again."
        : "We couldn't reach the analysis service. Check your connection or try a sample.",
    );
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.detail === "string"
        ? body.detail
        : `Please check your ledger and try again (${response.status}).`,
    );
  }
  return response.json();
}

export function connect() {
  return Promise.all([
    request<Health>("/health"),
    request<SampleSummary[]>("/api/samples"),
  ]);
}
export function extract(files: File[]) {
  validateFiles(files);
  const data = new FormData();
  files.forEach((file) => data.append("files", file));
  return request<Ledger & { source: "gemini" | "csv"; warnings: string[] }>(
    "/api/extract",
    { method: "POST", body: data },
    90000,
  );
}
export function validateFiles(files: File[]) {
  if (!files.length) throw new Error("Choose a photo or CSV to continue.");
  if (files.length > 6)
    throw new Error("You can upload up to 6 photos at a time.");
  if (files.some((f) => f.size > 8 * 1024 * 1024))
    throw new Error("Each file must be 8 MB or smaller.");
  const csvs = files.filter((f) => /\.csv$/i.test(f.name));
  if (csvs.length && files.length !== 1)
    throw new Error("Upload one CSV at a time, without photos.");
  if (
    !csvs.length &&
    files.some((f) => !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))
  )
    throw new Error("Use JPEG, PNG, WebP, HEIC photos, or one CSV file.");
}
export function validateLedger(ledger: Ledger): string | null {
  if (!ledger.entries.length) return "Add at least one entry before analysing.";
  const invalid = ledger.entries.findIndex(
    (e) =>
      !e.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      !Number.isFinite(e.amount) ||
      e.amount <= 0,
  );
  return invalid >= 0
    ? `Entry ${invalid + 1} needs a valid date and an amount greater than zero.`
    : null;
}
export function appendLedger(current: Ledger, added: Ledger): Ledger {
  const max = Math.max(
    0,
    ...current.pages.map((p) => p.page),
    ...current.entries.map((e) => e.page || 0),
  );
  // Map each incoming page once, including a source whose rows have no page number.
  const sourcePages = [
    ...new Set([
      ...added.pages.map((p) => p.page),
      ...added.entries.map((e) => e.page ?? 1),
    ]),
  ].sort((a, b) => a - b);
  const mapping = new Map(
    sourcePages.map((page, index) => [page, max + index + 1]),
  );
  return {
    business_name: current.business_name || added.business_name,
    entries: [
      ...current.entries,
      ...added.entries.map((e) => ({ ...e, page: mapping.get(e.page ?? 1)! })),
    ],
    pages: [
      ...current.pages,
      ...sourcePages.map((page) => ({
        ...added.pages.find((p) => p.page === page),
        page: mapping.get(page)!,
      })),
    ],
  };
}
export function cachedAnalysis(ledger: Ledger): AnalyzeResponse | null {
  // Never present a precomputed score for an edited ledger.
  const sample = demos.find(
    (s) => JSON.stringify(s.ledger) === JSON.stringify(ledger),
  );
  return sample?.analysis ?? null;
}
export function analyze(ledger: Ledger) {
  return request<AnalyzeResponse>(
    "/api/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...ledger,
        explain: true,
        languages: ["en", "ur"],
      }),
    },
    60000,
  );
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value);
export const compact = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
