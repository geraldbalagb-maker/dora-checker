import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DORA Checker — Conformità Contratti ICT | Art. 30 Reg. UE 2022/2554",
  description:
    "Analizza i contratti con i tuoi fornitori ICT e verifica la conformità all'Articolo 30 del Digital Operational Resilience Act (DORA).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
