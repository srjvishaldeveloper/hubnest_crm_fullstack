'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Sparkles, Building, Globe, HardDrive, AlertTriangle } from 'lucide-react';
import api from '@/services/api';

export default function AdminSystemSettingsPage() {
  const [firmName, setFirmName] = useState('Client CRM');
  const [emailDomain, setEmailDomain] = useState('jobnest.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [departments, setDepartments] = useState<any[]>([]);
  const [globalStorage, setGlobalStorage] = useState<{current: number, limit: number}>({ current: 0, limit: 1 });
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch department storage
      const res = await api.get('/admin/departments/storage');
      if (res.data?.success) setDepartments(res.data.data.departments);
      
      // Fetch global storage limit from subscription usage
      const usageRes = await api.get('/subscription/usage');
      if (usageRes.data?.success) {
        const storageUsage = usageRes.data.data.usage.find((u: any) => u.resource === 'storage_bytes');
        if (storageUsage) {
          setGlobalStorage({ current: storageUsage.current, limit: storageUsage.limit });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  const handleUpdateQuota = async (deptId: string, quota: number) => {
    try {
      await api.put(`/admin/departments/${deptId}/storage`, { storage_quota: quota });
      fetchData();
    } catch (err) {
      console.error('Failed to update quota', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === -1) return 'Unlimited';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const globalUsagePercent = globalStorage.limit > 0 ? (globalStorage.current / globalStorage.limit) * 100 : 0;
  const isGlobalWarning = globalUsagePercent >= 90;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Manage global firm metadata, corporate email configurations, localization, and storage.</p>
      </div>

      {isGlobalWarning && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>⚠️ You have used {globalUsagePercent.toFixed(1)}% of your storage plan. Please upgrade your plan to avoid interruption.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" /> Firm Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Company/Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Corporate Domain</label>
                <input
                  type="text"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" /> Storage Management
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                Total: {formatBytes(globalStorage.current)} / {formatBytes(globalStorage.limit)}
              </span>
            </div>
            
            {/* Global Storage Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all ${isGlobalWarning ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                style={{ width: `${Math.min(globalUsagePercent, 100)}%` }}
              ></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 text-[10px] uppercase font-bold text-slate-500">Department</th>
                    <th className="py-2 text-[10px] uppercase font-bold text-slate-500">Used Storage</th>
                    <th className="py-2 text-[10px] uppercase font-bold text-slate-500">Quota (GB)</th>
                    <th className="py-2 text-[10px] uppercase font-bold text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 text-xs font-bold text-slate-800">{dept.name}</td>
                      <td className="py-3 text-xs font-medium text-slate-600">
                        {formatBytes(parseInt(dept.storage_used, 10))}
                        {parseInt(dept.storage_quota, 10) > 0 && (
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${parseInt(dept.storage_used, 10) / parseInt(dept.storage_quota, 10) > 0.9 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min((parseInt(dept.storage_used, 10) / parseInt(dept.storage_quota, 10)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <input 
                          type="number" 
                          min="0"
                          step="0.1"
                          defaultValue={dept.storage_quota > 0 ? (dept.storage_quota / (1024*1024*1024)).toFixed(1) : 0}
                          onBlur={(e) => {
                            const gb = parseFloat(e.target.value);
                            const bytes = gb * 1024 * 1024 * 1024;
                            if (bytes !== parseFloat(dept.storage_quota)) {
                              handleUpdateQuota(dept.id, bytes);
                            }
                          }}
                          className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded">Update</button>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-slate-500">No departments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Note: Set Quota to 0 for unlimited storage within the tenant's global limit.</p>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> Localization & Currency
            </h3>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">System Timezone</label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold">
                  <option>Asia/Kolkata (GMT+5:30)</option>
                  <option>America/New_York (EST)</option>
                  <option>UTC / GMT</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Action Center
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">Save configuration changes to update settings across the workspace instantly.</p>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
