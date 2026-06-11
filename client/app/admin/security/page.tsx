'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Smartphone, Mail, Check, Loader2, Phone, Eye, EyeOff,
  ShieldCheck, ShieldAlert, Clock, Activity, Globe, Monitor,
} from 'lucide-react';
import {
  getMFASettings, updateMFASettings, sendPhoneVerification,
  verifyPhone, getAuditLog, getLoginStats,
} from '../../../services/subscriptionService';

export default function SecurityMFAPage() {
  const [mfa, setMfa] = useState<any>({});
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Phone verification
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mfaData, logs, loginStats] = await Promise.all([
        getMFASettings(),
        getAuditLog(20),
        getLoginStats(),
      ]);
      setMfa(mfaData);
      setAuditLog(logs);
      setStats(loginStats);
    } catch (err) {
      console.error('Failed to load MFA data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleMFA() {
    setSaving(true);
    try {
      const updated = await updateMFASettings({ mfaEnabled: !mfa.mfaEnabled });
      setMfa(updated);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update MFA settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleMethodChange(method: string) {
    setSaving(true);
    try {
      const updated = await updateMFASettings({ preferredMethod: method });
      setMfa(updated);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update MFA method');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendPhoneOTP() {
    if (!phoneNumber) return;
    setSendingOtp(true);
    try {
      await sendPhoneVerification(phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyPhone() {
    if (!otp) return;
    setVerifying(true);
    try {
      await verifyPhone(otp);
      setMfa({ ...mfa, phoneVerified: true, phoneNumber });
      setShowPhoneInput(false);
      setOtpSent(false);
      setOtp('');
      alert('Phone verified successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const eventIcons: Record<string, { icon: any; color: string }> = {
    login_success: { icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' },
    login_failed: { icon: ShieldAlert, color: 'text-red-500 bg-red-50' },
    login_attempt: { icon: Activity, color: 'text-blue-500 bg-blue-50' },
    otp_sent: { icon: Mail, color: 'text-violet-500 bg-violet-50' },
    otp_verified: { icon: Check, color: 'text-green-500 bg-green-50' },
    mfa_enabled: { icon: Shield, color: 'text-emerald-500 bg-emerald-50' },
    mfa_disabled: { icon: ShieldAlert, color: 'text-amber-500 bg-amber-50' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Security & MFA</h2>
        <p className="text-xs text-slate-500 mt-1">Manage multi-factor authentication and review login activity.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Logins', value: stats.totalLogins || 0, icon: Activity, color: 'text-blue-600 bg-blue-50' },
          { label: 'Last 30 Days', value: stats.loginsLast30Days || 0, icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Failed (7 Days)', value: stats.failedAttemptsLast7Days || 0, icon: ShieldAlert, color: 'text-red-600 bg-red-50' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MFA Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Multi-Factor Authentication</h3>

        {/* Toggle MFA */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50 mb-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${mfa.mfaEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">MFA Enabled</p>
              <p className="text-[10px] text-slate-500">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button
            onClick={handleToggleMFA}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              mfa.mfaEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              mfa.mfaEnabled ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>

        {/* OTP Method Selection */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred OTP Method</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'email', label: 'Email OTP', icon: Mail, desc: 'Receive OTP via email' },
              { value: 'sms', label: 'SMS OTP', icon: Smartphone, desc: 'Receive OTP via SMS' },
              { value: 'both', label: 'Both', icon: Shield, desc: 'SMS first, email fallback' },
            ].map((method) => {
              const Icon = method.icon;
              const selected = mfa.preferredMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => handleMethodChange(method.value)}
                  disabled={saving}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    selected
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-bold ${selected ? 'text-blue-700' : 'text-[#0F172A] dark:text-[#F9FAFB]'}`}>{method.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{method.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Verification */}
        <div className="mt-4 p-4 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Phone Number</p>
                <p className="text-[10px] text-slate-500">
                  {mfa.phoneNumber
                    ? `${mfa.phoneNumber} ${mfa.phoneVerified ? '✓ Verified' : '— Not verified'}`
                    : 'No phone number configured'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPhoneInput(!showPhoneInput)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              {mfa.phoneNumber ? 'Change' : 'Add Phone'}
            </button>
          </div>

          {showPhoneInput && (
            <div className="mt-3 space-y-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-semibold"
              />
              {!otpSent ? (
                <button
                  onClick={handleSendPhoneOTP}
                  disabled={sendingOtp || !phoneNumber}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Verification Code'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-mono font-bold text-center"
                  />
                  <button
                    onClick={handleVerifyPhone}
                    disabled={verifying || !otp}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Login Activity</h3>
        {auditLog.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No login activity recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {auditLog.map((log) => {
              const meta = eventIcons[log.event_type] || { icon: Activity, color: 'text-slate-500 bg-slate-50 dark:bg-[#161616]' };
              const Icon = meta.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] hover:bg-slate-50 dark:bg-[#161616]/50 transition">
                  <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] capitalize">
                      {log.event_type.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {log.device_type && (
                        <span className="text-[10px] text-slate-500">
                          <Monitor className="w-3 h-3 inline mr-0.5" />
                          {log.device_type}
                        </span>
                      )}
                      {log.browser && (
                        <span className="text-[10px] text-slate-500">
                          <Globe className="w-3 h-3 inline mr-0.5" />
                          {log.browser}
                        </span>
                      )}
                      {log.ip_address && (
                        <span className="text-[10px] text-slate-400 font-mono">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
