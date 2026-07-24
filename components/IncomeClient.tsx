"use client";

import { useState, useTransition, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, TrendingDown } from 'lucide-react';
import { addIncome, updateIncome, deleteIncome } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Interest', 'Refund', 'Bonus', 'Cashback', 'Rental', 'Investment', 'Other'];

type IncomeItem = { id: string; amount: number; source: string; description: string | null; date: string; accountName: string | null; accountId: string | null };
type IncomeGroup = { date: string; items: IncomeItem[]; total: number };

export default function IncomeClient({ initialData, accounts, currency }: { initialData: IncomeGroup[]; accounts: any[]; currency: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<IncomeItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(INCOME_SOURCES[0]);
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal || deletingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, deletingId]);

  // Sync local state with fresh server data after router.refresh()
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = 'Income Report';
    const filterText = {};
    const summary = [
      { label: 'Total Income', value: `${currency}${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
    ];
    const columns = ['Date', 'Source', 'Account', 'Description', 'Amount'];
    
    const rows: any[][] = [];
    data.forEach(group => {
      group.items.forEach(item => {
        rows.push([
          item.date,
          item.source,
          item.accountName || '-',
          item.description || '-',
          `${currency}${item.amount.toFixed(2)}`
        ]);
      });
    });

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV('income-report', columns, rows);
    } else if (type === 'excel') {
      exportToExcel('income-report', columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };
  const [formError, setFormError] = useState('');

  const openCreate = () => { setEditItem(null); setAmount(''); setSource(INCOME_SOURCES[0]); setDescription(''); setIncomeDate(new Date().toISOString().split('T')[0]); setAccountId(''); setFormError(''); setShowModal(true); };
  const openEdit = (item: IncomeItem) => { setEditItem(item); setAmount(item.amount.toString()); setSource(item.source); setDescription(item.description || ''); setIncomeDate(item.date); setAccountId(item.accountId || ''); setFormError(''); setShowModal(true); };

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) { setFormError('Enter a valid amount.'); return; }
    startTransition(async () => {
      const d = { amount: Number(amount), source, description: description || undefined, incomeDate, accountId: accountId || undefined };
      editItem ? await updateIncome(editItem.id, d) : await addIncome(d);
      setShowModal(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteIncome(id);
      setDeletingId(null);
      router.refresh();
    });
  };

  const totalIncome = data.reduce((s, g) => s + g.total, 0);

  return (
    <div className="pb-6 space-y-6">
      <header className="md:hidden sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-2xl font-bold">Income</h1>
      </header>

      {/* Summary card */}
      <div className="mx-4 md:mx-0 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-emerald-100 text-sm">Total Income</p>
            <h2 className="text-3xl font-bold mt-1">{currency}{totalIncome.toLocaleString()}</h2>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Add Income
          </button>
        </div>
      </div>

      {/* Income list */}
      <div className="px-4 md:px-0 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Income History</h3>
          <ExportDropdown onExport={handleExport} />
        </div>
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <TrendingDown size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No income recorded yet</p>
            <button onClick={openCreate} className="mt-3 text-sm text-blue-500 font-medium hover:underline">Add your first income</button>
          </div>
        )}
        {data.map((group, idx) => (
          <section key={idx}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{group.date}</h3>
              <span className="text-xs font-semibold text-emerald-600">+{currency}{group.total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {group.items.map(item => (
                <div key={item.id} className="group bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg">💰</div>
                    <div>
                      <p className="font-semibold text-sm">{item.source}</p>
                      {item.description && <p className="text-xs text-zinc-500">{item.description}</p>}
                      {item.accountName && <p className="text-xs text-zinc-400">{item.accountName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className="hidden group-hover:flex gap-0.5">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500"><Pencil size={13} /></button>
                      <button onClick={() => setDeletingId(item.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                    <p className="font-bold text-sm text-emerald-600">+{currency}{item.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white dark:bg-zinc-900 w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-blue-600 text-white rounded-t-3xl md:rounded-t-none">
              <h3 className="font-bold text-lg">{editItem ? 'Edit Income' : 'Add Income'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                  {INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</label>
                <input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {accounts.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">No account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional note" className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            
            <div className="flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400">Cancel</button>
              <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-1">
                <Check size={15} />{isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Delete Income?</h3>
            <p className="text-zinc-500 text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-60">{isPending ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
