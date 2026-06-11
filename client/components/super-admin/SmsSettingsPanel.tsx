'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Save, Send, RefreshCw, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

interface SmsSettings {
  id: string;
  provider_name: string;
  sender_id: string;
  otp_expiry_secs: number;
  max_otp_attempts: number;
  rate_limit_per_hour: number;
  is_enabled: boolean;
  templates: {
    otp?: string;
    credentials?: string;
  };
}

export default function SmsSettingsPanel() {
  const [settings, setSettings]       = useState<SmsSettings | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [testPhone, setTestPhone]     = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [toast, setToast]             = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data } = await api.get('/sms/settings');
      setSettings(data.data.settings);
    } catch {
      showToast('error', 'Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/sms/settings', {
        otp_expiry_secs:     settings.otp_expiry_secs,
        max_otp_attempts:    settings.max_otp_attempts,
        rate_limit_per_hour: settings.rate_limit_per_hour,
        is_enabled:          settings.is_enabled,
        sender_id:           settings.sender_id,
        templates:           settings.templates,
      });
      showToast('success', 'SMS settings saved successfully');
    } catch {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSms() {
    if (!testPhone.trim()) return;
    setTestLoading(true);
    try {
      await api.post('/sms/test', { phone: testPhone.trim(), message: testMessage || undefined });
      showToast('success', `Test SMS sent to ${testPhone}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send test SMS';
      showToast('error', msg);
    } finally {
      setTestLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-[#222] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Settings Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
              SMS Configuration
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Twilio provider settings and OTP parameters</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings(s => s ? { ...s, is_enabled: !s.is_enabled } : s)}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            {settings.is_enabled ? (
              <><ToggleRight className="w-6 h-6 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Enabled</span></>
            ) : (
              <><ToggleLeft className="w-6 h-6 text-slate-400" /><span className="text-slate-500 dark:text-slate-400">Disabled</span></>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Read-only provider info */}
          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Provider</label>
            <input
              type="text"
              value={settings.provider_name}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-slate-50 dark:bg-[#1a1a1a] text-slate-500 dark:text-slate-400 text-sm outline-none capitalize"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Sender ID</label>
            <input
              type="text"
              value={settings.sender_id}
              onChange={(e) => setSettings(s => s ? { ...s, sender_id: e.target.value } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">OTP Expiry (seconds)</label>
            <input
              type="number"
              min={60} max={600}
              value={settings.otp_expiry_secs}
              onChange={(e) => setSettings(s => s ? { ...s, otp_expiry_secs: parseInt(e.target.value, 10) } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Max OTP Attempts</label>
            <input
              type="number"
              min={1} max={10}
              value={settings.max_otp_attempts}
              onChange={(e) => setSettings(s => s ? { ...s, max_otp_attempts: parseInt(e.target.value, 10) } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Rate Limit (per hour)</label>
            <input
              type="number"
              min={1} max={100}
              value={settings.rate_limit_per_hour}
              onChange={(e) => setSettings(s => s ? { ...s, rate_limit_per_hour: parseInt(e.target.value, 10) } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </div>
        </div>

        {/* Templates */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">OTP SMS Template</label>
            <textarea
              rows={2}
              value={settings.templates?.otp || ''}
              onChange={(e) => setSettings(s => s ? { ...s, templates: { ...s.templates, otp: e.target.value } } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Variables: {'{otp}'}, {'{expiry}'}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Credentials SMS Template</label>
            <textarea
              rows={3}
              value={settings.templates?.credentials || ''}
              onChange={(e) => setSettings(s => s ? { ...s, templates: { ...s.templates, credentials: e.target.value } } : s)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Variables: {'{email}'}, {'{password}'}, {'{url}'}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-[#1f1f1f] mt-6 pt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Test SMS Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6">
        <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2 text-sm mb-5">
          <Send className="w-4 h-4 text-[#F59E0B]" />
          Test SMS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Phone Number</label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+91 8750481020"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1.5 block uppercase tracking-wide">Message (optional)</label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test message from HubNest CRM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#222] bg-white dark:bg-[#161616] text-slate-900 dark:text-white text-sm outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleTestSms}
            disabled={testLoading || !testPhone.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl transition disabled:opacity-60"
          >
            {testLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {testLoading ? 'Sending...' : 'Send Test SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}
