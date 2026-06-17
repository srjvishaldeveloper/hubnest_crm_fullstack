'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/super-admin/Sidebar';
import api from '../../services/api';
import Header from '../../components/super-admin/Header';
import SessionTimer from '../../components/SessionTimer';
import AIChatbot from '../../components/AIChatbot';
import { useSuperAdminUIStore } from '../../store/uiStore';
import { useTenantStore } from '../../store/tenantStore';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Menu as MenuIcon,
  X,
  Copy,
  Check,
  Building2,
  Award,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

function validatePhone(val: string): string {
  const cleaned = val.replace(/[\s\-().]/g, '');
  if (!cleaned) return '';
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return 'Phone must be 7–15 digits, optionally starting with + (e.g. +919876543210)';
  return '';
}

const createTenantSchema = z.object({
  companyName: z.string().min(2, "Company Name must be at least 2 characters"),
  adminName: z.string().min(2, "Admin Name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid admin email address"),
  companyEmail: z.union([z.string().email("Invalid company email"), z.literal('')]).optional(),
  adminPhone: z.string().optional().transform(val => (val || '').replace(/[\s\-().]/g, '')),
});

const MOBILE_NAV = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/super-admin/users', icon: Users },
  { label: 'Reports', href: '/super-admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings },
  { label: 'Menu', href: '#', icon: MenuIcon, isTrigger: true },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal store access
  const { showAddTenantModal, setShowAddTenantModal } = useSuperAdminUIStore();
  const { admins, addTenant } = useTenantStore();

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Starter');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Blocked'>('Active');
  const [sendCreds, setSendCreds] = useState(true);

  // Generated results
  const [generatedId, setGeneratedId] = useState('');
  const [generatedPwd, setGeneratedPwd] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Email validation checking states
  const [emailCheckErr, setEmailCheckErr] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Phone validation state
  const [phoneErr, setPhoneErr] = useState('');
  const [formErr, setFormErr] = useState('');

  // Generate credentials when modal opens
  useEffect(() => {
    if (showAddTenantModal) {
      const nextNum = 1000 + admins.length;
      setGeneratedId(`ADM-${nextNum}`);
      setGeneratedPwd('Tenant@' + Math.random().toString(36).slice(-6));
      setShowSuccess(false);
      // Reset inputs
      setCompanyName('');
      setCompanyEmail('');
      setAdminName('');
      setAdminEmail('');
      setAdminPhone('');
      setPlan('Starter');
      setStatus('Active');
      setEmailCheckErr('');
      setEmailAvailable(null);
      setCheckingEmail(false);
      setPhoneErr('');
      setFormErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddTenantModal]);

  async function handleEmailBlur() {
    const trimmed = adminEmail.trim();
    if (!trimmed) {
      setEmailAvailable(null);
      setEmailCheckErr('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailAvailable(false);
      setEmailCheckErr('Please enter a valid admin email address.');
      return;
    }

    setCheckingEmail(true);
    setEmailCheckErr('');
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
      const available = response.data?.data?.available;
      setEmailAvailable(available);
      if (!available) {
        setEmailCheckErr('This email is already in use. Try a different one.');
      } else {
        setEmailCheckErr('');
      }
    } catch (err: any) {
      console.error('Email check failed:', err);
    } finally {
      setCheckingEmail(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();

    setFormErr('');
    // Validate phone inline before zod parse
    const pErr = validatePhone(adminPhone);
    if (pErr) { setPhoneErr(pErr); return; }
    setPhoneErr('');

    try {
      const validatedData = createTenantSchema.parse({
        companyName,
        adminName,
        adminEmail,
        companyEmail,
        adminPhone
      });

      if (emailAvailable === false) {
        setEmailCheckErr('This email is already in use. Try a different one.');
        return;
      }
      
      setIsProvisioning(true);

      const response = await api.post('/auth/create-tenant', {
        companyName: validatedData.companyName,
        companyEmail: validatedData.companyEmail,
        adminName: validatedData.adminName,
        adminEmail: validatedData.adminEmail,
        adminPhone: validatedData.adminPhone,
        plan,
        status,
        adminId: generatedId,
        tempPassword: generatedPwd,
        sendCreds,
      });

      const data = response.data;
      if (data?.data?.emailError) {
        alert(`Tenant and Admin provisioned successfully in database!\n\n⚠️ However, the credentials email could not be sent due to email service error: ${data.data.emailError}\n\nPlease copy credentials manually:\nAdmin ID: ${generatedId}\nPassword: ${generatedPwd}`);
      } else {
        alert(`Tenant and Admin provisioned successfully!\n\nAdmin ID: ${generatedId}\nPassword: ${generatedPwd}`);
      }

      addTenant({
        company: companyName,
        companyEmail: companyEmail,
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        plan: plan,
        status: status,
        adminId: generatedId,
        passwordGenerated: generatedPwd,
      });
      setShowAddTenantModal(false);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setFormErr(err.issues[0].message);
        setIsProvisioning(false);
        return;
      }
      console.error('Failed to provision tenant:', err);
      if (err.response?.status === 409) {
        setEmailCheckErr('This email is already in use. Try a different one.');
        setEmailAvailable(false);
        setIsProvisioning(false);
        return;
      }
      setFormErr(err.response?.data?.message || 'Failed to provision tenant. Please try again.');
    } finally {
      setIsProvisioning(false);
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarCollapsed((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  }

  const sidebarW = sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[280px]';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <SessionTimer />
      <AIChatbot />
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 scrollbar-main">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-xl border-t border-slate-200/60 flex items-center safe-area-inset-bottom shadow-2xl">
        {MOBILE_NAV.map((navItem) =>
          navItem.isTrigger ? (
            <button
              key={navItem.label}
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-slate-400 hover:text-[#F59E0B] transition"
            >
              <navItem.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{navItem.label}</span>
            </button>
          ) : (
            <Link
              key={navItem.href}
              href={navItem.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-slate-400 hover:text-[#F59E0B] transition"
            >
              <navItem.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{navItem.label}</span>
            </Link>
          )
        )}
      </nav>

      {/* Add Tenant Modal (Single unified form) */}
      <AnimatePresence>
        {showAddTenantModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowAddTenantModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">Add B2B Tenant</h2>
                    <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Provision company workspace and auto-create Administrator</p>
                  </div>
                  <button onClick={() => setShowAddTenantModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {!showSuccess ? (
                  <form onSubmit={handleCreateTenant} className="flex-1 flex flex-col overflow-hidden">
                    {/* Form Fields */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
                      {/* Section 1: Company Workspace */}
                      <div>
                        <span className="text-[10px] font-extrabold text-[#F59E0B] tracking-wider uppercase">1. Workspace Workspace</span>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Company Name *</label>
                            <input
                              required
                              type="text"
                              value={companyName}
                              onChange={e => setCompanyName(e.target.value)}
                              placeholder="e.g. Acme Corporation"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Company Email</label>
                            <input
                              type="email"
                              value={companyEmail}
                              onChange={e => setCompanyEmail(e.target.value)}
                              placeholder="e.g. contact@acme.com"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Administrator */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
                        <span className="text-[10px] font-extrabold text-[#F59E0B] tracking-wider uppercase">2. Admin User Details</span>
                        <div className="mt-2 space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Admin Full Name *</label>
                            <input
                              required
                              type="text"
                              value={adminName}
                              onChange={e => setAdminName(e.target.value)}
                              placeholder="e.g. Rajesh Kumar"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Admin Email *</label>
                              <div className="relative">
                                <input
                                  required
                                  type="email"
                                  value={adminEmail}
                                  onChange={e => {
                                    setAdminEmail(e.target.value);
                                    setEmailAvailable(null);
                                    setEmailCheckErr('');
                                  }}
                                  onBlur={handleEmailBlur}
                                  placeholder="e.g. rajesh@acme.com"
                                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 outline-none transition ${
                                    emailCheckErr ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-amber-400 focus:ring-amber-100'
                                  } pr-10`}
                                />
                                {checkingEmail && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                )}
                                {!checkingEmail && emailAvailable === true && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm" title="Email available">✓</span>
                                )}
                                {!checkingEmail && emailAvailable === false && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm" title="Email already in use">✗</span>
                                )}
                              </div>
                              {emailCheckErr && (
                                <p className="text-[11px] text-red-500 mt-1 font-medium">{emailCheckErr}</p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Admin Phone</label>
                              <input
                                type="tel"
                                value={adminPhone}
                                onChange={e => {
                                  setAdminPhone(e.target.value);
                                  setFormErr('');
                                  if (phoneErr) setPhoneErr(validatePhone(e.target.value));
                                }}
                                onBlur={e => setPhoneErr(validatePhone(e.target.value))}
                                placeholder="e.g. +91 9876543210"
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 outline-none transition ${phoneErr ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-amber-400 focus:ring-amber-100'}`}
                              />
                              {phoneErr && <p className="text-[11px] text-red-500 mt-1 font-medium">{phoneErr}</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Admin Security Credentials */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
                        <span className="text-[10px] font-extrabold text-[#F59E0B] tracking-wider uppercase">3. Admin Security Credentials</span>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Admin ID *</label>
                            <input
                              required
                              type="text"
                              value={generatedId}
                              onChange={e => setGeneratedId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 dark:bg-[#161616] font-mono focus:border-amber-400 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Admin Password *</label>
                            <div className="relative flex items-center gap-2">
                              <input
                                required
                                type="text"
                                value={generatedPwd}
                                onChange={e => setGeneratedPwd(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 dark:bg-[#161616] font-mono focus:border-amber-400 outline-none transition pr-10"
                              />
                              <button
                                type="button"
                                onClick={handleCopy}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 border border-slate-200 bg-card rounded-lg hover:bg-slate-50 dark:bg-[#161616] transition"
                                title="Copy Password"
                              >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Subscriptions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
                        <span className="text-[10px] font-extrabold text-[#F59E0B] tracking-wider uppercase">4. Subscriptions & Status</span>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Plan</label>
                            <div className="relative">
                              <select
                                value={plan}
                                onChange={e => setPlan(e.target.value as any)}
                                className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 outline-none bg-card pr-10"
                              >
                                <option value="Starter">Starter Plan</option>
                                <option value="Pro">Pro Plan</option>
                                <option value="Enterprise">Enterprise Plan</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Status</label>
                            <div className="relative">
                              <select
                                value={status}
                                onChange={e => setStatus(e.target.value as any)}
                                className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 outline-none bg-card pr-10"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Email credentials notification checkbox */}
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendCreds}
                          onChange={e => setSendCreds(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#F59E0B] focus:ring-amber-200"
                        />
                        <div>
                          <span className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-semibold">Send workspace credentials to Admin Email</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Admin will receive an automated email containing login details</p>
                        </div>
                      </label>
                    </div>

                    {/* Form-level error */}
                    {formErr && (
                      <div className="mx-6 mb-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                        <span className="text-red-500 font-bold">✕</span> {formErr}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-slate-200/60 px-6 py-4 flex gap-3">
                      <button
                        type="button"
                        disabled={isProvisioning}
                        onClick={() => setShowAddTenantModal(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProvisioning || checkingEmail || emailAvailable === false}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition shadow-sm shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProvisioning ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Provisioning...</span>
                          </>
                        ) : (
                          'Provision Tenant'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="px-6 py-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 mx-auto">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Tenant Provisioned Successfully!</h3>
                      <p className="text-xs text-slate-500 mt-1">Workspace created and Admin account configured successfully.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#161616] border border-slate-200/60 rounded-2xl p-4 text-left space-y-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Generated Admin ID</span>
                        <span className="font-mono font-bold text-[#0F172A] dark:text-[#F9FAFB]">{generatedId}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Temporary Password</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F172A] dark:text-[#F9FAFB]">{generatedPwd}</span>
                          <button onClick={handleCopy} className="p-1.5 border border-slate-200 bg-card rounded-lg hover:bg-slate-50 dark:bg-[#161616] transition">
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddTenantModal(false)}
                      className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
                    >
                      Done & Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
