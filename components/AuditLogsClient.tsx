"use client";

import { useState } from 'react';
import { ShieldCheck, Search, Clock, FileText } from 'lucide-react';

type AuditItem = {
  id: string;
  action: string;
  details: string;
  performedByName?: string;
  performedByUserId?: string;
  createdAt: Date;
};

export default function AuditLogsClient({ logs }: { logs: AuditItem[] }) {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.performedByName && log.performedByName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={26} className="text-blue-600" /> Admin Audit Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            System security log: Tracking user logins, password resets, user creations, and record deletions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl pl-10 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-800/40">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium text-xs">
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    No audit logs found.
                  </td>
                </tr>
              )}

              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-zinc-100 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-mono text-[11px]">
                    {log.details}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300 font-semibold">
                    {log.performedByName || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
