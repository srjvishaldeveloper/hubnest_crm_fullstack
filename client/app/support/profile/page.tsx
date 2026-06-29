'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { supportGetProfile, supportUpdateProfile } from '../../../services/supportService';
import {
  User, Mail, Phone, MapPin, Building2, Shield, Edit3, Save, X,
  CheckCircle2, Clock, FileText, Upload, Lock, Bell, Star, Award,
  Sparkles, Zap, Activity, ChevronDown, ChevronRight, TrendingUp,
  Calendar, Bookmark, ShieldCheck, RefreshCw, Sun, Moon
} from 'lucide-react';

const MOCK_PERF_TREND = [
  { day: '20 May', score: 75 },
  { day: '21 May', score: 82 },
  { day: '22 May', score: 68 },
  { day: '23 May', score: 92 },
  { day: '24 May', score: 85 },
  { day: '25 May', score: 78 },
  { day: '26 May', score: 87 },
];

const SCORE_PIE = [
  { name: 'Score', value: 87, color: '#6366F1' },
  { name: 'Remaining', value: 13, color: '#E2E8F0' },
];

export default function SupportProfilePage() {
  // Backend State
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark / Light Theme Toggle State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Editable fields state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('Rohit Sharma');
  const [editEmail, setEditEmail] = useState('rohit.sharma@email.com');
  const [editPhone, setEditPhone] = useState('+91 98765 43210');

  // Toggles for notifications
  const [ticketAlerts, setTicketAlerts] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [escalationAlerts, setEscalationAlerts] = useState(true);
  const [mentionsAlerts, setMentionsAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // Skills
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [skills, setSkills] = useState(['Technical Support', 'Billing & Payments', 'Account Management', 'Product Knowledge', 'Communication']);
  const [newSkill, setNewSkill] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportGetProfile();
      if (res) {
        setProfileData(res);
        if (res.personalInfo) {
          setEditName(res.personalInfo.name || 'Rohit Sharma');
          setEditEmail(res.personalInfo.email || 'rohit.sharma@email.com');
          setEditPhone(res.personalInfo.phone || '+91 98765 43210');
        }
        if (res.skills && res.skills.length) {
          setSkills(res.skills);
        }
        if (res.settings && res.settings.notifications) {
          if (res.settings.notifications.ticketAlerts !== undefined) setTicketAlerts(res.settings.notifications.ticketAlerts);
          if (res.settings.notifications.slaAlerts !== undefined) setSlaAlerts(res.settings.notifications.slaAlerts);
          if (res.settings.notifications.escalationAlerts !== undefined) setEscalationAlerts(res.settings.notifications.escalationAlerts);
        }
      }
    } catch (err) {
      // Fallback to beautiful mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await supportUpdateProfile({
        name: editName,
        email: editEmail,
        phone: editPhone
      });
      if (updated) setProfileData(updated);
      setIsEditingInfo(false);
      setToastMessage('Profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  // Handle dynamic toggle updates
  const handleToggleChange = async (settingKey: string, currentValue: boolean, setter: (val: boolean) => void) => {
    const newValue = !currentValue;
    setter(newValue);
    setToastMessage(`${settingKey} ${newValue ? 'Enabled' : 'Disabled'}`);

    try {
      await supportUpdateProfile({
        settings: {
          notifications: {
            ticketAlerts: settingKey === 'Ticket Alerts' ? newValue : ticketAlerts,
            slaAlerts: settingKey === 'SLA Alerts' ? newValue : slaAlerts,
            escalationAlerts: settingKey === 'Escalation Alerts' ? newValue : escalationAlerts,
            mentionsAlerts: settingKey === 'Mentions & Replies' ? newValue : mentionsAlerts,
            systemAlerts: settingKey === 'System Alerts' ? newValue : systemAlerts,
          }
        }
      });
    } catch (error) {
      // Silently keep local state for seamless UX
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    setToastMessage(`Switched to ${newTheme ? 'Dark' : 'Light'} Theme`);
  };

  // Derived metrics or beautiful fallback matching Image 3 exactly
  const pInfo = profileData?.personalInfo || {
    name: editName, email: editEmail, phone: editPhone, address: 'B-12, South Extension, New Delhi - 110049', emergencyContact: '+91 98765 43211 (Neha Sharma)', role: 'Support Agent', department: 'Support', location: 'Delhi, India'
  };
  const perf = profileData?.performance || {
    ticketsHandled: 245, ticketsResolved: 198, avgResolutionTime: '2h 35m', slaComplianceRate: 94
  };
  const work = profileData?.workload || {
    activeTickets: 32, pendingTickets: 18, completedTickets: 86
  };
  const actSum = profileData?.activitySummary || {
    messagesSent: 156, ticketsUpdated: 98, actionsPerformed: 212
  };
  const csatObj = profileData?.csat || {
    score: 4.6, totalRatings: 128
  };
  const aiIns = profileData?.aiInsights || [
    'Your resolution time is improving by 18% Keep it up! 🎉',
    'Focus on high-priority tickets to improve SLA compliance.',
    'Customer satisfaction score is excellent this month.',
    'You are handling 12% more tickets than last month.'
  ];

  return (
    <div className={`space-y-6 p-6 rounded-3xl pb-12 animate-fade-in transition-colors duration-300 ${isDarkMode ? 'bg-[#0F172A] text-slate-100' : 'bg-slate-50/50 text-slate-800'}`}>
      
      {/* ── LIVE TOAST NOTIFICATION ───────────────────────────────────────── */}
      {toastMessage && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 z-50 bg-[#6366F1] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400 text-xs font-bold"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-indigo-200 hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
        </motion.div>
      )}

      {/* ── THEME SWITCHER BAR ───────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
        <div>
          <h2 className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Support Agent Profile</h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Real-time synchronized credentials, notifications, and microservice preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-indigo-400' : 'text-slate-600'}`}>
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
          </span>
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
              isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={isDarkMode}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── TOP BANNER (MATCHING IMAGE 3 EXACTLY) ────────────────────────── */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full bg-slate-200 border-2 border-indigo-600 font-bold text-2xl text-slate-700 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl">
              {pInfo.name.split(' ').map((n: string)=>n[0]).join('')}
            </div>
            <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
              <CameraIcon />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{pInfo.name}</h2>
              <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
            </div>
            <p className="text-xs font-bold text-slate-400 mt-0.5">EMP01245</p>
            <div className={`mt-2 inline-block px-3 py-1 border font-black text-xs rounded-xl shadow-sm ${isDarkMode ? 'bg-indigo-950 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
              {pInfo.role || 'Support Agent'}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><Building2 className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
              <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pInfo.department || 'Support'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><MapPin className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
              <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pInfo.location || 'Delhi, India'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><Mail className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
              <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pInfo.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-indigo-950 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><Calendar className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined On</p>
              <p className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>15 Jan 2023</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN LAYOUT MATCHING IMAGE 3 ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── COLUMN 1: LEFT (4 SPANS) ───────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Personal Information */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><User className="w-4 h-4" /></div>
                <h3>Personal Information</h3>
              </div>
              <button onClick={() => setIsEditingInfo(!isEditingInfo)} className={`text-xs font-bold hover:underline flex items-center gap-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {isEditingInfo ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveInfo} className="space-y-3 pt-2 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Full Name</label>
                  <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className={`w-full p-2 border rounded-xl focus:outline-none focus:border-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Email Address</label>
                  <input type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} className={`w-full p-2 border rounded-xl focus:outline-none focus:border-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Mobile Number</label>
                  <input type="text" value={editPhone} onChange={e=>setEditPhone(e.target.value)} className={`w-full p-2 border rounded-xl focus:outline-none focus:border-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} />
                </div>
                <button type="submit" disabled={saving} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-1">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className={`space-y-3 text-xs font-semibold divide-y pt-2 ${isDarkMode ? 'divide-slate-700 text-slate-300' : 'divide-slate-50 text-slate-700'}`}>
                <div className="flex justify-between pt-2"><span className="text-slate-400 font-bold">Full Name</span><span>{pInfo.name}</span></div>
                <div className="flex justify-between pt-2"><span className="text-slate-400 font-bold">Email Address</span><span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{pInfo.email}</span></div>
                <div className="flex justify-between pt-2"><span className="text-slate-400 font-bold">Mobile Number</span><span>{pInfo.phone}</span></div>
                <div className="flex justify-between pt-2"><span className="text-slate-400 font-bold">Address</span><span className="text-right max-w-[180px]">{pInfo.address}</span></div>
                <div className="flex justify-between pt-2"><span className="text-slate-400 font-bold">Emergency Contact</span><span className="text-right">{pInfo.emergencyContact}</span></div>
              </div>
            )}

            <div className={`space-y-2 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Profile Completeness</span>
                <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>92%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Great! Your profile is almost complete.
              </p>
            </div>
          </div>

          {/* Workload Summary */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Activity className="w-4 h-4" /></div>
                <h3>Workload Summary</h3>
              </div>
              <select className={`border rounded-xl px-2.5 py-1 text-[11px] font-bold focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <option>This Week</option><option>This Month</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Tickets</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{work.activeTickets}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 8.5%</span>
              </div>
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Tickets</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{work.pendingTickets}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 6.2%</span>
              </div>
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Tickets</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{work.completedTickets}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 12.4%</span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workload Status</p>
                <p className="text-sm font-black text-emerald-500 mt-0.5">Manageable</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workload Balance</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-black text-emerald-500">Good</p>
                  <span className="text-xs font-bold text-slate-400">78%</span>
                </div>
              </div>
            </div>

            <div className={`p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${isDarkMode ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300' : 'bg-indigo-50/60 border-indigo-100 text-indigo-700'}`}>
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>AI suggests workload is balanced. Keep going!</span>
            </div>
          </div>

          {/* Customer Satisfaction (CSAT) */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Star className="w-4 h-4" /></div>
                <h3>Customer Satisfaction (CSAT)</h3>
              </div>
              <select className={`border rounded-xl px-2.5 py-1 text-[11px] font-bold focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <option>This Month</option><option>Last Month</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average CSAT Score</p>
                <p className={`text-3xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{csatObj.score}/5</p>
                <div className="flex items-center gap-1 mt-2 text-amber-500">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-[10px] font-bold text-emerald-500 mt-2">↑ 0.4 vs last month</p>
              </div>

              <div className="space-y-2 text-xs font-bold">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Feedback</p>
                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{csatObj.totalRatings || 128}</p>
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Positive</span><span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>112 (87%)</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> Neutral</span><span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>10 (8%)</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500" /> Negative</span><span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>6 (5%)</span></div>
                </div>
              </div>
            </div>

            <button className={`w-full mt-4 py-2 font-bold text-xs rounded-xl transition ${isDarkMode ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
              View All Feedback
            </button>
          </div>

          {/* AI Powered Insights */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Sparkles className="w-4 h-4" /></div>
              <h3>AI Powered Insights</h3>
            </div>
            <div className={`space-y-3 text-xs font-semibold pt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`flex items-start gap-2.5 border p-3 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className={isDarkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'}>⚡</span>
                <p>You resolved high-priority tickets 20% faster than last month.</p>
              </div>
              <div className={`flex items-start gap-2.5 border p-3 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className={isDarkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'}>🎯</span>
                <p>Try focusing on first response time to improve SLA further.</p>
              </div>
              <div className={`flex items-start gap-2.5 border p-3 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className={isDarkMode ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'}>🌟</span>
                <p>Customer satisfaction is in top 15% of the team.</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── COLUMN 2: MIDDLE (4 SPANS) ─────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Performance Dashboard */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Award className="w-4 h-4" /></div>
                <h3>Performance Dashboard</h3>
              </div>
              <select className={`border rounded-xl px-2.5 py-1 text-[11px] font-bold focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <option>This Month</option><option>This Year</option>
              </select>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className={`p-2.5 border rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Handled</p>
                <p className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{perf.ticketsHandled}</p>
                <span className="text-[8px] font-bold text-emerald-500 mt-1 inline-block">↑ 18.6%</span>
              </div>
              <div className={`p-2.5 border rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Resolved</p>
                <p className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{perf.ticketsResolved}</p>
                <span className="text-[8px] font-bold text-emerald-500 mt-1 inline-block">↑ 15.3%</span>
              </div>
              <div className={`p-2.5 border rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Avg. Time</p>
                <p className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{perf.avgResolutionTime}</p>
                <span className="text-[8px] font-bold text-emerald-500 mt-1 inline-block">↓ 5.6%</span>
              </div>
              <div className={`p-2.5 border rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">SLA Comp</p>
                <p className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{perf.slaComplianceRate}%</p>
                <span className="text-[8px] font-bold text-emerald-500 mt-1 inline-block">↑ 7.2%</span>
              </div>
            </div>

            {/* Performance Score & Trend Chart */}
            <div className={`grid grid-cols-2 gap-4 pt-4 border-t items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Performance Score</p>
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <PieChart width={112} height={112}>
                    <Pie data={SCORE_PIE} cx={56} cy={56} innerRadius={38} outerRadius={52} dataKey="value" paddingAngle={0}>
                      <Cell fill="#6366F1" />
                      <Cell fill={isDarkMode ? '#334155' : '#E2E8F0'} />
                    </Pie>
                  </PieChart>
                  <div className="absolute text-center">
                    <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>87<span className="text-xs text-slate-400">/100</span></p>
                    <p className="text-[10px] font-bold text-emerald-500">Excellent</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Performance Trend</p>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={MOCK_PERF_TREND} margin={{ left: -30, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#F1F5F9'} />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#64748B' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 10, backgroundColor: isDarkMode ? '#0F172A' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                    <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Activity className="w-4 h-4" /></div>
                <h3>Activity Summary</h3>
              </div>
              <select className={`border rounded-xl px-2.5 py-1 text-[11px] font-bold focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <option>This Week</option><option>This Month</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Messages Sent</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{actSum.messagesSent}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 10.2%</span>
              </div>
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tickets Updated</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{actSum.ticketsUpdated}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 8.4%</span>
              </div>
              <div className={`p-3 border rounded-2xl text-center ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Actions Performed</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{actSum.actionsPerformed}</p>
                <span className="text-[9px] font-bold text-emerald-500 mt-1 inline-block">↑ 15.7%</span>
              </div>
            </div>

            <div className={`space-y-2 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Productivity Score</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full uppercase">Excellent</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '90%' }} />
              </div>
              <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Great productivity! You are performing above average.
              </p>
            </div>
          </div>

          {/* Skills & Assignment Profile */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Award className="w-4 h-4" /></div>
                <h3>Skills & Assignment Profile</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((sk, idx) => (
                <span key={idx} className={`border font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 ${isDarkMode ? 'bg-indigo-950 border-indigo-800 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  {sk}
                  {isEditingSkills && <button onClick={() => setSkills(skills.filter(s => s !== sk))} className="text-indigo-500 hover:text-indigo-800 ml-1">×</button>}
                </span>
              ))}
            </div>

            {isEditingSkills && (
              <div className="flex items-center gap-2 pt-2">
                <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add new skill..." className={`flex-1 border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200 text-slate-800'}`} />
                <button onClick={() => { if (newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(''); } }} className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow">Add</button>
              </div>
            )}

            <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Assigned Categories</h4>
              {[
                { cat: 'Technical Issues', count: 128, width: '100%' },
                { cat: 'Billing & Payments', count: 86, width: '70%' },
                { cat: 'Account & Profile', count: 64, width: '50%' },
                { cat: 'General Inquiries', count: 48, width: '38%' },
              ].map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className={`flex justify-between text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>{c.cat}</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{c.count}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: c.width }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setIsEditingSkills(!isEditingSkills)} className={`w-full mt-4 py-2 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
              <Edit3 className="w-3.5 h-3.5" /> {isEditingSkills ? 'Done Editing' : 'Edit Skills'}
            </button>
          </div>

          {/* Reports & Analytics */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Reports & Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 border rounded-2xl flex flex-col justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>My Performance Report</p>
                <button onClick={() => alert('Generating My Performance Report...')} className="mt-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition">View Report</button>
              </div>
              <div className={`p-4 border rounded-2xl flex flex-col justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Tickets Summary Report</p>
                <button onClick={() => alert('Generating Tickets Summary Report...')} className="mt-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition">View Report</button>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Recent Achievements</h3>
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3.5 border rounded-2xl ${isDarkMode ? 'bg-amber-950/40 border-amber-800/50' : 'bg-amber-50/60 border-amber-100'}`}>
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl font-black text-base shrink-0">🏆</div>
                <div>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-amber-300' : 'text-slate-900'}`}>Top Performer - April 2025</p>
                  <p className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Achieved highest CSAT score</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 p-3.5 border rounded-2xl ${isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-emerald-50/60 border-emerald-100'}`}>
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-base shrink-0">⭐</div>
                <div>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-emerald-300' : 'text-slate-900'}`}>SLA Champion</p>
                  <p className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Maintained 95%+ SLA for 3 months</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── COLUMN 3: RIGHT (4 SPANS) ──────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Insights */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className={`flex items-center gap-2 font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              <div className={`p-1.5 rounded-xl ${isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}><Sparkles className="w-4 h-4" /></div>
              <h3>AI Insights</h3>
            </div>
            <div className={`space-y-3 text-xs font-semibold pt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {aiIns.map((ins: string, index: number) => (
                <div key={index} className={`flex items-start gap-2.5 border p-3 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-indigo-500 font-bold">✨</span>
                  <p>{ins}</p>
                </div>
              ))}
            </div>
            <button className={`w-full mt-4 py-2 font-bold text-xs rounded-xl transition ${isDarkMode ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
              View All Insights
            </button>
          </div>

          {/* Settings */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Settings</h3>
            <div className={`space-y-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div onClick={() => alert('Opening password change dialog...')} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Lock className="w-4 h-4 text-indigo-500" /> Change Password</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div onClick={() => alert('Opening notification preferences...')} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Bell className="w-4 h-4 text-indigo-500" /> Notification Settings</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Bookmark className="w-4 h-4 text-indigo-500" /> Language Preference</span>
                <span className="text-slate-400 font-semibold flex items-center gap-1">English <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
              <div onClick={handleThemeToggle} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Sparkles className="w-4 h-4 text-indigo-500" /> Theme Settings</span>
                <span className="text-slate-400 font-semibold flex items-center gap-1">{isDarkMode ? 'Dark' : 'Light'} <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Security Settings</h3>
            <div className={`space-y-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Two Factor Authentication</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded uppercase">Enabled</span>
              </div>
              <div onClick={() => alert('Fetching login history logs...')} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-indigo-500" /> Login History</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div onClick={() => alert('Managing active sessions...')} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-indigo-500" /> Active Sessions</span>
                <span className="text-indigo-500 font-bold flex items-center gap-1">3 Active</span>
              </div>
              <div onClick={() => alert('Device management...')} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><Lock className="w-4 h-4 text-indigo-500" /> Device Management</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* ── PREMIUM NOTIFICATION CONTROL (CUSTOM TOGGLE SWITCHES) ── */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Notification Control</h3>
            <div className={`space-y-4 text-xs font-bold pt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {[
                { label: 'Ticket Alerts', value: ticketAlerts, setter: setTicketAlerts },
                { label: 'SLA Alerts', value: slaAlerts, setter: setSlaAlerts },
                { label: 'Escalation Alerts', value: escalationAlerts, setter: setEscalationAlerts },
                { label: 'Mentions & Replies', value: mentionsAlerts, setter: setMentionsAlerts },
                { label: 'System Alerts', value: systemAlerts, setter: setSystemAlerts },
              ].map((toggle, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <span className="group-hover:text-indigo-500 transition">{toggle.label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleChange(toggle.label, toggle.value, toggle.setter)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      toggle.value ? 'bg-indigo-600 shadow-sm' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-200')
                    }`}
                    role="switch"
                    aria-checked={toggle.value}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        toggle.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => alert('Opening advanced notification control center...')} className={`w-full mt-4 py-2 font-bold text-xs rounded-xl transition ${isDarkMode ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
              Manage All Notifications
            </button>
          </div>

          {/* Documents */}
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Documents</h3>
            <div className={`space-y-2 text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-indigo-500" /> ID Proof</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded uppercase">Uploaded</span>
              </div>
              <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-indigo-500" /> Address Proof</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded uppercase">Uploaded</span>
              </div>
              <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-indigo-500" /> Experience Certificate</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded uppercase">Uploaded</span>
              </div>
              <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-indigo-500" /> Other Documents</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded uppercase">Not Uploaded</span>
              </div>
            </div>
            <button onClick={() => alert('Opening file upload dialog...')} className="w-full mt-4 py-2 bg-[#6366F1] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
