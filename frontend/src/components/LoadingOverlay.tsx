"use client";

import { useEffect, useState } from "react";

/* ── Config ───────────────────────────────────────────────────── */
const STEPS = [
  "Estrazione testo PDF",
  "Analisi clausole Art. 30",
  "Generazione report",
];

const STATUS_TEXTS = [
  "Lettura contratto in corso…",
  "Identificazione clausole SLA…",
  "Analisi obblighi sub-fornitori ICT…",
  "Verifica requisiti exit strategy…",
  "Controllo MTTR e RTO…",
  "Mappatura responsabilità fornitore…",
  "Valutazione catena di fornitura…",
  "Confronto con Art. 30 DORA…",
];

const CHIPS: { text: string; delay: number; pos: React.CSSProperties }[] = [
  { text: "Art. 30",       delay: 0.0, pos: { left:  -4, top: 38 } },
  { text: "SLA",           delay: 1.3, pos: { right: -4, top: 28 } },
  { text: "Sub-fornitori", delay: 0.6, pos: { left: -14, top: 98 } },
  { text: "ICT Risk",      delay: 1.9, pos: { right:-12, top: 88 } },
  { text: "Exit Strategy", delay: 1.0, pos: { left:  20, top:175 } },
  { text: "DORA",          delay: 2.4, pos: { right: 18, top:180 } },
];

/* ── Sub-components ───────────────────────────────────────────── */
function MiniSpinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      className="animate-spin text-cyan-400">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
        className="opacity-20" />
      <path fill="currentColor" className="opacity-90"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"
      className="text-emerald-400">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
    </svg>
  );
}

/* ── Document card with scan beam ─────────────────────────────── */
function DocumentCard() {
  // text lines: [width%, isCyan]
  const lines: [number, boolean][] = [
    [88, false], // title row — full width
    [72, true ], // already scanned (top rows appear cyan)
    [60, true ],
    [18, false], // clause number stub
    [82, false],
    [68, false],
    [50, false],
    [76, false],
    [42, false],
  ];

  return (
    <div
      style={{
        position: "relative",
        width: 118,
        height: 152,
        background: "#080808",
        borderRadius: 8,
        overflow: "hidden",
        animation: "doc-glow 3s ease-in-out infinite",
      }}
    >
      {/* Dog-ear fold — top-right */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: "solid",
        borderWidth: "20px 20px 0 0",
        borderColor: "#000 #000 transparent transparent",
        zIndex: 2,
      }} />
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 20, height: 20,
        background: "linear-gradient(135deg, transparent 50%, rgba(0,212,255,0.08) 50%)",
        borderLeft: "1px solid rgba(0,212,255,0.12)",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        zIndex: 3,
      }} />

      {/* Text lines */}
      {lines.map(([w, cyan], i) => (
        <div key={i} style={{
          position: "absolute",
          left: 12,
          top: 20 + i * 14,
          width: `${w}%`,
          height: i === 0 ? 6 : 4,
          borderRadius: 3,
          background: cyan
            ? "rgba(0,212,255,0.22)"
            : "rgba(255,255,255,0.07)",
          transition: "background 0.3s",
        }} />
      ))}

      {/* Scanlines texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.015) 3px, rgba(0,212,255,0.015) 4px)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Scan beam */}
      <div style={{
        position: "absolute",
        left: 0, right: 0,
        top: 0,
        height: 2,
        background: "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 15%, #00d4ff 40%, rgba(0,212,255,1) 50%, #00d4ff 60%, rgba(0,212,255,0.3) 85%, transparent 100%)",
        boxShadow: "0 0 10px 3px rgba(0,212,255,0.45), 0 0 24px 6px rgba(0,212,255,0.15)",
        animation: "scan-beam 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        zIndex: 4,
      }} />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
interface Props {
  step: 0 | 1 | 2;
}

