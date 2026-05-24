"use client";

import { useRef, useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import ResultsDashboard from "@/components/ResultsDashboard";
import { DoraReport } from "@/lib/types";

/* ── Glow blob ────────────────────────────────────────────────── */
function GlowBlob({ style }: { style: React.CSSProperties }) {
  return (
    <div aria-hidden style={{
      position: "absolute", borderRadius: "50%",
      filter: "blur(90px)", pointerEvents: "none", ...style,
    }} />
  );
}

/* ── Feature card ─────────────────────────────────────────────── */
function FeatureCard({ icon, title, description, tag }: {
  icon: React.ReactNode; title: string; description: string; tag: string;
}) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-white/[0.07]
                    bg-white/[0.02] p-6 hover:border-cyan-500/25 hover:bg-white/[0.04]
                    transition-all duration-300 cursor-default overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,212,255,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="w-10 h-10 rounded-xl border border-cyan-500/20 bg-cyan-500/5
                        flex items-center justify-center text-cyan-400">{icon}</div>
        <span className="text-[10px] uppercase tracking-widest text-cyan-500/70 font-medium">{tag}</span>
        <h3 className="font-semibold text-white leading-snug">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function Home() {
  const [dragging, setDragging]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [loadingStep, setLoadingStep]   = useState<0 | 1 | 2>(0);
  const [error, setError]               = useState<string | null>(null);
  const [report, setReport]             = useState<DoraReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);

  /* ── Reset to idle ── */
  function reset() {
    setReport(null);
    setError(null);
    setSelectedFile(null);
    setLoading(false);
    setLoadingStep(0);
  }

  /* ── Core upload logic ── */
  async function doUpload(file: File) {
    setLoading(true);
    setError(null);
    setReport(null);
    setLoadingStep(0);

    // Step 0 → 1 after a short delay
    const t1 = setTimeout(() => setLoadingStep(1), 500);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyze-contract", { method: "POST", body: fd });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail ?? j.error ?? `HTTP ${res.status}`);
      }

      const data: DoraReport = await res.json();
      setLoadingStep(2);
      // brief pause so the user sees step 3 light up
      await new Promise(r => setTimeout(r, 400));
      setReport(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore durante l'analisi.");
    } finally {
      clearTimeout(t1);
      setLoading(false);
      setLoadingStep(0);
    }
  }

  /* ── Demo ── */
  async function runDemo() {
    setLoading(true);
    setError(null);
    setReport(null);
    setSelectedFile(null);
    setLoadingStep(0);

    const t1 = setTimeout(() => setLoadingStep(1), 500);

    try {
      const res = await fetch("/api/analyze-contract/demo");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail ?? j.error ?? `HTTP ${res.status}`);
      }
      const data: DoraReport = await res.json();
      setLoadingStep(2);
      await new Promise(r => setTimeout(r, 400));
      setReport(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nella demo.");
    } finally {
      clearTimeout(t1);
      setLoading(false);
      setLoadingStep(0);
    }
  }

  /* ── Drag-and-drop ── */
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Solo file PDF."); return; }
    setSelectedFile(f);
    setError(null);
  }

  /* ── File input change ── */
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Solo file PDF."); return; }
    setSelectedFile(f);
    setError(null);
  }

  /* ── Truncate filename for display ── */
  function displayName(name: string) {
    return name.length > 42 ? name.slice(0, 39) + "…" : name;
  }

  /* ─────────────────────────────────────────────────────────────
     STATE 2 — Loading overlay (full screen)
  ───────────────────────────────────────────────────────────── */
  if (loading) {
    return <LoadingOverlay step={loadingStep} />;
  }

  /* ─────────────────────────────────────────────────────────────
     STATE 3 — Results dashboard (full-page switch)
  ───────────────────────────────────────────────────────────── */
  if (report) {
    return <ResultsDashboard report={report} onReset={reset} />;
  }

  /* ─────────────────────────────────────────────────────────────
     STATE 0 / 1 — Landing (idle or file selected)
  ───────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Fixed glow atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowBlob style={{ width: 800, height: 800, top: -300, left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.11) 0%, transparent 65%)" }} />
        <GlowBlob style={{ width: 500, height: 500, top: "55%", left: "5%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <GlowBlob style={{ width: 400, height: 400, top: "45%", right: "3%",
          background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">DORA Checker</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="text-xs text-gray-500 hover:text-white transition-colors px-1">
              Login
            </button>
            <button
              onClick={runDemo}
              disabled={loading || !!selectedFile}
              style={{ border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.06)" }}
              className="px-4 py-2 text-xs text-cyan-300 font-medium rounded-full
                         hover:bg-cyan-500/10 transition-all disabled:opacity-40 whitespace-nowrap">
              ✦ Demo AWS
            </button>
            <button className="px-4 py-2 text-xs text-black font-semibold
                               bg-white rounded-full hover:bg-gray-100 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center pt-40 pb-28 px-6">

        <h1 className="font-bold tracking-tight leading-[1.08] mb-6">
          <span className="block text-4xl md:text-5xl lg:text-6xl text-white">
            Conformità DORA ICT
          </span>
          <span className="block text-4xl md:text-5xl lg:text-6xl" style={{
            background: "linear-gradient(135deg, #00d4ff 0%, #818cf8 50%, #7c3aed 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            in 15 secondi
          </span>
        </h1>

        <p className="max-w-lg text-base leading-relaxed mb-12"
           style={{ color: "rgba(125,211,252,0.75)" }}>
          Il Checker AI per l&apos;Articolo 30 del DORA. Mappa rischi, rileva criticità,
          genera report istantanei. Zero lavoro manuale.
        </p>

        {/* Glow behind search bar */}
        <div aria-hidden className="absolute pointer-events-none"
          style={{ width: 700, height: 300, bottom: 80, left: "50%", transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(0,180,255,0.13) 0%, transparent 70%)",
            filter: "blur(30px)" }} />

        {/* ── Search bar ── */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-3">
          <div
            className="hero-border w-full"
            style={{ borderRadius: "9999px",
                     boxShadow: "0 0 60px rgba(0,212,255,0.1), 0 0 120px rgba(0,212,255,0.04)" }}
          >
            <div
              className="hero-border-inner flex items-center gap-4 px-7 py-5"
              style={{ borderRadius: "9999px" }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={selectedFile ? undefined : () => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                onChange={onFileChange} />

              {selectedFile ? (
                /* ── State 1: file selected ── */
                <>
                  {/* Filename */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-white truncate select-none">
                      {displayName(selectedFile.name)}
                    </span>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); setError(null); }}
                    className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none"
                    aria-label="Rimuovi file"
                  >
                    ×
                  </button>

                  {/* Analizza CTA */}
                  <button
                    onClick={e => { e.stopPropagation(); doUpload(selectedFile); }}
                    style={{ background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)" }}
                    className="shrink-0 px-5 py-2 rounded-full text-xs font-semibold text-white
                               hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                  >
                    Analizza →
                  </button>
                </>
              ) : (
                /* ── State 0: idle placeholder ── */
                <>
                  <span className={`flex-1 text-base text-left select-none cursor-pointer
                                   ${dragging ? "text-cyan-300" : "text-gray-500"}`}>
                    {dragging ? "Rilascia il PDF qui…" : "Trascina il PDF del contratto qui..."}
                  </span>

                  {/* Upload icon */}
                  <div className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legal note */}
          <p className="text-[11px] text-gray-700 max-w-md">
            Caricando il file confermi di averne il diritto. Elaborazione in RAM · zero data retention.
          </p>

          {/* ── Error card ── */}
          {error && (
            <div className="w-full rounded-xl border border-red-500/25 bg-red-500/5 p-4
                            flex items-start gap-3">
              <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => { setError(null); inputRef.current?.click(); }}
                className="shrink-0 text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-2"
              >
                Riprova
              </button>
            </div>
          )}
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-cyan-500/50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Analisi 8 clausole Art. 30
          </span>
          <span className="text-gray-800">·</span>
          <span>Claude AI · claude-sonnet-4-6</span>
          <span className="text-gray-800">·</span>
          <span>No storage</span>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-widest text-cyan-500/50 mb-3">Funzionalità</p>
          <h2 className="text-2xl md:text-3xl font-bold">
            Tutto ciò che serve per la compliance DORA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            tag="Art. 30 · c.3 · c.f"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            }
            title="Analisi Catena di Sub-fornitura"
            description="Mappatura automatica dei sub-fornitori ICT citati nel contratto. Identifica lacune nella catena di responsabilità previste dall'Art. 30."
          />
          <FeatureCard
            tag="Fornitori Critici DORA"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
            title="Rilevazione Fornitori Critici (CTPP)"
            description="Allarme automatico se il contratto manca dei requisiti aggiuntivi obbligatori per i fornitori ICT critici designati dall'UE."
          />
          <FeatureCard
            tag="Gap Analysis AI"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
            title="Risparmio Tempo Legale"
            description="Estrae le clausole esatte dal testo del contratto e genera un report di gap analysis pronto per il team legale in 15 secondi."
          />
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="relative max-w-6xl mx-auto px-6 pb-28">
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="grid md:grid-cols-2">

            <div className="p-10 md:p-14 flex flex-col justify-center gap-6
                            border-b md:border-b-0 md:border-r border-white/[0.06]">
              <p className="text-xs uppercase tracking-widest text-cyan-500/60">Prova ora</p>
              <h2 className="text-2xl md:text-3xl font-bold leading-snug">
                Metti alla prova<br />un contratto reale
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Registra l&apos;account per caricare i tuoi contratti riservati in totale sicurezza.
                Elaborazione in memoria, zero data retention.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button style={{ background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)" }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                             hover:opacity-90 transition-opacity">
                  Crea account gratuito
                </button>
                <button onClick={runDemo}
                  className="px-5 py-2.5 rounded-xl text-sm text-gray-400 border border-white/10
                             hover:border-white/20 hover:text-white transition-all">
                  Prova la demo →
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center p-10 md:p-14">
              <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{ width: 320, height: 320, filter: "blur(40px)",
                  background: "radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 70%)" }} />
              </div>

              <div style={{ boxShadow: "0 0 0 1px rgba(0,212,255,0.18), 0 0 40px rgba(0,212,255,0.06)" }}
                className="relative w-full max-w-xs rounded-2xl border border-cyan-500/20
                           bg-black/60 backdrop-blur p-8 flex flex-col items-center gap-5 text-center">
                <div className="w-14 h-14 rounded-2xl border border-cyan-500/25 bg-cyan-500/5
                                flex items-center justify-center text-cyan-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">Carica il tuo contratto</p>
                  <p className="text-gray-500 text-xs">PDF · Max 20 MB · Solo in RAM</p>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {["SLA", "Audit", "MTTR", "Exit Strategy", "Incidenti ICT"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[10px]
                                               border border-cyan-500/15 bg-cyan-500/5
                                               text-cyan-400/70 tracking-wide">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl text-xs font-semibold
                                   bg-white text-black hover:bg-gray-100 transition-colors">
                  Accedi per caricare →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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

    </main>
  );
}
