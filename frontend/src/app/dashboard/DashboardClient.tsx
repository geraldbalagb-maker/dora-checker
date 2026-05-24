"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DoraReport } from "@/lib/types";
import ResultsDashboard from "@/components/ResultsDashboard";

interface Analysis {
  id: string;
  filename: string | null;
  score: number;
  created_at: string;
}

interface FullAnalysis extends Analysis {
  report: DoraReport;
}

interface Props {
  user: { id: string; email?: string };
  upgraded: boolean;
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`text-xs font-bold border rounded-full px-2.5 py-0.5 ${color}`}>
      {score}/100
    </span>
  );
}

export default function DashboardClient({ user, upgraded }: Props) {
  const [analyses, setAnalyses]       = useState<Analysis[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<DoraReport | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(upgraded);
  const router = useRouter();
  const supabase = createClient();

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : "";
  }

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyses", {
        headers: { authorization: await authHeader() },
      });
      if (res.ok) setAnalyses(await res.json());
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  async function openAnalysis(id: string) {
    const res = await fetch(`/api/analyses/${id}`, {
      headers: { authorization: await authHeader() },
    });
    if (!res.ok) return;
    const data: FullAnalysis = await res.json();
    setSelected(data.report);
  }

  async function deleteAnalysis(id: string) {
    setDeleting(id);
    await fetch(`/api/analyses/${id}`, {
      method: "DELETE",
      headers: { authorization: await authHeader() },
    });
    setAnalyses(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (selected) {
    return (
      <ResultsDashboard
        report={selected}
        onReset={() => setSelected(null)}
        backLabel="← Storico"
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Glow */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", width: 700, height: 400, top: -150, left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm">D</span>
              </div>
              <span className="font-semibold text-sm hidden sm:block">DORA Checker</span>
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-xs text-gray-500">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors hidden sm:block">
              ✦ Upgrade Pro
            </Link>
            <span className="text-xs text-gray-600 hidden sm:block truncate max-w-[160px]">
              {user.email}
            </span>
            <button onClick={logout}
              className="text-xs text-gray-500 hover:text-white transition-colors">
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-5xl mx-auto px-6 pt-28 pb-24">

        {/* Upgrade banner */}
        {showUpgrade && (
          <div className="mb-6 flex items-center justify-between gap-3
                          rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-300 font-medium">
                Benvenuto in Pro! Hai ora analisi illimitate.
              </p>
            </div>
            <button onClick={() => setShowUpgrade(false)}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none">
              ×
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Le tue analisi</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? "…" : `${analyses.length} analisi salvate`}
            </p>
          </div>
          <Link href="/"
            style={{ background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)" }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                       hover:opacity-90 transition-opacity">
            + Nuova analisi
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 w-48 bg-white/5 rounded" />
                    <div className="h-3 w-32 bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && analyses.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]
                            flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Nessuna analisi ancora.</p>
            <Link href="/"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              Analizza il tuo primo contratto →
            </Link>
          </div>
        )}

        {/* Analyses list */}
        {!loading && analyses.length > 0 && (
          <div className="flex flex-col gap-2">
            {analyses.map(a => (
              <div key={a.id}
                className="group flex items-center gap-4 rounded-xl border border-white/[0.06]
                           bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10]
                           p-4 transition-all cursor-pointer"
                onClick={() => openAnalysis(a.id)}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg border border-cyan-500/20 bg-cyan-500/5
                                flex items-center justify-center text-cyan-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {a.filename ?? "Contratto senza nome"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString("it-IT", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Score */}
                <ScoreChip score={a.score} />

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); deleteAnalysis(a.id); }}
                  disabled={deleting === a.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600
                             hover:text-red-400 transition-all disabled:opacity-40 p-1"
                  aria-label="Elimina analisi"
                >
                  {deleting === a.id
                    ? <span className="text-xs">…</span>
                    : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )
                  }
                </button>

                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
