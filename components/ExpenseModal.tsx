"use client";

import { useState, useTransition } from 'react';
import { Check, Calendar, Clock } from 'lucide-react';
import { addExpense, updateExpense, ExpenseInput } from '@/lib/actions';
import AppModal from '@/components/AppModal';

const CATEGORIES = ['Food','Grocery','Travel','Fuel','Shopping','Entertainment','Bills','Rent','Medical','EMI','Subscription','Investment','Family','Miscellaneous'];
const PAYMENT_METHODS = ['Cash','UPI','Credit Card','Debit Card','Bank Transfer','Net Banking','Wallet','Cheque'];

type Props = {
  onClose: () => void;
  editData?: any;
  accounts: any[];
  currency: string;
};

export default function ExpenseModal({ onClose, editData, accounts, currency }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [category, setCategory] = useState(editData?.category || CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(editData?.method || 'UPI');
  const [date, setDate] = useState(editData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(editData?.time || new Date().toTimeString().substring(0, 5));
  const [notes, setNotes] = useState(editData?.notes || '');
  const [merchant, setMerchant] = useState(editData?.merchant || '');
  const [accountId, setAccountId] = useState(editData?.accountId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount greater than 0.'); return; }

    const data: ExpenseInput = { amount: Number(amount), categoryName: category, expenseDate: date, expenseTime: time, paymentMethod, notes: notes || undefined, merchant: merchant || undefined, accountId: accountId || undefined };

    startTransition(async () => {
      const result = editData ? await updateExpense(editData.id, data) : await addExpense(data);
      if (result.success) onClose();
      else setError(result.error || 'An error occurred.');
    });
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      title={editData ? 'Edit Expense' : 'Add Expense'}
      onSubmit={handleSubmit}
      headerHero={
        <div className="flex-shrink-0 bg-blue-600 text-white px-6 pb-6 text-center">
          <p className="text-blue-100 text-xs mb-1">Amount ({currency})</p>
          <div className="flex items-center justify-center text-5xl font-bold">
            <span className="text-blue-300 mr-1">{currency}</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent border-none outline-none w-44 text-center placeholder:text-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
          </div>
        </div>
      }
      footer={
        <div className="flex gap-3 w-full">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400">Cancel</button>
          <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-1 transition-colors">
            <Check size={16} />{isPending ? 'Saving…' : editData ? 'Update' : 'Save'}
          </button>
        </div>
      }
    >
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
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Merchant / Shop</label>
        <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Amazon, Swiggy, DMart" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
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
    </AppModal>
  );
}
