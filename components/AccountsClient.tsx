"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, X, Check, Wallet, ChevronRight, ShieldCheck, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions';
import { useRouter } from 'next/navigation';

const ACCOUNT_TYPES = ['cash', 'bank', 'credit_card', 'wallet', 'savings', 'other'];
const ICONS = ['💵', '🏦', '💳', '👛', '💰', '🏧', '📱', '💎', '📈', '🏠'];
const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  openingBalance?: number;
  currency?: string;
  status?: string;
  color: string;
  icon: string;
  _count: { expenses: number; incomes?: number };
};

export default function AccountsClient({ initialAccounts, currency = '₹' }: { initialAccounts: Account[]; currency?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [accCurrency, setAccCurrency] = useState('INR');
  const [status, setStatus] = useState('active');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('🏦');
  const [formError, setFormError] = useState('');

  const totalBalance = initialAccounts.reduce((sum, a) => sum + (a.status !== 'inactive' ? a.balance : 0), 0);

  const openCreate = () => {
    setEditAcc(null);
    setName('');
    setType('bank');
    setOpeningBalance('0');
    setAccCurrency('INR');
    setStatus('active');
    setColor('#3b82f6');
    setIcon('🏦');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (a: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditAcc(a);
    setName(a.name);
    setType(a.type);
    setOpeningBalance((a.openingBalance ?? a.balance ?? 0).toString());
    setAccCurrency(a.currency || 'INR');
    setStatus(a.status || 'active');
    setColor(a.color);
    setIcon(a.icon);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setFormError('Account Name is required.');
      return;
    }
    startTransition(async () => {
      const data = {
        name,
        type,
        openingBalance: Number(openingBalance),
        currency: accCurrency,
        status,
        color,
        icon,
      };
      const result = editAcc ? await updateAccount(editAcc.id, data) : await createAccount(data);
      if (result.success) {
        setShowModal(false);
        router.refresh();
      } else {
        setFormError(result.error || 'Failed to save account.');
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAccount(id);
      if (result.success) {
        setDeletingId(null);
        router.refresh();
      } else {
        setDeleteError(result.error || 'Failed to delete account.');
      }
    });
  };

  return (
    <div className="pb-8 space-y-6">
      <header className="md:hidden sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-2xl font-bold">Accounts</h1>
      </header>

      {/* Total Available Balance Banner */}
      <div className="mx-4 md:mx-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Total Net Available Balance</p>
            <p className="text-3xl sm:text-4xl font-extrabold mt-1">
              {currency}{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-200 mt-1">{initialAccounts.length} active wallets & bank accounts</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> Add Account
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="px-4 md:px-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Your Accounts</h2>
          <span className="text-xs font-medium text-zinc-500">{initialAccounts.length} accounts configured</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialAccounts.map(acc => {
            const txCount = (acc._count?.expenses || 0) + (acc._count?.incomes || 0);
            return (
              <div
                key={acc.id}
                onClick={() => router.push(`/accounts/${acc.id}`)}
                className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/80 dark:hover:border-blue-500 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md active:scale-95 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
                      style={{ backgroundColor: acc.color + '22' }}
                    >
                      {acc.icon}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => openEdit(acc, e)}
                        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDeletingId(acc.id);
                          setDeleteError('');
                        }}
                        className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                      {acc.name}
                    </p>
                    <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-blue-500 transition-colors shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {acc.type.replace('_', ' ')}
                    </span>
                    {acc.status === 'inactive' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-red-50 text-red-500">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Current Balance</p>
                    <p className="text-xl font-extrabold mt-0.5" style={{ color: acc.color }}>
                      {currency}{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">{txCount} txns</span>
                </div>
              </div>
            );
          })}

          {initialAccounts.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 text-zinc-400">
              <Wallet size={44} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-base text-zinc-700 dark:text-zinc-300">No accounts configured</p>
              <p className="text-xs text-zinc-400 mt-1 mb-4">Add your bank accounts, cash wallets, or credit cards.</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                + Add Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="font-bold text-lg">{editAcc ? 'Edit Account' : 'Add Account'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-left pr-1">
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50">
                  {formError}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Cash Wallet"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Opening Balance ({currency})</label>
                  <span className="text-[11px] text-zinc-400">Starting funds before expenses</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {editAcc && (
                <div className="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 text-xs space-y-2">
                  <div className="flex justify-between text-zinc-500">
                    <span>Opening Balance:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      +{currency}{Number(openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Transactions Net Impact (Income - Expenses):</span>
                    <span className={`font-semibold ${editAcc.balance - (editAcc.openingBalance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {editAcc.balance - (editAcc.openingBalance ?? 0) >= 0 ? '+' : ''}
                      {currency}{(editAcc.balance - (editAcc.openingBalance ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 dark:border-zinc-700 pt-2 text-zinc-900 dark:text-zinc-100 text-sm">
                    <span>Resulting Available Balance:</span>
                    <span className={(Number(openingBalance || 0) + (editAcc.balance - (editAcc.openingBalance ?? 0))) < 0 ? 'text-red-500' : 'text-emerald-600'}>
                      {currency}{(Number(openingBalance || 0) + (editAcc.balance - (editAcc.openingBalance ?? 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">Want Current Balance to be a specific amount?</span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetStr = prompt(`Enter desired Current Available Balance in ${currency}:`, '200');
                        if (targetStr !== null) {
                          const targetNum = parseFloat(targetStr);
                          if (!isNaN(targetNum)) {
                            const txNet = editAcc.balance - (editAcc.openingBalance ?? 0);
                            const requiredOpening = targetNum - txNet;
                            setOpeningBalance(requiredOpening.toString());
                          }
                        }
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      Set Desired Balance
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        icon === i ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Theme Color</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                <Check size={16} />
                {isPending ? 'Saving…' : 'Save Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-left">
            <h3 className="font-bold text-lg mb-2">Delete Account?</h3>
            {deleteError ? (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl mb-4 border border-red-200 dark:border-red-900">{deleteError}</p>
            ) : (
              <p className="text-zinc-500 text-sm mb-5">This action cannot be undone.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingId(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={isPending || !!deleteError}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
