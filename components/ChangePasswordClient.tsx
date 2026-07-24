"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { changePasswordAction } from '@/lib/auth-actions';

export default function ChangePasswordClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const res = await changePasswordAction({ oldPassword, newPassword, confirmPassword });
      if (res.success) {
        setSuccessMsg('Password updated successfully! Redirecting to dashboard…');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Failed to change password.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Update Your Password</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            For security compliance, please set a new password before continuing.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? 'Updating Password…' : 'Save & Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
