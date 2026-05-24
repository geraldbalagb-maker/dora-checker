"use client";

import { useState } from "react";
import { DoraClause, DoraReport, ClauseStatus, STATUS_CFG } from "@/lib/types";

/* ── Score ring ───────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const r = 52, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 70 70)" />
        <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="28" fontWeight="700">{score}</text>
        <text x="70" y="92" textAnchor="middle" fill="#6b7280" fontSize="11">/100</text>
      </svg>
      <span className="text-xs text-gray-500 uppercase tracking-widest">Conformità Art. 30</span>
    </div>
  );
}

/* ── Clause card ──────────────────────────────────────────────── */
function ClauseCard({ clause }: { clause: DoraClause }) {
  const cfg = STATUS_CFG[clause.status];
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">{clause.nome}</p>
          <p className="text-xs text-gray-600 mt-0.5">{clause.riferimento_normativo}</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      {clause.estratto && (
        <blockquote className="text-xs text-gray-400 italic border-l-2 border-white/10 pl-3 leading-relaxed">
          &quot;{clause.estratto}&quot;
        </blockquote>
      )}
      <p className="text-sm text-gray-300">{clause.note}</p>
    </div>
  );
}

/* ── Draft card ───────────────────────────────────────────────── */
function DraftCard({ clause }: { clause: DoraClause }) {
  const [copied, setCopied] = useState(false);
  const cfg = STATUS_CFG[clause.status];

  async function copyDraft() {
    if (!clause.bozza_paragrafo) return;
    try {
      await navigator.clipboard.writeText(clause.bozza_paragrafo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard not available in some envs */
    }
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-5
                    flex flex-col gap-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">{clause.nome}</p>
          <p className="text-xs text-gray-600 mt-0.5">{clause.riferimento_normativo}</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Draft text box */}
      <div className="relative rounded-lg border border-white/[0.07] bg-black/50 px-4 pt-5 pb-4">
        {/* Floating label */}
        <span className="absolute -top-[9px] left-3 bg-black px-2
                         text-[10px] uppercase tracking-widest text-violet-400/60">
          Bozza clausola
        </span>
        <p className="text-sm text-gray-300 leading-[1.75] whitespace-pre-wrap">
          {clause.bozza_paragrafo}
        </p>
      </div>

      {/* Copy button */}
      <div className="flex justify-end">
        <button
          onClick={copyDraft}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
                      border transition-all duration-200 ${
            copied
              ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-400"
              : "bg-violet-500/8 border-violet-500/20 text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/35"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              Copiato!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copia testo
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Filter tab ───────────────────────────────────────────────── */
type FilterValue = "tutti" | ClauseStatus | "bozze";

function FilterTab({ label, count, active, onClick, accent }: {
  label: string; count: number; active: boolean; onClick: () => void;
  accent?: "violet";
}) {
  const violetActive   = "bg-violet-500/15 text-violet-200 border border-violet-500/30";
  const violetInactive = "text-violet-400/60 hover:text-violet-300 border border-transparent";
  const defaultActive  = "bg-white/10 text-white border border-white/20";
  const defaultInactive = "text-gray-500 hover:text-gray-300 border border-transparent";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
                  transition-all duration-200 ${
        active
          ? accent === "violet" ? violetActive  : defaultActive
          : accent === "violet" ? violetInactive : defaultInactive
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
        active
          ? accent === "violet" ? "bg-violet-500/25 text-violet-200" : "bg-white/20 text-white"
          : "bg-white/5 text-gray-600"
      }`}>
        {count}
      </span>
    </button>
  );
}

/* ── Main dashboard ───────────────────────────────────────────── */
interface Props {
  report: DoraReport;
  onReset: () => void;
  /** Label for the back button — defaults to "Nuova analisi" */
  backLabel?: string;
}

export default function ResultsDashboard({ report, onReset, backLabel = "Nuova analisi" }: Props) {
  const [filter, setFilter] = useState<FilterValue>("tutti");

  const presente   = report.clausole.filter(c => c.status === "presente").length;
  const mancante   = report.clausole.filter(c => c.status === "mancante").length;
  const incompleta = report.clausole.filter(c => c.status === "incompleta").length;
  const bozzeList  = report.clausole.filter(c => !!c.bozza_paragrafo);

  const isBozzeTab = filter === "bozze";

  const filtered = isBozzeTab
    ? bozzeList
    : filter === "tutti"
      ? report.clausole
      : report.clausole.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Fixed glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{
          position: "absolute", width: 700, height: 500, top: -200, left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl
                         border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm">D</span>
              </div>
              <span className="font-semibold text-sm tracking-tight hidden sm:block">
                DORA Checker
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backLabel}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* PDF print button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white
                         border border-white/[0.08] hover:border-white/20 rounded-full px-3 py-1.5
                         transition-all print:hidden"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Stampa PDF
            </button>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10
                             border border-emerald-500/20 rounded-full px-3 py-1.5">
              <span className="font-bold">{presente}</span> Presenti
            </span>
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10
                             border border-amber-500/20 rounded-full px-3 py-1.5">
              <span className="font-bold">{incompleta}</span> Incomplete
            </span>
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10
                             border border-red-500/20 rounded-full px-3 py-1.5">
              <span className="font-bold">{mancante}</span> Mancanti
            </span>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 flex flex-col gap-10">

        {/* Score card */}
        <div className="flex flex-col md:flex-row gap-8 items-center
                        border border-white/[0.06] rounded-2xl bg-white/[0.02] p-8">
          <ScoreRing score={report.punteggio_conformita} />
          <div className="flex-1 flex flex-col gap-4">
            <p className="text-gray-300 leading-relaxed">{report.sommario}</p>
            <div className="flex gap-5 text-sm">
              <span className="text-emerald-400">{presente} Presenti</span>
              <span className="text-amber-400">{incompleta} Incomplete</span>
              <span className="text-red-400">{mancante} Mancanti</span>
            </div>
            <p className="text-xs text-gray-600">
              {report.pagine_analizzate} pag · {report.caratteri_analizzati.toLocaleString()} caratteri
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div>
          <div className="flex items-center gap-1 mb-6 flex-wrap">
            <FilterTab label="Tutti"      count={report.clausole.length} active={filter === "tutti"}      onClick={() => setFilter("tutti")} />
            <FilterTab label="Presenti"   count={presente}               active={filter === "presente"}   onClick={() => setFilter("presente")} />
            <FilterTab label="Incomplete" count={incompleta}             active={filter === "incompleta"} onClick={() => setFilter("incompleta")} />
            <FilterTab label="Mancanti"   count={mancante}               active={filter === "mancante"}   onClick={() => setFilter("mancante")} />

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            <FilterTab
              label="✦ Bozze pronte"
              count={bozzeList.length}
              active={filter === "bozze"}
              onClick={() => setFilter("bozze")}
              accent="violet"
            />
          </div>

          {/* Bozze tab intro banner */}
          {isBozzeTab && bozzeList.length > 0 && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-violet-500/15
                            bg-violet-500/[0.04] px-4 py-3">
              <svg className="w-4 h-4 text-violet-400/70 shrink-0 mt-0.5" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-xs text-violet-300/70 leading-relaxed">
                Bozze generate dall&apos;AI pronte da copiare nel contratto.
                Rivedi sempre con il team legale prima dell&apos;uso in documenti ufficiali.
              </p>
            </div>
          )}

          {/* Card list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">
              {isBozzeTab
                ? "Nessuna bozza richiesta — il contratto risulta conforme per tutte le clausole."
                : "Nessuna clausola con questo stato."}
            </div>
          ) : isBozzeTab ? (
            <div className="flex flex-col gap-4">
              {filtered.map((c, i) => <DraftCard key={i} clause={c} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((c, i) => <ClauseCard key={i} clause={c} />)}
            </div>
          )}
        </div>

        {/* Raccomandazioni */}
        {!isBozzeTab && report.raccomandazioni.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-4">
              Raccomandazioni
            </h2>
            <ul className="flex flex-col gap-3">
              {report.raccomandazioni.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-cyan-500 mt-0.5 shrink-0">→</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center">
              <span className="text-black font-bold text-[8px]">D</span>
            </div>
            <span className="text-xs text-gray-600">DORA Checker · Reg. UE 2022/2554</span>
          </div>
          <p className="text-xs text-gray-700">
            Non costituisce consulenza legale. Verificare con un legale qualificato.
          </p>
        </div>
      </footer>
    </div>
  );
}
