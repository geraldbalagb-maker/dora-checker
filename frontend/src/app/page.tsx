"use client";

import { useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ClauseStatus = "presente" | "mancante" | "incompleta";

interface DoraClause {
  nome: string;
  riferimento_normativo: string;
  status: ClauseStatus;
  estratto?: string;
  note: string;
}

interface DoraReport {
  punteggio_conformita: number;
  sommario: string;
  clausole: DoraClause[];
  raccomandazioni: string[];
  pagine_analizzate: number;
  caratteri_analizzati: number;
}

const STATUS_CONFIG: Record<ClauseStatus, { label: string; color: string; bg: string }> = {
  presente: { label: "Presente", color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700" },
  mancante: { label: "Mancante", color: "text-red-400", bg: "bg-red-900/30 border-red-700" },
  incompleta: { label: "Incompleta", color: "text-amber-400", bg: "bg-amber-900/30 border-amber-700" },
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#374151" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="28" fontWeight="700">{score}</text>
        <text x="70" y="92" textAnchor="middle" fill="#9ca3af" fontSize="11">/100</text>
      </svg>
      <span className="text-sm text-gray-400">Punteggio conformità Art. 30</span>
    </div>
  );
}

export default function Home() {
  const [dragging, setDragging] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DoraReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function postFile(formData: FormData) {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze-contract`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Errore sconosciuto" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setReport(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore durante l'analisi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze-contract/demo`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nella demo.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Solo file PDF sono accettati.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    postFile(fd);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm">D</div>
        <span className="font-semibold text-lg">DORA Checker</span>
        <span className="ml-2 text-xs text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-800">
          Reg. UE 2022/2554 — Art. 30
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Hero */}
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Verifica la conformità DORA dei tuoi contratti ICT
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Carica il contratto con il tuo fornitore IT. Claude AI analizza le 8 clausole
            obbligatorie dell&apos;Articolo 30 e genera un report di conformità istantaneo.
          </p>
        </div>

        {/* Upload area */}
        <div className="flex flex-col gap-4">
          {/* Legal checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none text-sm text-gray-400">
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(e) => setLegalAccepted(e.target.checked)}
              className="mt-0.5 accent-blue-500 w-4 h-4"
            />
            <span>
              Confermo di avere il diritto di caricare questo documento e di non includere
              dati personali di terzi. I dati vengono elaborati in memoria e non vengono
              archiviati permanentemente.
            </span>
          </label>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => legalAccepted && inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-colors
              ${dragging ? "border-blue-500 bg-blue-900/20" : "border-gray-700 bg-gray-900/50"}
              ${legalAccepted ? "cursor-pointer hover:border-blue-600 hover:bg-gray-900" : "opacity-50 cursor-not-allowed"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-300">Trascina il PDF qui oppure clicca per selezionare</p>
              <p className="text-sm text-gray-500 mt-1">Limite: 20 MB · Solo file .pdf</p>
            </div>
          </div>

          {/* Demo button */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-sm text-gray-500">oppure</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Analizza Contratto Demo (AWS Cloud Services Agreement)
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Analisi in corso con Claude AI — potrebbe richiedere 15-30 secondi…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-700 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Report */}
        {report && !loading && <ReportView report={report} />}
      </div>
    </main>
  );
}

function ReportView({ report }: { report: DoraReport }) {
  const presente = report.clausole.filter((c) => c.status === "presente").length;
  const mancante = report.clausole.filter((c) => c.status === "mancante").length;
  const incompleta = report.clausole.filter((c) => c.status === "incompleta").length;

  return (
    <div className="flex flex-col gap-8">
      <hr className="border-gray-800" />

      {/* Score + summary */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <ScoreRing score={report.punteggio_conformita} />
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-gray-300 leading-relaxed">{report.sommario}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">{presente} Presenti</span>
            <span className="text-amber-400">{incompleta} Incomplete</span>
            <span className="text-red-400">{mancante} Mancanti</span>
          </div>
          <p className="text-xs text-gray-600">
            {report.pagine_analizzate} pagine · {report.caratteri_analizzati.toLocaleString()} caratteri analizzati
          </p>
        </div>
      </div>

      {/* Clause cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Clausole Art. 30 — Analisi dettagliata</h2>
        <div className="grid gap-3">
          {report.clausole.map((clause, i) => {
            const cfg = STATUS_CONFIG[clause.status];
            return (
              <div key={i} className={`rounded-xl border p-5 flex flex-col gap-2 ${cfg.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{clause.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{clause.riferimento_normativo}</p>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                {clause.estratto && (
                  <blockquote className="text-xs text-gray-400 italic border-l-2 border-gray-600 pl-3 leading-relaxed">
                    &quot;{clause.estratto}&quot;
                  </blockquote>
                )}
                <p className="text-sm text-gray-300">{clause.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {report.raccomandazioni.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Raccomandazioni</h2>
          <ul className="flex flex-col gap-2">
            {report.raccomandazioni.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
