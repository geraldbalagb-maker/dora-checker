"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FREE_FEATURES = [
  "3 analisi/mese senza account",
  "10 analisi/mese con account gratuito",
  "Analisi 8 clausole Art. 30",
  "Bozze clausole AI",
  "Report a schermo",
];

const PRO_FEATURES = [
  "Analisi illimitate",
  "Storico analisi completo",
  "Stampa / salva PDF",
  "Priorità su nuove funzionalità",
  "Supporto email dedicato",
];

export default function PricingPage() {
  const [user, setUser]         = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [canceled, setCanceled] = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    if (searchParams.get("canceled") === "true") setCanceled(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    if (!user) { router.push("/signup"); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) { setLoading(false); return; }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Glow */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", width: 700, height: 500, top: -200, left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 65%)",
          filter: "blur(80px)",
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-sm">DORA Checker</span>
          </Link>
          <div className="flex items-center gap-3">
            {user
              ? <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">Dashboard →</Link>
              : <>
                  <Link href="/login" className="text-xs text-gray-500 hover:text-white transition-colors">Accedi</Link>
                  <Link href="/signup" className="px-4 py-2 text-xs text-black font-semibold bg-white rounded-full hover:bg-gray-100 transition-all">
                    Registrati
                  </Link>
                </>
            }
          </div>
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Canceled notice */}
        {canceled && (
          <div className="mb-8 text-center text-sm text-gray-500">
            Nessun addebito effettuato. Puoi fare l&apos;upgrade in qualsiasi momento.
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-cyan-500/60 mb-3">Prezzi</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Semplice, trasparente, senza sorprese
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Inizia gratis, upgrara quando hai bisogno. Nessun contratto, cancelli quando vuoi.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">

          {/* Free */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 flex flex-col gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Gratuito</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-gray-500 text-sm">/mese</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={user ? "/" : "/signup"}
              className="block text-center py-3 rounded-xl text-sm font-medium border border-white/10
                         text-gray-300 hover:border-white/25 hover:text-white transition-all">
              {user ? "Piano attuale" : "Inizia gratis"}
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl p-[1px]"
              style={{ background: "linear-gradient(135deg, #00d4ff, #818cf8, #7c3aed)" }}>
              <div className="absolute inset-0 rounded-2xl bg-[#060a0f]" />
            </div>

            <div className="relative p-7 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-cyan-400/80 uppercase tracking-widest">Pro</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    Più popolare
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">€29</span>
                  <span className="text-gray-400 text-sm">/mese</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-black
                           transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)" }}
              >
                {loading ? "Caricamento…" : user ? "Upgrade a Pro" : "Inizia con Pro"}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-xl mx-auto flex flex-col gap-5">
          <h2 className="text-sm uppercase tracking-widest text-gray-500 text-center">FAQ</h2>
          {[
            ["Posso cancellare in qualsiasi momento?", "Sì, cancelli online in un click dal pannello abbonamento. Non ci sono vincoli."],
            ["I dati del contratto vengono salvati?", "No. L'analisi avviene in memoria RAM. Solo il report (risultati) viene salvato nel tuo storico, mai il testo del contratto."],
            ["Il report è una consulenza legale?", "No. Il report è uno strumento di analisi automatica. Verifica sempre con un legale qualificato prima di prendere decisioni contrattuali."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm font-medium text-white mb-2">{q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
