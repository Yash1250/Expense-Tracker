"use client";

import { useState, useTransition } from 'react';
import { User as UserIcon, Mail, Phone, Lock, Globe, Shield, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { updateProfile } from '@/lib/user-actions';
import { changePasswordAction } from '@/lib/auth-actions';

export default function ProfileClient({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [currency, setCurrency] = useState(user.currency || 'INR');
  const [theme, setTheme] = useState(user.theme || 'light');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');

    startTransition(async () => {
      const res = await updateProfile({ fullName, phone, currency, theme });
      if (res.success) {
        setProfileMsg('Profile updated successfully!');
      }
    });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPasswordMsg('');

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const res = await changePasswordAction({ oldPassword, newPassword, confirmPassword });
      if (res.success) {
        setPasswordMsg('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(res.error || 'Failed to change password.');
      }
    });
  };

  return (
    <div className="pb-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <UserIcon size={26} className="text-blue-600" /> Account Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Manage your personal credentials, contact details, currency preference, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card Sidebar */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/60 border-2 border-blue-500 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-inner">
            {fullName.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-zinc-100">{fullName}</h2>
          <p className="text-xs text-slate-500 mb-3">{user.email}</p>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200">
            <Shield size={12} /> {user.role} ROLE
          </span>
        </div>

        {/* Profile Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Information Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mb-4">Personal Information</h3>

            {profileMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-medium">
                <CheckCircle2 size={16} /> <span>{profileMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all"
              >
                <Save size={15} /> Save Profile Changes
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-amber-500" /> Security & Password
            </h3>

            {pwdError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-red-50 text-red-600 text-xs font-medium">
                <AlertCircle size={16} /> <span>{pwdError}</span>
              </div>
            )}

            {passwordMsg && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-medium">
                <CheckCircle2 size={16} /> <span>{passwordMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="py-2.5 px-5 rounded-2xl bg-slate-900 dark:bg-zinc-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:bg-slate-800"
              >
                <Lock size={15} /> Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
