'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, X, CheckCircle2, Split, Loader2 } from 'lucide-react';
import api from '../../../../services/api';

interface ABTest {
  id: string;
  name: string;
  ab_test_config?: {
    variant_a?: string;
    variant_b?: string;
    winner?: string;
  };
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  type?: string;
  ab_test_config?: {
    variant_a?: string;
    variant_b?: string;
    winner?: string;
  };
}

export default function MarketingABTestingPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data: { campaigns: Campaign[] } }>('/campaigns');
        const campaigns = res.data.data.campaigns || [];
        setTests(campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          ab_test_config: c.ab_test_config,
        })));
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ data: { campaign: Campaign } }>('/campaigns', {
        name: testName,
        type: 'A/B Test',
        platform: 'FB',
        status: 'Active',
        ab_test_config: {
          variant_a: variantA || 'Variant A',
          variant_b: variantB || 'Variant B',
          winner: 'Pending',
        },
      });
      const c = res.data.data.campaign;
      setTests(prev => [{
        id: c.id,
        name: c.name,
        status: c.status,
        ab_test_config: c.ab_test_config,
      }, ...prev]);
      setTestName(''); setVariantA(''); setVariantB('');
      setShowModal(false);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  };

  const activeCount = tests.filter(t => t.status === 'Active').length;

  const chartData = tests.slice(0, 5).map(t => ({
    name: t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name,
    conv: 0,
    ctr: 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">A/B Testing</h2>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-1">Compare ad creatives and copy variants side-by-side to maximize conversion rates.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Tests', value: activeCount },
          { label: 'Total Tests', value: tests.length },
          { label: 'Completed', value: tests.filter(t => t.status === 'Completed').length },
        ].map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-[#161616] p-5 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
            <p className="text-[10px] text-slate-400 dark:text-[#737373] font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-[#ededed] mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-4">Conversions by Campaign</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                <Bar dataKey="conv" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <h3 className="text-xs font-bold text-slate-900 dark:text-[#ededed] uppercase tracking-wider">All A/B Tests</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : tests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-[#737373]">No tests yet. Create your first A/B test.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
            {tests.map(t => (
              <div key={t.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Split className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-[#ededed]">{t.name}</p>
                    {t.ab_test_config ? (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">A: {t.ab_test_config.variant_a || 'Variant A'}</span>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">B: {t.ab_test_config.variant_b || 'Variant B'}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-[#737373] mt-0.5">No A/B config set</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {t.ab_test_config?.winner && t.ab_test_config.winner !== 'Pending' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Winner: {t.ab_test_config.winner}
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : t.status === 'Completed' ? 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161616] p-6 rounded-2xl border border-slate-200 dark:border-[#333] shadow-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">New A/B Test</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: 'Test Name *', value: testName, set: setTestName, placeholder: 'e.g. Summer Campaign Headline Test' },
                { label: 'Variant A (Control)', value: variantA, set: setVariantA, placeholder: 'e.g. Short headline copy' },
                { label: 'Variant B (Challenger)', value: variantB, set: setVariantB, placeholder: 'e.g. Long headline with CTA' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-[#737373] uppercase tracking-wider block mb-1">{f.label}</label>
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#111] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold placeholder:text-slate-400"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-[#a3a3a3] border border-slate-200 dark:border-[#333] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a1a1a]">Cancel</button>
                <button type="submit" disabled={creating} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