export default function LoadingOverlay({ step }: Props) {
  const [statusIdx, setStatusIdx] = useState(0);

  // Cycle status text every 2 s
  useEffect(() => {
    const id = setInterval(
      () => setStatusIdx(i => (i + 1) % STATUS_TEXTS.length),
      2000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#000" }}
      className="flex flex-col items-center justify-center">

      {/* ── Dot-grid background texture ── */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* ── Central glow ── */}
      <div aria-hidden style={{
        position: "absolute",
        width: 640, height: 480,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, rgba(0,212,255,0.10) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)",
        filter: "blur(50px)",
        pointerEvents: "none",
      }} />

      {/* ── Content stack ── */}
      <div className="relative flex flex-col items-center gap-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center">
            <span className="text-black font-bold text-base">D</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">DORA Checker</span>
        </div>

        {/* ── Central piece: pulse rings + doc card + floating chips ── */}
        <div style={{ position: "relative", width: 240, height: 200 }}>

          {/* Pulse ring 1 */}
          <div style={{
            position: "absolute",
            top: "42%", left: "50%",
            width: 110, height: 140,
            borderRadius: "50%",
            border: "1px solid rgba(0,212,255,0.25)",
            animation: "pulse-ring 2.8s ease-out infinite",
          }} />
          {/* Pulse ring 2 — offset delay */}
          <div style={{
            position: "absolute",
            top: "42%", left: "50%",
            width: 110, height: 140,
            borderRadius: "50%",
            border: "1px solid rgba(99,102,241,0.2)",
            animation: "pulse-ring 2.8s ease-out infinite",
            animationDelay: "1.4s",
          }} />

          {/* Document card — centered */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }}>
            <DocumentCard />
          </div>

          {/* Floating chips */}
          {CHIPS.map((chip, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...chip.pos,
                animation: `float-chip 3.6s ease-in-out infinite`,
                animationDelay: `${chip.delay}s`,
                opacity: 0,
              }}
            >
              <span style={{
                display: "inline-block",
                padding: "3px 9px",
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.04em",
                border: "1px solid rgba(0,212,255,0.22)",
                background: "rgba(0,0,0,0.85)",
                color: "rgba(0,212,255,0.75)",
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
              }}>
                {chip.text}
              </span>
            </div>
          ))}
        </div>

        {/* ── Cycling status text ── */}
        <p
          key={statusIdx}
          style={{
            fontSize: 12,
            color: "rgba(125,211,252,0.6)",
            letterSpacing: "0.02em",
            animation: "status-fade-in 0.35s ease both",
          }}
        >
          {STATUS_TEXTS[statusIdx]}
        </p>

        {/* ── Vertical stepper ── */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 240 }}>
          {STEPS.map((label, i) => {
            const isDone    = i < step;
            const isActive  = i === step;

            return (
              <div key={i} style={{ display: "flex", gap: 14 }}>

                {/* Icon + connector column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Circle indicator */}
                  <div style={{
                    width: 24, height: 24,
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    ...(isDone ? {
                      background: "rgba(52,211,153,0.12)",
                      border: "1px solid rgba(52,211,153,0.45)",
                    } : isActive ? {
                      background: "rgba(0,212,255,0.10)",
                      border: "1px solid rgba(0,212,255,0.60)",
                      animation: "step-pulse 1.6s ease-in-out infinite",
                    } : {
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }),
                  }}>
                    {isDone   && <CheckMark />}
                    {isActive && <MiniSpinner />}
                  </div>

                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: 1,
                      flex: 1,
                      minHeight: 20,
                      margin: "4px 0",
                      background: isDone
                        ? "rgba(52,211,153,0.25)"
                        : "rgba(255,255,255,0.05)",
                      transition: "background 0.5s",
                    }} />
                  )}
                </div>

                {/* Label */}
                <p style={{
                  paddingTop: 3,
                  paddingBottom: i < STEPS.length - 1 ? 20 : 0,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: isDone
                    ? "rgba(52,211,153,0.85)"
                    : isActive
                      ? "#ffffff"
                      : "rgba(255,255,255,0.18)",
                  fontWeight: isActive ? 500 : 400,
                  transition: "color 0.4s",
                }}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
