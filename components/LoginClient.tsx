"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginAction } from '@/lib/auth-actions';

export default function LoginClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ email, password, rememberMe });
      if (res.success) {
        setSuccessMsg('Login successful! Redirecting…');
        router.push(res.redirect || '/');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in zoom-in-95 duration-300">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Expense Tracker</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Sign in to manage your financial portfolio</p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span>Signing in…</span>
            ) : (
              <span>Sign In to Account →</span>
            )}
          </button>
        </form>

        {/* Demo Admin Tip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 text-center">
          <p className="text-[11px] text-slate-400">
            Initial Admin Credentials: <span className="font-semibold text-slate-700 dark:text-zinc-300">admin@example.com</span> / <span className="font-semibold text-slate-700 dark:text-zinc-300">Admin@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
