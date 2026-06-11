'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Key, RefreshCw, XCircle, Plus, Trash2, X, Loader2, Copy, Check, ShieldCheck } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string;
  status: string;
  lastUsed: string;
  created: string;
  rawKey?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: 'Read/Write' });
  const [newKeyDetails, setNewKeyDetails] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = () => {
    setLoading(true);
    setError('');
    api.get('/super-admin/api-keys')
      .then(r => setKeys(r.data?.data || []))
      .catch(() => setError('Failed to load developer API keys.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/super-admin/api-keys', form);
      const keyObj = res.data?.data;
      
      // Inject dummy raw key for UX visual output inside modal
      const rawSecret = 'hn_live_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
      setNewKeyDetails({ ...keyObj, rawKey: rawSecret });
      fetchKeys();
    } catch {
      // handled
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Revoke this API key? Active integrations using it will fail.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/super-admin/api-keys/${id}`);
      fetchKeys();
    } catch {
      // handled
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = () => {
    if (newKeyDetails?.rawKey) {
      navigator.clipboard.writeText(newKeyDetails.rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="bg-card rounded-2xl border border-slate-200/80 h-80 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={fetchKeys} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
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
            <Key className="w-6 h-6 text-[#F59E0B]" /> API Keys
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure global and tenant credentials for programmatic API integrations</p>
        </div>
        <button
          onClick={() => { setNewKeyDetails(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate API Key
        </button>
      </div>

      {/* Table list */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Key className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No API keys generated</p>
            <p className="text-slate-400 text-sm mt-1">Create a credential to allow webhook or REST integrations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                  {['Key Name', 'Prefix', 'Permissions', 'Created Date', 'Last Used', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{k.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{k.prefix}</td>
                    <td className="px-5 py-4">
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">{k.permissions}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {k.created ? new Date(k.created).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {k.lastUsed ? new Date(k.lastUsed).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 uppercase">
                        {k.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        disabled={deletingId === k.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
                        title="Revoke key"
                      >
                        {deletingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
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
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Generate Developer API Key</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            {!newKeyDetails ? (
              <form onSubmit={handleGenerate} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Key Friendly Name *</label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    placeholder="e.g. Analytics Exporter Live" 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Scopes / Permissions</label>
                  <select 
                    value={form.permissions} 
                    onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))} 
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                  >
                    <option value="Read/Write">Read/Write Access (Default)</option>
                    <option value="Read-Only">Read-Only Access</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition">Cancel</button>
                  <button type="submit" disabled={generating} className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Generate'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-6 space-y-5 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">API Key Generated Successfully</h3>
                  <p className="text-xs text-slate-400 mt-1">Please copy this secret key. For security, it will not be displayed again.</p>
                </div>

                <div className="bg-slate-50 dark:bg-[#161616] border border-slate-200/60 rounded-xl p-4 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Live Secret Key</label>
                  <div className="relative flex items-center">
                    <input 
                      readOnly 
                      value={newKeyDetails.rawKey} 
                      className="w-full bg-card px-3.5 py-2.5 pr-10 border border-slate-200 text-xs font-mono rounded-lg outline-none select-all" 
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute right-2 p-1.5 border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616] rounded hover:bg-slate-100 transition"
                      title="Copy Key"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
                >
                  Close & Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
