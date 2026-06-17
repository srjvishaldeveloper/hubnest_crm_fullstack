'use client';

import { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { Grid3X3, RefreshCw, XCircle, Save, Loader2, CheckCircle, Lock } from 'lucide-react';

interface PermissionMatrix {
  resources: string[];
  roles: string[];
  matrix: Record<string, Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>>;
}

export default function PermissionsPage() {
  const [data, setData] = useState<PermissionMatrix | null>(null);
  const [local, setLocal] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = () => {
    setLoading(true); setError('');
    api.get('/super-admin/permissions')
      .then(r => {
        const d = r.data?.data;
        setData(d);
        setLocal(JSON.parse(JSON.stringify(d)));
      })
      .catch(() => setError('Failed to load permissions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  function toggle(resource: string, role: string, perm: 'read' | 'create' | 'update' | 'delete') {
    if (!local) return;
    const isSuperAdminPayment = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'super_admin') && 
      (resource.toLowerCase().includes('payment') || resource.toLowerCase().includes('billing'));
    if (isSuperAdminPayment) return;

    setLocal(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev)) as PermissionMatrix;
      if (!copy.matrix[resource]) copy.matrix[resource] = {};
      if (!copy.matrix[resource][role]) copy.matrix[resource][role] = { read: false, create: false, update: false, delete: false };
      copy.matrix[resource][role][perm] = !copy.matrix[resource][role][perm];
      return copy;
    });
  }

  async function handleSave() {
    if (!local) return;
    setSaving(true);
    try {
      await api.put('/super-admin/permissions', { matrix: local.matrix });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-xl" />
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm h-96" />
    </div>
  );

  if (error || !local) return (
    <div className="flex flex-col items-center justify-center py-20">
      <XCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-red-500 font-medium mb-4">{error || 'No data'}</p>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Grid3X3 className="w-6 h-6 text-[#F59E0B]" /> Permission Matrix</h1>
          <p className="text-sm text-slate-500 mt-1">Configure resource access per role across the system</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#F59E0B] text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 dark:bg-[#161616] min-w-[160px]">Resource</th>
                {local.roles.map(role => (
                  <th key={role} colSpan={4} className="text-center px-2 py-3.5 text-xs font-semibold text-slate-600 border-l border-slate-200">
                    {role}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 dark:bg-[#161616]/50 border-b border-slate-200">
                <th className="sticky left-0 bg-slate-50 dark:bg-[#161616]/50 px-5 py-2" />
                {local.roles.map(role => (
                  ['R', 'C', 'U', 'D'].map(p => (
                    <th key={`${role}-${p}`} className="text-center py-2 text-[10px] font-semibold text-slate-400 border-l border-slate-100 dark:border-[#1f1f1f] w-10">
                      {p === 'R' ? 'Read' : p === 'C' ? 'Cre' : p === 'U' ? 'Upd' : 'Del'}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {local.resources.map(resource => (
                <tr key={resource} className="hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                  <td className="px-5 py-3 font-semibold text-slate-800 sticky left-0 bg-card capitalize border-r border-slate-100 dark:border-[#1f1f1f]">{resource}</td>
                  {local.roles.map(role => (
                    (['read', 'create', 'update', 'delete'] as const).map(perm => {
                      const isSuperAdminPayment = (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'super_admin') && 
                        (resource.toLowerCase().includes('payment') || resource.toLowerCase().includes('billing'));
                      const checked = isSuperAdminPayment ? false : (local.matrix[resource]?.[role]?.[perm] || false);
                      return (
                        <td key={`${role}-${perm}`} className="text-center py-3 border-l border-slate-100 dark:border-[#1f1f1f]">
                          {isSuperAdminPayment ? (
                            <span title="Super Admin excluded from payment features">
                              <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(resource, role, perm)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#F59E0B] cursor-pointer accent-[#F59E0B]"
                            />
                          )}
                        </td>
                      );
                    })
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {local.resources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Grid3X3 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No permission data</p>
          </div>
        )}
      </div>
    </div>
  );
}
