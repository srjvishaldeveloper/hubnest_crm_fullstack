'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Shield, Plus, Pencil, Trash2, RefreshCw, XCircle, X, Loader2, Lock } from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissionsCount: number;
  permissions: string[];
  isSystem?: boolean;
  createdAt?: string;
}

const EMPTY: Omit<Role, '_id' | 'permissionsCount'> = { name: '', description: '', permissions: [], isSystem: false };
const ROLE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-purple-100 text-purple-700',
  'Tenant Admin': 'bg-blue-100 text-amber-700',
  'Finance Manager': 'bg-green-100 text-green-700',
  'HR Manager': 'bg-orange-100 text-orange-700',
  'Sales Manager': 'bg-cyan-100 text-cyan-700',
  'Support Agent': 'bg-pink-100 text-pink-700',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<Omit<Role, '_id' | 'permissionsCount'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRoles = () => {
    setLoading(true); setError('');
    api.get('/super-admin/roles')
      .then(r => setRoles(r.data?.data || []))
      .catch(() => setError('Failed to load roles'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoles(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(role: Role) {
    setEditing(role);
    setForm({ name: role.name, description: role.description, permissions: role.permissions || [], isSystem: role.isSystem });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/super-admin/roles/${editing._id}`, form);
      else await api.post('/super-admin/roles', form);
      setShowModal(false); fetchRoles();
    } catch { } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role?')) return;
    setDeletingId(id);
    try { await api.delete(`/super-admin/roles/${id}`); fetchRoles(); } catch { } finally { setDeletingId(null); }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-44 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <XCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium mb-4">{error}</p>
      <button onClick={fetchRoles} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Shield className="w-6 h-6 text-[#F59E0B]" /> Role Management</h1>
          <p className="text-sm text-slate-500 mt-1">Define and manage system roles and their permissions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#3B82F6] dark:bg-[#F59E0B] text-white hover:bg-blue-600 dark:hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center py-20">
          <Shield className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No roles found</p>
          <p className="text-slate-400 text-sm mt-1">Create your first system role</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map(role => {
            const colorCls = ROLE_COLORS[role.name] || 'bg-slate-100 text-slate-700';
            return (
              <div key={role._id} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorCls}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {!role.isSystem && (
                      <>
                        <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-amber-50 text-[#F59E0B] transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(role._id)} disabled={deletingId === role._id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                          {deletingId === role._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                    {role.isSystem && <span title="System role — cannot be deleted"><Lock className="w-4 h-4 text-slate-400" /></span>}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{role.description || 'No description'}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
                  <span className="text-xs text-slate-400">Permissions</span>
                  <span className="text-xs font-bold text-[#F59E0B] bg-amber-50 px-2 py-0.5 rounded-full">{role.permissionsCount ?? (role.permissions?.length || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Role Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finance Manager" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this role can do..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editing ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
