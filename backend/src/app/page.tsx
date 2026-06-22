"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated as admin, redirect to /admin
  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [session, status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials. Please check your email and password.");
    } else {
      // Redirect to admin — layout will guard the role
      router.replace("/admin");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-xl shadow-indigo-500/30 mb-4">
            <span className="text-white font-extrabold text-2xl">KL</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Login</h1>
          <p className="text-slate-400 text-sm mt-1">KL Dear Lottery Management Panel</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lottery.com"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In to Admin Panel"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-slate-500 text-xs">
              Restricted access — authorised personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
