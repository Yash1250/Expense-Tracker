"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingDown, PieChart, List, Plus } from 'lucide-react';

const navLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/expenses', icon: List, label: 'Expenses' },
  { href: '/income', icon: TrendingDown, label: 'Income' },
  { href: '/reports', icon: PieChart, label: 'Reports' },
];

export default function BottomNav({ role }: { role?: string }) {
  const pathname = usePathname();
  if (pathname === '/expenses/add') return null;

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* 5 columns grid: 2 links, 1 FAB, 2 links */}
      <div className="grid grid-cols-5 items-end h-16">
        {navLinks.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`flex flex-col items-center justify-center h-full transition-colors ${pathname === href ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-700'}`}>
            <Icon size={22} /><span className="text-[10px] mt-0.5 font-medium">{label}</span>
          </Link>
        ))}

        {/* Center FAB */}
        <div className="flex items-center justify-center relative -top-4">
          <Link href="/expenses/add" className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-700 transition-transform active:scale-95">
            <Plus size={28} />
          </Link>
        </div>

        {navLinks.slice(2, 4).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`flex flex-col items-center justify-center h-full transition-colors ${pathname === href ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-700'}`}>
            <Icon size={22} /><span className="text-[10px] mt-0.5 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
