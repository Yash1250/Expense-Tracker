"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Search, Shield, Filter, CheckCircle2, XCircle,
  MoreVertical, Key, Trash2, Edit, AlertCircle, RefreshCw, X, Check
} from 'lucide-react';
import { createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser } from '@/lib/user-actions';

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  status: string;
  currency: string;
  lastLogin?: Date;
  createdAt: Date;
};

export default function UsersClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUserItem, setEditUserItem] = useState<UserItem | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<UserItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [status, setStatus] = useState('active');
  const [currency, setCurrency] = useState('INR');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtered Users
  const filteredUsers = initialUsers.filter((u) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.toLowerCase().includes(term));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const openCreate = () => {
    setEditUserItem(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('USER');
    setStatus('active');
    setCurrency('INR');
    setFormError('');
    setShowCreateModal(true);
  };

  const openEdit = (u: UserItem) => {
    setEditUserItem(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setStatus(u.status);
    setCurrency(u.currency || 'INR');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSaveUser = () => {
    setFormError('');
    if (!fullName.trim() || !email.trim()) {
      setFormError('Full Name and Email are required.');
      return;
    }
    if (!editUserItem && !password) {
      setFormError('Password is required for new users.');
      return;
    }

    startTransition(async () => {
      const res = editUserItem
        ? await updateUser(editUserItem.id, { fullName, email, phone, role, status, currency })
        : await createUser({ fullName, email, phone, password, role, status, currency });

      if (res.success) {
        setShowCreateModal(false);
        setSuccessMsg(editUserItem ? 'User updated successfully!' : 'User created successfully!');
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to save user.');
      }
    });
  };

  const handleToggleStatus = (u: UserItem) => {
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const res = await toggleUserStatus(u.id, nextStatus);
      if (res.success) {
        setSuccessMsg(`User status updated to ${nextStatus}.`);
        router.refresh();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    });
  };

  const handleResetPassword = () => {
    if (!resetPwdUser || !newPasswordInput || newPasswordInput.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    startTransition(async () => {
      const res = await resetUserPassword(resetPwdUser.id, newPasswordInput);
      if (res.success) {
        setResetPwdUser(null);
        setNewPasswordInput('');
        setSuccessMsg('Password reset successfully!');
        router.refresh();
      } else {
        alert(res.error || 'Failed to reset password.');
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    startTransition(async () => {
      const res = await deleteUser(id);
      if (res.success) {
        setDeletingId(null);
        setSuccessMsg('User deleted successfully!');
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete user.');
      }
    });
  };

  return (
    <div className="pb-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Users size={26} className="text-blue-600" /> User Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Admin Panel: Create accounts, assign RBAC roles, reset passwords, and control system access.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-blue-500/30 transition-all shrink-0"
        >
          <UserPlus size={18} /> Create New User
        </button>
      </div>

      {/* Global Success Feedback Toast */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} /> <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900"><X size={14} /></button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin Only</option>
            <option value="USER">Normal Users</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-800/40">
                <th className="py-3.5 px-4">User Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No users found matching your filter criteria.
                  </td>
                </tr>
              )}

              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {u.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm">{u.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-200 dark:border-purple-800'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-800'
                    }`}>
                      <Shield size={11} /> {u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      u.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-500'
                    }`}>
                      {u.status === 'active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle Active Status */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        {u.status === 'active' ? <XCircle size={15} className="text-amber-500" /> : <CheckCircle2 size={15} className="text-emerald-500" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(u)}
                        title="Edit User"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={15} />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => { setResetPwdUser(u); setNewPasswordInput(''); }}
                        title="Reset User Password"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        <Key size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        title="Delete User"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
              <h3 className="font-bold text-lg">{editUserItem ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {!editUserItem && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Initial Password *</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RBAC Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
                    className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="USER">Normal User</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full mt-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1 shadow-sm"
              >
                <Check size={16} /> {isPending ? 'Saving…' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">Set a new password for {resetPwdUser.fullName} ({resetPwdUser.email})</p>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setResetPwdUser(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isPending}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
