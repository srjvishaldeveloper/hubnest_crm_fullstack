'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  User, Shield, Settings, HelpCircle, Bell, Mail, Phone, Building2,
  Calendar, Award, CheckCircle2, Key, Lock, Smartphone, Eye, EyeOff,
  BarChart3, Megaphone, Users, TrendingUp, Activity, FileText,
  BellRing, ShieldCheck, LifeBuoy, ArrowRight, Sparkles, LogOut,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TABS = ['Overview', 'Performance', 'Security', 'Notifications', 'Help'];

const perfMetrics = [
  { label: 'Campaigns Handled', value: '14', icon: Megaphone, color: 'text-violet-600 bg-violet-50' },
  { label: 'Leads Generated', value: '1,847', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'ROI Achieved', value: '214%', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  { label: 'Active Campaigns', value: '8', icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
];

const campaignSummary = [
  { name: 'Summer Sale 2024', platform: 'Facebook', leads: 312, roi: 245, status: 'Active' },
  { name: 'Google Brand Awareness', platform: 'Google', leads: 198, roi: 189, status: 'Active' },
  { name: 'Insta Story Leads', platform: 'Instagram', leads: 154, roi: 210, status: 'Active' },
  { name: 'Website Retargeting', platform: 'Website', leads: 89, roi: 98, status: 'Paused' },
  { name: 'LinkedIn B2B', platform: 'LinkedIn', leads: 67, roi: 145, status: 'Active' },
];

const leadSummary = [
  { name: 'Facebook', value: 45, color: '#4F46E5' },
  { name: 'Google', value: 25, color: '#2563EB' },
  { name: 'Instagram', value: 15, color: '#7C3AED' },
  { name: 'Others', value: 15, color: '#64748B' },
];

const activitySummary = [
  { action: 'Created campaign "Summer Sale 2024"', time: '2 days ago', icon: Megaphone, color: 'bg-violet-100 text-violet-600' },
  { action: 'Optimised Facebook budget by ₹5,000', time: '3 days ago', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { action: 'Assigned 120 leads to sales team', time: '4 days ago', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { action: 'Paused Website Retargeting campaign', time: '5 days ago', icon: Activity, color: 'bg-amber-100 text-amber-600' },
  { action: 'Generated ROI report for June', time: '1 week ago', icon: FileText, color: 'bg-indigo-100 text-indigo-600' },
];

const budgetData = [
  { platform: 'Facebook', allocated: 35000, spent: 28400, remaining: 6600 },
  { platform: 'Google', allocated: 28000, spent: 22100, remaining: 5900 },
  { platform: 'Instagram', allocated: 18500, spent: 15200, remaining: 3300 },
  { platform: 'LinkedIn', allocated: 15000, spent: 12800, remaining: 2200 },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Paused: 'bg-amber-100 text-amber-700',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export default function MarketingProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [campaignAlerts, setCampaignAlerts] = useState(true);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Compute profile completeness dynamically
  // If phone exists, completeness is 100%, otherwise 85%
  const hasPhone = phone && phone.trim().length > 0;
  const completeness = hasPhone ? 100 : 85;

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const handleSaveChanges = () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('A valid email address is required.');
      return;
    }
    if (phone && /[a-zA-Z]/.test(phone)) {
      setErrorMsg('Phone Number cannot contain letters.');
      return;
    }

    // Update global auth store state
    if (user) {
      setUser({
        ...user,
        name: name.trim(),
        email: email.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setErrorMsg('');
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    setIsEditing(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MH';

  return (
    <div className="space-y-6 pb-4">

      {/* ── Profile Banner ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" />
        <div className="px-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center text-white text-2xl font-extrabold">
                {initials}
              </div>
            </div>
            <div className="text-center sm:text-left pb-1">
              <h2 className="text-lg font-extrabold text-[#0F172A]">{user?.name || 'Priya Sharma'}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.adminId || 'MKT-1001'} · {user?.role || 'Marketing Head'}</p>
              <div className="flex gap-1.5 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-lg border border-violet-100 uppercase tracking-wide">
                  {user?.role || 'Marketing Head'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wide">
                  Active
                </span>
              </div>
            </div>
          </div>
          {/* Completeness Ring */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl shrink-0 self-center md:self-end">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeWidth="3" stroke="#E2E8F0" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path
                  strokeDasharray={`${completeness}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="#4F46E5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute font-bold text-[#0F172A] ${completeness === 100 ? 'text-[9px]' : 'text-[10px]'}`}>{completeness}%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A]">Profile Completed</p>
              <p className="text-[9px] text-slate-500">
                {completeness === 100 ? 'All details verified' : 'Add phone for 100%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#4F46E5] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] mt-0.5 truncate">{user?.name || 'Priya Sharma'}</p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] mt-0.5 truncate">{user?.email || 'priya@company.com'}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] mt-0.5 truncate">{phone || 'Not Provided'}</p>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Department</p>
                  <p className="text-xs font-semibold text-[#0F172A] mt-0.5">Marketing</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Role</p>
                  <p className="text-xs font-semibold text-[#0F172A] mt-0.5">{user?.role || 'Marketing Head'}</p>
                </div>
              </div>

              {/* Joined */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Joined</p>
                  <p className="text-xs font-semibold text-[#0F172A] mt-0.5">January 2024</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="mt-3 text-xs text-red-500 font-semibold">{errorMsg}</p>
            )}

            <div className="mt-4 flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Performance KPIs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">My Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {perfMetrics.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="text-center p-4 bg-slate-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl font-extrabold text-[#0F172A]">{m.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activitySummary.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl ${a.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#0F172A]">{a.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Performance' && (
        <div className="space-y-6">
          {/* Campaign Performance Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Campaign Performance Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Campaign', 'Platform', 'Leads', 'ROI', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaignSummary.map(c => (
                    <tr key={c.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-semibold text-[#0F172A]">{c.name}</td>
                      <td className="px-4 py-3 text-slate-500">{c.platform}</td>
                      <td className="px-4 py-3 font-bold text-[#0F172A]">{c.leads}</td>
                      <td className="px-4 py-3">
                        <span className={`font-extrabold ${c.roi >= 200 ? 'text-green-600' : c.roi >= 150 ? 'text-blue-600' : 'text-red-500'}`}>
                          {c.roi}%
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Generation Summary */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Lead Generation Summary</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={leadSummary} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="value" paddingAngle={3}>
                        {leadSummary.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-sm font-extrabold text-[#0F172A]">1,847</p>
                    <p className="text-[9px] text-slate-400">Total</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {leadSummary.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-slate-600">{s.name}</span>
                      </div>
                      <span className="font-bold text-[#0F172A]">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Budget Performance</h3>
              <div className="space-y-3">
                {budgetData.map(b => (
                  <div key={b.platform}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{b.platform}</span>
                      <span className="text-slate-500">₹{b.spent.toLocaleString()} / ₹{b.allocated.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4F46E5] rounded-full"
                        style={{ width: `${Math.round((b.spent / b.allocated) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">₹{b.remaining.toLocaleString()} remaining</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Security Settings</h3>
            <div className="space-y-4">
              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Key className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">Password</p>
                    <p className="text-[10px] text-slate-400">Last changed 30 days ago</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-[#4F46E5] hover:underline">Change</button>
              </div>
              {/* 2FA */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">Two-Factor Authentication</p>
                    <p className="text-[10px] text-slate-400">Adds extra layer of security</p>
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${twoFactor ? 'bg-[#4F46E5]' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${twoFactor ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {/* Active Sessions */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Smartphone className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">Active Sessions</p>
                    <p className="text-[10px] text-slate-400">2 devices logged in</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome · Windows 11', location: 'Mumbai, IN', current: true },
                    { device: 'Safari · iPhone 14', location: 'Mumbai, IN', current: false },
                  ].map(s => (
                    <div key={s.device} className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-[#0F172A]">{s.device}</p>
                        <p className="text-[10px] text-slate-400">{s.location}</p>
                      </div>
                      {s.current ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Current</span>
                      ) : (
                        <button className="text-[10px] font-bold text-red-500 hover:underline">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotif, set: setEmailNotif, icon: Mail },
              { label: 'SMS Notifications', desc: 'Receive alerts via SMS', value: smsNotif, set: setSmsNotif, icon: Phone },
              { label: 'Campaign Alerts', desc: 'Budget, ROI and lead alerts', value: campaignAlerts, set: setCampaignAlerts, icon: BellRing },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${item.value ? 'bg-[#4F46E5]' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.value ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Help' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <LifeBuoy className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="text-[13px] font-bold text-[#0F172A]">Help & Support</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Marketing Module Guide', desc: 'Learn how to create campaigns, manage leads, and track ROI.' },
                { title: 'Campaign Best Practices', desc: 'Tips for maximising ROI and lead quality across platforms.' },
                { title: 'Lead Management Walkthrough', desc: 'How to assign, track, and convert marketing leads.' },
                { title: 'Analytics & Reporting', desc: 'Generate custom reports and export campaign analytics.' },
                { title: 'Contact Support', desc: 'Reach our team for urgent issues or technical questions.' },
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-violet-50/40 transition cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-[#4F46E5]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-2xl p-6 text-white text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-violet-200" />
            <p className="font-bold text-base">Need help with campaigns?</p>
            <p className="text-sm text-violet-200 mt-1">Our AI assistant can help you optimise campaigns and improve ROI.</p>
            <button className="mt-4 px-6 py-2 bg-white text-[#4F46E5] font-bold text-xs rounded-xl hover:bg-violet-50 transition">
              Ask AI Assistant
            </button>
          </div>
        </div>
      )}

      {/* Logout Card */}
      <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Session Management</h4>
          <p className="text-xs text-slate-400">Ready to leave? Make sure you save any unsaved work before logging out.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 transition-colors w-full sm:w-auto shrink-0"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout from System
        </button>
      </div>

    </div>
  );
}
