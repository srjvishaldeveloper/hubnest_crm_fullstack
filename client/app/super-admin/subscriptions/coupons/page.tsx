'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Plus, Pencil, Trash2, RefreshCw, Tag, X, Loader2, XCircle, CheckCircle } from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  discountPercent: number;
  type: 'percentage' | 'flat';
  expiresAt: string;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'inactive' | 'expired';
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
    expired: 'bg-red-50 text-red-600',
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
};

const EMPTY: Omit<Coupon, '_id'> = {
  code: '', discountPercent: 10, type: 'percentage', expiresAt: '', usageCount: 0, maxUsage: 100, status: 'active',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Omit<Coupon, '_id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/coupons')
      .then(r => setCoupons(r.data?.data || []))
      .catch(() => setError('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({ code: c.code, discountPercent: c.discountPercent, type: c.type, expiresAt: c.expiresAt?.slice(0, 10) || '', usageCount: c.usageCount, maxUsage: c.maxUsage, status: c.status });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/super-admin/coupons/${editing._id}`, form);
      else await api.post('/super-admin/coupons', form);
      setShowModal(false);
      fetch();
    } catch { } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    setDeletingId(id);
    try { await api.delete(`/super-admin/coupons/${id}`); fetch(); } catch { } finally { setDeletingId(null); }
  }

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 bg-slate-200 rounded-xl" /><div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-80" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <XCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium mb-4">{error}</p>
      <button onClick={fetch} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Tag className="w-6 h-6 text-[#F59E0B]" /> Coupons & Discounts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage promotional discount codes for tenants</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Tag className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No coupons yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first discount coupon</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Code', 'Discount', 'Type', 'Expires At', 'Usage', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{c.code}</td>
                    <td className="px-5 py-4 text-slate-700 font-semibold">{c.discountPercent}{c.type === 'percentage' ? '%' : ' flat'}</td>
                    <td className="px-5 py-4"><span className="capitalize text-slate-600">{c.type}</span></td>
                    <td className="px-5 py-4 text-slate-600">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{c.usageCount} / {c.maxUsage}</td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-amber-50 text-[#F59E0B] transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c._id)} disabled={deletingId === c._id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                          {deletingId === c._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Coupon Code *</label>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Discount Value</label>
                  <input type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'flat' }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none">
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Max Usage</label>
                  <input type="number" min={1} value={form.maxUsage} onChange={e => setForm(f => ({ ...f, maxUsage: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Expires At</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
