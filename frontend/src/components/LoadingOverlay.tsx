"use client";

const STEPS = [
  "Estrazione testo PDF",
  "Analisi clausole Art. 30",
  "Generazione report",
];

interface Props {
  /** 0 = first step active, 1 = second step active, 2 = third step active */
  step: 0 | 1 | 2;
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd" />
    </svg>
  );
}

export default function LoadingOverlay({ step }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">

      {/* Background glow */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div style={{
          position: "absolute", width: 600, height: 600,
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 65%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative flex flex-col items-center gap-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center">
            <span className="text-black font-bold text-base">D</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">DORA Checker</span>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-5 min-w-[260px]">
          {STEPS.map((label, i) => {
            const isDone    = i < step;
            const isActive  = i === step;
            const isPending = i > step;
            return (
              <div key={i} className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {isDone   && <CheckIcon />}
                  {isActive && <Spinner />}
                  {isPending && (
                    <div className="w-4 h-4 rounded-full border border-white/10" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-sm transition-colors duration-300 ${
                  isDone    ? "text-emerald-400" :
                  isActive  ? "text-white font-medium" :
                              "text-gray-600"
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated dots */}
        <p className="text-xs text-gray-600 animate-pulse">
          Elaborazione in corso…
        </p>
      </div>
    </div>
  );
}
