"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPasswordAction } from '@/lib/auth-actions';

export default function ForgotPasswordClient() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const res = await forgotPasswordAction(email);
      setMessage(res.message);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Forgot Password?</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        {message && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? 'Sending Request…' : 'Send Reset Link →'}
          </button>
        </form>
      </div>
    </div>
  );
}
