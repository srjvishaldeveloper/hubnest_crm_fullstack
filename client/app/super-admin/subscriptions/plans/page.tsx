'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import {
  Plus, Pencil, Trash2, RefreshCw, CreditCard, Users, FileText,
  CheckCircle, XCircle, X, Loader2, Package
} from 'lucide-react';

interface Plan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  userLimit: number;
  leadLimit: number;
  status: 'active' | 'inactive';
  description?: string;
}

const EMPTY_PLAN: Omit<Plan, '_id'> = {
  name: '',
  price: 0,
  billingCycle: 'monthly',
  features: [],
  userLimit: 10,
  leadLimit: 500,
  status: 'active',
  description: '',
};

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
    }`}>
      {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Omit<Plan, '_id'>>(EMPTY_PLAN);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPlans = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/plans')
      .then(r => setPlans(r.data?.data || []))
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PLAN);
    setFeaturesText('');
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({ name: plan.name, price: plan.price, billingCycle: plan.billingCycle, features: plan.features, userLimit: plan.userLimit, leadLimit: plan.leadLimit, status: plan.status, description: plan.description || '' });
    setFeaturesText((plan.features || []).join('\n'));
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, features: featuresText.split('\n').map(f => f.trim()).filter(Boolean) };
    try {
      if (editing) {
        await api.put(`/super-admin/plans/${editing._id}`, payload);
      } else {
        await api.post('/super-admin/plans', payload);
      }
      setShowModal(false);
      fetchPlans();
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this plan?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/super-admin/plans/${id}`);
      fetchPlans();
    } catch {
      // handled
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchPlans} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#F59E0B]" /> Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage pricing tiers for your tenants</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No plans found</p>
            <p className="text-slate-400 text-sm mt-1">Create your first subscription plan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Features</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User Limit</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Lead Limit</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map(plan => (
                  <tr key={plan._id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{plan.name}</td>
                    <td className="px-5 py-4 text-slate-700">
                      <span className="font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-400 text-xs">/{plan.billingCycle}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(plan.features || []).slice(0, 3).map((f, i) => (
                          <span key={i} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                        {(plan.features || []).length > 3 && (
                          <span className="text-slate-400 text-xs">+{plan.features.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-700"><Users className="w-3.5 h-3.5 text-slate-400" />{plan.userLimit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-700"><FileText className="w-3.5 h-3.5 text-slate-400" />{plan.leadLimit}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={plan.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-amber-50 text-[#F59E0B] transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(plan._id)} disabled={deletingId === plan._id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                          {deletingId === plan._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Plan Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pro Plan" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Price ($) *</label>
                  <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">User Limit</label>
                  <input type="number" min={1} value={form.userLimit} onChange={e => setForm(f => ({ ...f, userLimit: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Lead Limit</label>
                  <input type="number" min={1} value={form.leadLimit} onChange={e => setForm(f => ({ ...f, leadLimit: Number(e.target.value) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Features (one per line)</label>
                <textarea rows={4} value={featuresText} onChange={e => setFeaturesText(e.target.value)} placeholder="CRM Module&#10;Email Campaigns&#10;Analytics Dashboard" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editing ? 'Update Plan' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
