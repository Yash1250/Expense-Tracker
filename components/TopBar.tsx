"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  Search, Bell, Plus, User as UserIcon, Settings,
  Key, LogOut, ChevronDown, ArrowLeft, Menu,
} from 'lucide-react';
import { logoutAction } from '@/lib/auth-actions';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/expenses/add': 'Add Expense',
  '/income': 'Income',
  '/investments': 'Investments',
  '/reports': 'Reports',
  '/budget': 'Budget',
  '/accounts': 'Accounts',
  '/categories': 'Categories',
  '/users': 'User Management',
  '/audit-logs': 'Audit Logs',
  '/profile': 'My Profile',
  '/settings': 'Settings',
  '/change-password': 'Change Password',
  '/forgot-password': 'Forgot Password',
};

// Pages that show a back-arrow instead of a menu icon on mobile
const BACK_ROUTES = ['/expenses/add', '/change-password'];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] ?? 'Expense Tracker';
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isBackRoute = BACK_ROUTES.includes(pathname);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* ── Left: Back button (mobile sub-pages) or page title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back arrow for sub-pages on mobile */}
        {isBackRoute ? (
          <button
            onClick={() => router.back()}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          // Mobile: decorative app icon placeholder (sidebar handles desktop nav)
          <div className="md:hidden w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">ET</span>
          </div>
        )}

        <h1 className="text-base md:text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
          {title}
        </h1>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1 md:gap-3 shrink-0">

        {/* Add Expense — desktop only (mobile uses FAB in BottomNav) */}
        <Link
          href="/expenses/add"
          className="hidden md:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm shadow-blue-500/30 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </Link>

        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search expenses…"
            className="pl-9 pr-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500 rounded-xl outline-none w-48 transition-all"
          />
        </div>

        {/* Search icon — mobile only */}
        <button className="md:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors" aria-label="Search">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors relative" aria-label="Notifications">
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Profile menu"
            aria-expanded={showDropdown}
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-[10px] md:text-xs font-bold text-white">YM</span>
            </div>
            <ChevronDown size={13} className="text-slate-400 hidden md:block" />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop to close on outside click */}
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl py-1.5 z-50 text-sm font-medium"
                onClick={() => setShowDropdown(false)}
              >
                <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors">
                  <UserIcon size={15} className="text-slate-400" /> My Profile
                </Link>
                <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors">
                  <Settings size={15} className="text-slate-400" /> Settings
                </Link>
                <Link href="/change-password" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors">
                  <Key size={15} className="text-slate-400" /> Change Password
                </Link>

                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold transition-colors disabled:opacity-50"
                >
                  <LogOut size={15} /> {isPending ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
