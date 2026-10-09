import type { Metadata } from "next";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/noto-nastaliq-urdu/arabic-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khata — Small business. Bigger possibilities.",
  description:
    "Turn your everyday business ledger into a clear, explainable credit-readiness profile. A Khata-to-Credit demonstration by Team Uswa & Mutahar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
