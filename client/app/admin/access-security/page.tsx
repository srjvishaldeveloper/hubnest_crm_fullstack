'use client';

import { useState } from 'react';
import { Lock, ShieldAlert, Key, Globe, Eye } from 'lucide-react';

export default function AdminAccessSecurityPage() {
  const [mfa, setMfa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [ipWhitelist, setIpWhitelist] = useState('103.45.67.12, 192.168.1.1');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Access & Security Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure user authentication, multi-factor authorization, and strict session limits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Auth Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> Password & Login Policies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Session Timeout (minutes)</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-semibold"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">MFA Login Verification</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={mfa}
                    onChange={(e) => setMfa(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 font-bold">Enforce OTP via Email</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> IP Whitelisting
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">Limit access to specific corporate IP addresses to prevent unauthorized login attempts.</p>
            <div className="pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Allowed IP List (Comma separated)</label>
              <textarea
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition font-mono"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Security Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Security Status
            </h3>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">MFA Status</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Session Limit</span>
                <span className="font-bold text-slate-700">{sessionTimeout} mins</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Active IP Restrictions</span>
                <span className="font-bold text-slate-700">2 active IPs</span>
              </div>
            </div>
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm mt-4">
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
