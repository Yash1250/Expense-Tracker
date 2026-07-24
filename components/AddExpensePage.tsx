"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Calendar, Clock, Tag, ArrowUpRight } from 'lucide-react';
import { addExpense, ExpenseInput } from '@/lib/actions';

const CATEGORIES = ['Food','Grocery','Travel','Fuel','Shopping','Entertainment','Bills','Rent','Medical','EMI','Subscription','Investment','Family','Miscellaneous'];
const PAYMENT_METHODS = ['Cash','UPI','Credit Card','Debit Card','Bank Transfer','Net Banking','Wallet','Cheque'];

export default function AddExpensePage({ accounts, currency }: { accounts: any[]; currency: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [notes, setNotes] = useState('');
  const [merchant, setMerchant] = useState('');
  const [accountId, setAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount greater than 0.'); return; }
    startTransition(async () => {
      const result = await addExpense({ amount: Number(amount), categoryName: category, expenseDate: date, expenseTime: time, paymentMethod, notes: notes || undefined, merchant: merchant || undefined, accountId: accountId || undefined });
      if (result.success) router.push('/expenses');
      else setError(result.error || 'Failed to save.');
    });
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payment</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</label>
          <div className="relative"><Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</label>
          <div className="relative"><Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Merchant</label>
        <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Amazon, Swiggy" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {accounts.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No account</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </select>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notes (Optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes…" rows={2} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95">
        <Check size={18} />{isPending ? 'Saving…' : 'Save Expense'}
      </button>
    </form>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="bg-blue-600 text-white pb-8 px-4 pt-3 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><ArrowLeft size={20} /></button>
            <h1 className="text-lg font-semibold">Add Expense</h1>
            <div className="w-9" />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-blue-100 text-xs font-medium mb-1">Amount ({currency})</p>
            <div className="flex items-center text-5xl font-bold">
              <span className="text-blue-300 mr-1">{currency}</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent border-none outline-none w-48 text-center placeholder:text-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
            </div>
          </div>
        </header>
        <div className="px-4 -mt-6 relative z-20 flex-1 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-xl border border-zinc-100 dark:border-zinc-800">{formBody}</div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <p className="text-blue-100 text-sm font-medium mb-2">Enter Amount ({currency})</p>
            <div className="flex items-center justify-center text-6xl font-bold">
              <span className="text-blue-300 mr-2">{currency}</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent border-none outline-none w-56 text-center placeholder:text-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
            </div>
          </div>
          <div className="p-6">{formBody}</div>
        </div>
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold mb-3 text-sm">Selected</h3>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xl">📦</div>
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-300">{category}</p>
                <p className="text-xs text-blue-500">{paymentMethod}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium mb-2">TIPS</p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• Fill in all required fields</li>
              <li>• Add a merchant name for better tracking</li>
              <li>• Select an account to track balances</li>
              <li>• Use notes for extra context</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
