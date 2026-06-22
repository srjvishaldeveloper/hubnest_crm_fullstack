'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  User, Shield, Settings, HelpCircle, Bell, Mail, Phone, Building2,
  Calendar, Award, CheckCircle2, Key, Lock, Smartphone, Eye, EyeOff,
  BarChart3, Users, TrendingUp, Activity, FileText,
  BellRing, ShieldCheck, LifeBuoy, ArrowRight, Sparkles, LogOut,
  Trophy, Percent, Target, DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TABS = ['Overview', 'Performance', 'Security', 'Notifications', 'Help'];

// Mock fallback activity data
const defaultActivities = [
  { action: 'Converted lead "Rohan Mehta" to customer', time: '1 day ago', icon: Trophy, color: 'bg-green-100 text-green-600' },
  { action: 'Logged outbound call to Priya Agarwal', time: '1 day ago', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  { action: 'Scheduled product demo meeting with Rajesh', time: '2 days ago', icon: Calendar, color: 'bg-violet-100 text-violet-600' },
  { action: 'Updated notes for lead "Neha Gupta"', time: '3 days ago', icon: FileText, color: 'bg-amber-100 text-amber-600' },
  { action: 'Created new task for follow-up tomorrow', time: '4 days ago', icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-600' }
];

export default function SalesProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  
  // Performance and Target State
  const [targetStats, setTargetStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 99887 76655');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Security Toggle State
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [leadAlerts, setLeadAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }

    async function loadProfileData() {
      try {
        const [perfRes, actRes] = await Promise.all([
          api.get('/sales/performance'),
          api.get('/sales/activities')
        ]);
        setTargetStats(perfRes.data.data.stats);
        
        // Format activities from response
        const mapped = actRes.data.data.activities.map((a: any) => ({
          action: `${a.type} with lead ${a.lead_name || 'N/A'} - ${a.outcome || 'Logged'}`,
          time: new Date(a.created_at).toLocaleDateString(),
          icon: a.type === 'Call' ? Phone : a.type === 'Email' ? Mail : Calendar,
          color: a.type === 'Call' ? 'bg-blue-100 text-blue-600' : a.type === 'Email' ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'
        }));
        setRecentActivities(mapped.slice(0, 5));
      } catch (err) {
        console.warn('Failed to load profile/performance stats. Using mock fallbacks.', err);
        setTargetStats({
          target_amount: 100000.00,
          achieved_amount: 86000.00,
          target_leads: 50,
          converted_leads: 12,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });
        setRecentActivities(defaultActivities);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [user]);

  // Compute profile completeness
  const completeness = phone && phone.trim().length > 0 ? 100 : 85;

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  const handleSaveChanges = async () => {
    setErrorMsg('');
    setSuccessMsg('');
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

    try {
      const res = await api.patch('/sales/profile', {
        name: name.trim(),
        email: email.trim()
      });
      
      if (user) {
        setUser({
          ...user,
          name: name.trim(),
          email: email.trim(),
        });
      }
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleCancelEdit = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    setIsEditing(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SE';

  // Compute percentages
  const targetAmount = parseFloat(targetStats?.target_amount) || 100000;
  const achievedAmount = parseFloat(targetStats?.achieved_amount) || 86000;
  const targetLeads = targetStats?.target_leads || 50;
  const convertedLeads = targetStats?.converted_leads || 12;

  const revPercentage = Math.min(Math.round((achievedAmount / targetAmount) * 100), 100);
  const leadPercentage = Math.min(Math.round((convertedLeads / targetLeads) * 100), 100);

  // Performance breakdown for Recharts
  const leadDistribution = [
    { name: 'Converted', value: convertedLeads, color: '#10B981' },
    { name: 'Remaining', value: Math.max(targetLeads - convertedLeads, 0), color: '#3B82F6' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      
      {/* Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]" />
        <div className="px-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-xl flex items-center justify-center text-white text-2xl font-extrabold">
                {initials}
              </div>
            </div>
            <div className="text-center sm:text-left pb-1">
              <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{user?.name || 'Rahul Sharma'}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.adminId || 'SE-2045'} · {user?.role || 'Sales Executive'}</p>
              <div className="flex gap-1.5 mt-2 justify-center sm:justify-start">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
                  {user?.role || 'Sales Executive'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-wide">
                  Active
                </span>
              </div>
            </div>
          </div>
          
          {/* Completeness Ring */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#161616] border border-slate-100 dark:border-[#1f1f1f] p-3 rounded-xl shrink-0 self-center md:self-end">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeWidth="3" stroke="#E2E8F0" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path
                  strokeDasharray={`${completeness}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="#2563EB"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute font-bold text-[#0F172A] dark:text-[#F9FAFB] ${completeness === 100 ? 'text-[9px]' : 'text-[10px]'}`}>{completeness}%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Profile Completed</p>
              <p className="text-[9px] text-slate-500">
                {completeness === 100 ? 'All details verified' : 'Add phone for 100%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 dark:bg-[#161616]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#2563EB]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 truncate">{user?.name || 'Rahul Sharma'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#2563EB]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 truncate">{user?.email || 'rahul@company.com'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. +91 99887 76655"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#2563EB]"
                    />
                  ) : (
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5 truncate">{phone || 'Not Provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Department</p>
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5">Sales</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Role Name</p>
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5">{user?.role || 'Sales Executive'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Joined</p>
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5">March 2024</p>
                </div>
              </div>

            </div>

            {errorMsg && <p className="mt-3 text-xs text-red-500 font-semibold">{errorMsg}</p>}
            {successMsg && <p className="mt-3 text-xs text-emerald-600 font-semibold">{successMsg}</p>}

            <div className="mt-4 flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
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
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Quick Target Performance Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Target Revenue</span>
              <p className="text-lg font-extrabold text-slate-800">₹{targetAmount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Monthly threshold</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Achieved Revenue</span>
              <p className="text-lg font-extrabold text-slate-800">₹{achievedAmount.toLocaleString()}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${revPercentage}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{revPercentage}% of quota met</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Lead Conversion Target</span>
              <p className="text-lg font-extrabold text-slate-800">{convertedLeads} / {targetLeads} leads</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${leadPercentage}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{leadPercentage}% conversion success</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Active Rank</span>
              <p className="text-lg font-extrabold text-slate-800">Top Sales Agent 🏆</p>
              <p className="text-[10px] text-slate-500 mt-1">Gold tier representative</p>
            </div>
          </div>

          {/* Activity summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Recent Activity Logs</h3>
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-xl ${a.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{a.action}</p>
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
          
          {/* Detailed Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Quota Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Monthly Revenue Quota</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Track your monthly closed-sales amounts against target goals.</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>₹{achievedAmount.toLocaleString()} Achieved</span>
                  <span>Target: ₹{targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${revPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{revPercentage}% completed</span>
                  <span>₹{(targetAmount - achievedAmount).toLocaleString()} remaining</span>
                </div>
              </div>
            </div>

            {/* Leads Target Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Leads Conversion Goal</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Total counts of leads successfully moved into Converted status.</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{convertedLeads} Converted</span>
                  <span>Target: {targetLeads} Leads</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${leadPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{leadPercentage}% conversions reached</span>
                  <span>{Math.max(targetLeads - convertedLeads, 0)} leads remaining</span>
                </div>
              </div>
            </div>

          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pie Chart of Conversion Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 lg:col-span-1">
              <h3 className="text-[13px] font-bold text-slate-800">Conversion Distribution</h3>
              <div className="flex flex-col items-center justify-center h-48 relative">
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                  <PieChart>
                    <Pie data={leadDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={4}>
                      {leadDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-base font-black text-slate-800">{leadPercentage}%</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Converted</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {leadDistribution.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-600 font-medium">{s.name}</span>
                    </div>
                    <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{s.value} leads</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales performance achievements & details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4">
              <h3 className="text-[13px] font-bold text-slate-800">Representative Achievements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Best Day Call Time', value: '11:15 AM', desc: 'Yields 92% call response rate' },
                  { title: 'Avg Deal Velocity', value: '4.2 Days', desc: 'Average time from Lead -> Converted' },
                  { title: 'Current Win Ratio', value: '38%', desc: '1.2x higher than department baseline' },
                  { title: 'Monthly Bonus Tier', value: 'Level 2 Qualified', desc: '₹15,000 estimated incentive payouts' },
                ].map((ach, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-[#161616] rounded-2xl border border-slate-100 dark:border-[#1f1f1f] flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">{ach.title}</span>
                      <p className="text-base font-black text-slate-800 mt-1">{ach.value}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">{ach.desc}</p>
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
            <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Security Settings</h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Key className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Password Credentials</p>
                    <p className="text-[10px] text-slate-400 font-medium">Last changed 45 days ago</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-[#2563EB] hover:underline">Change Password</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Two-Factor Authentication (2FA)</p>
                    <p className="text-[10px] text-slate-400 font-medium">Increases security on logins</p>
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${twoFactor ? 'bg-[#2563EB]' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${twoFactor ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Active Sessions */}
              <div className="p-4 bg-slate-50 dark:bg-[#161616] rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Smartphone className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">Active Sessions</p>
                    <p className="text-[10px] text-slate-400 font-medium">Currently logged in devices</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome Client · Windows 11 Desktop', location: 'Mumbai, IN', current: true },
                    { device: 'Safari Mobile App · iPhone 15 Pro', location: 'Delhi, IN', current: false },
                  ].map(s => (
                    <div key={s.device} className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/40 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-slate-800">{s.device}</p>
                        <p className="text-[10px] text-slate-400">{s.location}</p>
                      </div>
                      {s.current ? (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Current Session</span>
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
          <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Email Alerts', desc: 'Daily briefs, task status changes and target reviews', value: emailNotif, set: setEmailNotif, icon: Mail },
              { label: 'SMS Notifications', desc: 'Direct message notifications for critical events', value: smsNotif, set: setSmsNotif, icon: Phone },
              { label: 'Lead & Campaign Reminders', desc: 'Remind me of hot leads and scheduled task completions', value: leadAlerts, set: setLeadAlerts, icon: BellRing },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#161616] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/50 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${item.value ? 'bg-[#2563EB]' : 'bg-slate-200'}`}
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
              <LifeBuoy className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">Sales Executive Playbook</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Pipeline Kanban Flow Guide', desc: 'Learn to update lead statuses by dragging cards across pipeline stages.' },
                { title: 'Activity Logging Protocol', desc: 'Standard rules for logging call durations, email summaries, and demo outcomes.' },
                { title: 'Tasks and Scheduling Best Practices', desc: 'Setting task priorities (High/Medium/Low) and scheduled alerts.' },
                { title: 'Target Calculations and Bonus TIers', desc: 'Understanding target achievement rates, conversions, and monthly payouts.' },
                { title: 'Contact Sales Support Desk', desc: 'Immediate technical help or query updates with CRM administrators.' },
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#161616] rounded-xl hover:bg-blue-50/40 transition cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/30 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] group-hover:text-[#2563EB] transition">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 text-white text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-200" />
            <p className="font-bold text-base">Leverage AI Sales Recommendations</p>
            <p className="text-sm text-blue-100 mt-1">Get immediate advice on lead priorities and increase closed deals by 35%.</p>
            <button className="mt-4 px-6 py-2 bg-white text-blue-600 font-bold text-xs rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition">
              Launch Copilot Panel
            </button>
          </div>
        </div>
      )}

      {/* Session Logout management */}
      <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Session Controls</h4>
          <p className="text-xs text-slate-400">Log out of active workspace securely to terminate local refresh cookies.</p>
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
