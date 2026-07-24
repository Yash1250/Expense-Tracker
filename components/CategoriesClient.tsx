"use client";

import { useState, useTransition, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory, toggleCategory } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPDF, exportToCSV, exportToExcel, exportToPrint } from '@/lib/export-utils';

const ICON_OPTIONS = ['🍔','🛒','✈️','⛽','🛍️','🎬','📄','🏠','💊','💰','📺','📈','👨‍👩‍👧','📦','🎮','🎵','💻','🏋️','📚','🐾'];
const COLOR_OPTIONS = ['#ef4444','#f97316','#f59e0b','#22c55e','#10b981','#14b8a6','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#78716c','#64748b'];

type Category = { id: string; name: string; icon: string; color: string; enabled: boolean; _count: { expenses: number } };

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

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
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleExport = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    const title = 'Categories Definitions Report';
    const filterText = {};
    const summary = [
      { label: 'Total Categories', value: categories.length.toString() },
      { label: 'Active Categories', value: categories.filter(c => c.enabled).length.toString() }
    ];
    const columns = ['Category Name', 'Icon', 'Color Hex', 'Expenses Count', 'Status'];
    const rows = categories.map(cat => [
      cat.name,
      cat.icon,
      cat.color,
      cat._count.expenses.toString(),
      cat.enabled ? 'Enabled' : 'Disabled'
    ]);

    if (type === 'pdf') {
      exportToPDF({ title, userName: 'Yash Mehta', filters: filterText, summary, columns, rows });
    } else if (type === 'csv') {
      exportToCSV('categories-report', columns, rows);
    } else if (type === 'excel') {
      exportToExcel('categories-report', columns, rows);
    } else if (type === 'print') {
      exportToPrint(title, columns, rows, summary, 'Yash Mehta');
    }
  };

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#3b82f6');
  const [formError, setFormError] = useState('');

  const openCreate = () => { setEditCat(null); setName(''); setIcon('📦'); setColor('#3b82f6'); setFormError(''); setShowModal(true); };
  const openEdit = (c: Category) => { setEditCat(c); setName(c.name); setIcon(c.icon); setColor(c.color); setFormError(''); setShowModal(true); };

  const handleSave = () => {
    if (!name.trim()) { setFormError('Name is required.'); return; }
    startTransition(async () => {
      const result = editCat ? await updateCategory(editCat.id, { name, icon, color }) : await createCategory({ name, icon, color });
      if (result.success) { setShowModal(false); router.refresh(); }
      else setFormError(result.error || 'Failed.');
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    startTransition(async () => {
      await toggleCategory(id, !enabled);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) { setDeletingId(null); router.refresh(); }
      else { setDeleteError(result.error || 'Failed.'); }
    });
  };

  return (
    <div className="pb-6 space-y-6">
      <header className="md:hidden sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-2xl font-bold">Categories</h1>
      </header>

      <div className="px-4 md:px-0">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-zinc-500">{categories.length} categories</p>
          <div className="flex items-center gap-2">
            <ExportDropdown onExport={handleExport} />
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm shadow-blue-500/30 transition-colors">
              <Plus size={15} /> Add Category
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border transition-all ${cat.enabled ? 'border-zinc-100 dark:border-zinc-800' : 'border-zinc-200 dark:border-zinc-700 opacity-60'}`}>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color + '22' }}>{cat.icon}</div>
                <span className="text-sm font-semibold truncate w-full">{cat.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <p className="text-xs text-zinc-500">{cat._count.expenses} expenses</p>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => handleToggle(cat.id, cat.enabled)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-colors">{cat.enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}</button>
                  <button onClick={() => { setDeletingId(cat.id); setDeleteError(''); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white dark:bg-zinc-900 w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex-shrink-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-none">
              <h3 className="font-bold text-lg">{editCat ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {formError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl mb-3">{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="w-full mt-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ICON_OPTIONS.map(i => <button key={i} type="button" onClick={() => setIcon(i)} className={`w-9 h-9 rounded-xl text-lg transition-all ${icon === i ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{i}</button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Color</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COLOR_OPTIONS.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} style={{ backgroundColor: c }} />)}
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: color + '22' }}>{icon}</div>
                <div><p className="font-semibold">{name || 'Category Name'}</p><div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: color }} /></div>
              </div>
            </div>
            
            <div className="flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400">Cancel</button>
              <button onClick={handleSave} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-1">
                <Check size={15} />{isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Delete Category?</h3>
            {deleteError ? <p className="text-sm text-red-500 mb-3">{deleteError}</p> : <p className="text-zinc-500 text-sm mb-5">This cannot be undone.</p>}
            <div className="flex gap-3">
              <button onClick={() => { setDeletingId(null); setDeleteError(''); }} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} disabled={isPending || !!deleteError} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60">{isPending ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
