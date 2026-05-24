"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const router   = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    if (password.length < 8)  { setError("La password deve avere almeno 8 caratteri."); return; }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-sm text-center flex flex-col gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25
                          flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Controlla la tua email</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Abbiamo inviato un link di conferma a <strong className="text-white">{email}</strong>.
              Clicca sul link per attivare il tuo account.
            </p>
          </div>
          <Link href="/login"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            Torna al login →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">

      <div aria-hidden className="fixed inset-0 pointer-events-none">
        <div style={{
          position: "absolute", width: 600, height: 600,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-8">

        <Link href="/" className="flex items-center gap-2.5 self-center">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-sm">DORA Checker</span>
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold mb-1">Crea il tuo account</h1>
            <p className="text-sm text-gray-500">
              Hai già un account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Accedi
              </Link>
            </p>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-col gap-1.5">
            {["10 analisi gratuite al mese", "Storico analisi salvato", "Bozze clausole scaricabili"].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5 text-cyan-500/60 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs text-gray-400">Email</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@esempio.it"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                           text-white text-sm placeholder-gray-600 outline-none
                           focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs text-gray-400">Password (min. 8 caratteri)</label>
              <input
                id="password" type="password" required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                           text-white text-sm placeholder-gray-600 outline-none
                           focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-xs text-gray-400">Conferma password</label>
              <input
                id="confirm" type="password" required autoComplete="new-password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                           text-white text-sm placeholder-gray-600 outline-none
                           focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/8 border border-red-500/20
                              rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-black
                         transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00d4ff 0%, #22d3ee 100%)" }}
            >
              {loading ? "Registrazione…" : "Crea account gratuito"}
            </button>
          </form>

          <p className="text-[11px] text-gray-700 text-center">
            Registrandoti accetti i nostri Termini di Servizio e la Privacy Policy.
          </p>
        </div>

        <p className="text-center text-xs text-gray-700">
          <Link href="/" className="hover:text-gray-500 transition-colors">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </main>
  );
}
