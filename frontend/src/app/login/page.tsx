"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email o password non corretti."
          : error.message,
      );
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">

      {/* Background glow */}
      <div aria-hidden className="fixed inset-0 pointer-events-none">
        <div style={{
          position: "absolute", width: 600, height: 600,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 self-center">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-sm">DORA Checker</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold mb-1">Accedi al tuo account</h1>
            <p className="text-sm text-gray-500">
              Non hai un account?{" "}
              <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Registrati gratis
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              <label htmlFor="password" className="text-xs text-gray-400">Password</label>
              <input
                id="password" type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
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
              style={{ background: loading ? "#22d3ee80" : "linear-gradient(135deg, #00d4ff 0%, #22d3ee 100%)" }}
            >
              {loading ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>
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
