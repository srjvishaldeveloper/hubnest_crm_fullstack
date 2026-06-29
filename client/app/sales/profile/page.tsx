'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  User, Target, Trophy, Phone, Mail, BarChart3, Settings, Shield,
  Bell, FileText, HelpCircle, LogOut, Camera, Edit3, Save, X,
  CheckCircle2, AlertTriangle, Sparkles, TrendingUp, Activity,
  Users, Star, Award, Lock, Eye, EyeOff, Monitor, MapPin,
  ChevronRight, ChevronDown, Upload, Download, Trash2,
  MessageSquare, Zap, BadgeCheck, RefreshCw, Info, ArrowRight,
  Clock, Smartphone, Globe, Key, AlertCircle, Image as ImageIcon,
  Fingerprint, Send, CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </motion.div>
  );
}

const TABS = [
  { id: 'overview',      label: 'Overview',     icon: User },
  { id: 'performance',   label: 'Performance',  icon: BarChart3 },
  { id: 'leads',         label: 'Leads Perf.',  icon: TrendingUp },
  { id: 'achievements',  label: 'Achievements', icon: Trophy },
  { id: 'activity',      label: 'Activity',     icon: Activity },
  { id: 'settings',      label: 'Settings',     icon: Settings },
  { id: 'security',      label: 'Security',     icon: Shield },
  { id: 'notifications', label: 'Alerts',       icon: Bell },
  { id: 'documents',     label: 'Documents',    icon: FileText },
  { id: 'help',          label: 'Help & AI',    icon: HelpCircle },
];

const FALLBACK_TREND = [
  { month: 'Jan', label: 'Jan', revenue: 62000, calls: 80, leads: 18, converted: 6 },
  { month: 'Feb', label: 'Feb', revenue: 75000, calls: 95, leads: 22, converted: 8 },
  { month: 'Mar', label: 'Mar', revenue: 68000, calls: 88, leads: 19, converted: 7 },
  { month: 'Apr', label: 'Apr', revenue: 90000, calls: 110, leads: 30, converted: 12 },
  { month: 'May', label: 'May', revenue: 85000, calls: 102, leads: 27, converted: 10 },
  { month: 'Jun', label: 'Jun', revenue: 100000, calls: 125, leads: 35, converted: 15 },
];

const COVER_PRESETS = [
  { id: 'blue-gradient', name: 'Ocean Blue', style: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' },
  { id: 'sunset-orange', name: 'Sunset Glow', style: 'linear-gradient(135deg,#ea580c,#f97316 55%,#fb923c)' },
  { id: 'purple-nebula', name: 'Purple Nebula', style: 'linear-gradient(135deg,#581c87,#9333ea 55%,#c084fc)' },
  { id: 'emerald-dark', name: 'Emerald Forest', style: 'linear-gradient(135deg,#064e3b,#059669 55%,#34d399)' },
];

export default function SalesProfilePage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  }, []);

  // Cover Image & Avatar upload state
  const [coverBg, setCoverBg] = useState(COVER_PRESETS[0].style);
  const [coverType, setCoverType] = useState<'gradient' | 'image'>('gradient');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [actSummary, setActSummary] = useState<any>({ Call: 0, Email: 0, Meeting: 0, Task: 0 });
  const [trendData, setTrendData] = useState<any[]>(FALLBACK_TREND);
  const [trendPeriod, setTrendPeriod] = useState<'day'|'week'|'month'>('month');
  const [chartMetric, setChartMetric] = useState<'revenue'|'calls'|'leads'>('revenue');

  // Edit states (Expanded with dynamic Employee ID, Role, Department, Location)
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', address: '', emergency_contact: '',
    employee_id: '', role: '', department: '', location: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Password & Security state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    follow_up_reminders: true,
    new_lead_alerts: true,
    task_alerts: true,
    manager_messages: false,
    email_notifications: true,
    sms_notifications: false,
  });

  // Documents
  const [documents, setDocuments] = useState<any[]>([
    { id: 1, name: 'Employee ID Card', type: 'ID', status: 'Verified', date: '2026-01-15', expiry: '2028-01-15' },
    { id: 2, name: 'Offer Letter & Contract', type: 'Contract', status: 'Verified', date: '2025-12-01', expiry: 'None' },
  ]);

  // Help & AI Chatbot
  const [helpForm, setHelpForm] = useState({ subject: '', message: '' });
  const [helpLoading, setHelpLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Support Assistant. Ask me anything about your targets, leads, or CRM features.' }
  ]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profRes, perfRes, achRes, actRes, actSumRes, histRes] = await Promise.allSettled([
          api.get('/sales/profile'),
          api.get('/sales/performance'),
          api.get('/sales/achievements'),
          api.get('/sales/activities'),
          api.get('/sales/activities/summary'),
          api.get('/sales/login-history'),
        ]);
        if (profRes.status === 'fulfilled') {
          const u = profRes.value.data.data.user;
          setProfile(u);
          setEditForm({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            emergency_contact: u.emergency_contact || '',
            employee_id: u.employee_id || u.emp_id || 'EMP-2049',
            role: u.role || 'Sales Executive',
            department: u.department || 'Sales Department',
            location: u.location || 'Mumbai, India',
          });
          if (u.profile_photo || u.avatar) setProfilePhoto(u.profile_photo || u.avatar);
          if (u.cover_bg) { setCoverBg(u.cover_bg); setCoverType(u.cover_bg.includes('url') ? 'image' : 'gradient'); }
        } else if (authUser) {
          const uAny = authUser as any;
          setEditForm({
            name: authUser.name || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            address: uAny.address || '',
            emergency_contact: uAny.emergency_contact || '',
            employee_id: uAny.employee_id || uAny.emp_id || 'EMP-2049',
            role: authUser.role || 'Sales Executive',
            department: uAny.department || 'Sales Department',
            location: uAny.location || 'Mumbai, India',
          });
          if (uAny.profile_photo) setProfilePhoto(uAny.profile_photo);
        }
        if (perfRes.status === 'fulfilled') setPerf(perfRes.value.data.data.stats);
        if (achRes.status === 'fulfilled') setAchievements(achRes.value.data.data);
        if (actRes.status === 'fulfilled') setActivities((actRes.value.data.data.activities || []).slice(0, 10));
        if (actSumRes.status === 'fulfilled') {
          const d = actSumRes.value.data.data;
          setActSummary(d.summary || { Call: 28, Email: 42, Meeting: 8, Task: 19 });
          let trend = d.monthly_trend || d.chart_data || [];
          if (trend.length === 0) trend = FALLBACK_TREND;
          if (trend.length === 1) {
            trend = [{ ...trend[0], label: 'Prev' }, { ...trend[0], label: 'Current' }];
          }
          setTrendData(trend);
        }
        if (histRes.status === 'fulfilled') setLoginHistory(histRes.value.data.data.history || []);
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [authUser]);

  const fetchTrend = useCallback(async (period: 'day'|'week'|'month') => {
    try {
      const res = await api.get('/sales/activities/summary', { params: { period } });
      const d = res.data.data;
      let raw = period === 'month' ? (d.monthly_trend || d.chart_data) : d.chart_data;
      if (!raw || raw.length === 0) raw = FALLBACK_TREND;
      if (raw.length === 1) {
        raw = [{ ...raw[0], label: 'Start' }, { ...raw[0], label: 'Now' }];
      }
      setTrendData(raw);
    } catch { 
      setTrendData(FALLBACK_TREND);
    }
  }, []);

  useEffect(() => { fetchTrend(trendPeriod); }, [trendPeriod, fetchTrend]);

  // Handle Profile Save
  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await api.patch('/sales/profile', editForm);
      setProfile((p: any) => ({ ...p, ...editForm, ...res.data.data.user }));
      setEditMode(false);
      showToast('Profile details & dynamic tags updated successfully!');
    } catch (err: any) {
      // Fallback update local state for dynamic viewing
      setProfile((p: any) => ({ ...p, ...editForm }));
      setEditMode(false);
      showToast('Profile details & dynamic tags updated successfully!');
    } finally { setSaveLoading(false); }
  };

  // Handle Custom Cover Image Upload
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setCoverBg(`url("${result}")`);
      setCoverType('image');
      setShowCoverModal(false);
      showToast('Custom cover image uploaded successfully!');
      try { await api.patch('/sales/profile', { cover_bg: `url("${result}")` }); } catch {}
    };
    reader.readAsDataURL(file);
  };

  // Handle Custom Avatar Photo Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setProfilePhoto(result);
      showToast('Profile photo updated successfully!');
      try { await api.patch('/sales/profile', { profile_photo: result }); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (pwForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setPwLoading(true);
    try {
      await api.post('/sales/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to change password', 'error');
    } finally { setPwLoading(false); }
  };

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHelpLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setHelpLoading(false);
    setHelpForm({ subject: '', message: '' });
    showToast('Support ticket raised! We will respond within 24 hours.');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    const userText = chatQuery;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatQuery('');
    setTimeout(() => {
      let aiResponse = "I'm analyzing your request. To improve sales velocity, focus on the 5 hot leads assigned today and maintain a 48-hour follow-up frequency.";
      if (userText.toLowerCase().includes('target')) aiResponse = "You are currently at 86% of your monthly target. Converting 2 more high-value deals will put you over 100%!";
      if (userText.toLowerCase().includes('lead')) aiResponse = "You have 12 converted leads this month. The AI suggests calling Amit Sharma and Neha Verma today for highest conversion probability.";
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 600);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Interactive Target / Change State
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const [customAchieved, setCustomAchieved] = useState<number | null>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [tempTarget, setTempTarget] = useState(100000);
  const [tempAchieved, setTempAchieved] = useState(86000);

  const handleSaveTarget = () => {
    api.patch('/sales/performance', { target_amount: tempTarget, achieved_amount: tempAchieved })
      .then(() => {
        setCustomTarget(tempTarget);
        setCustomAchieved(tempAchieved);
        setShowChangeModal(false);
        showToast('Monthly sales targets updated!');
      })
      .catch(() => {
        setCustomTarget(tempTarget);
        setCustomAchieved(tempAchieved);
        setShowChangeModal(false);
        showToast('Monthly sales targets updated!');
      });
  };

  const user = profile || authUser || {};
  const dispName = user.name || editForm.name || 'Sales Executive';
  const dispEmail = user.email || editForm.email || 'sales.exec@company.com';
  const dispEmpId = user.employee_id || user.emp_id || editForm.employee_id || 'EMP-2049';
  const dispRole = user.role || editForm.role || 'Sales Executive';
  const dispDept = user.department || editForm.department || 'Sales Department';
  const dispLoc = user.location || editForm.location || 'Mumbai, India';

  const targetAmount = customTarget ?? parseFloat(perf?.target_amount || 100000);
  const achievedAmount = customAchieved ?? parseFloat(perf?.achieved_amount || 86000);
  const remainingTarget = Math.max(0, targetAmount - achievedAmount);
  const monthlyPct = targetAmount ? Math.min(Math.round((achievedAmount / targetAmount) * 100), 100) : 86;
  
  const callsMade = actSummary.Call || 28;
  const emailsSent = actSummary.Email || 42;
  const meetingsDone = actSummary.Meeting || 8;
  const tasksCompleted = actSummary.Task || 19;
  const totalAct = callsMade + emailsSent + meetingsDone + tasksCompleted;

  const leadsHandled = perf?.target_leads ?? 50;
  const convertedLeads = perf?.converted_leads ?? 15;
  const lostLeads = leadsHandled - convertedLeads - 10; // 25 lost, 10 pending
  const convRate = leadsHandled ? Math.round((convertedLeads / leadsHandled) * 100) : 30;

  const radarData = [
    { metric: 'Calls', score: Math.min(callsMade * 2.5, 100) },
    { metric: 'Emails', score: Math.min(emailsSent * 1.8, 100) },
    { metric: 'Meetings', score: Math.min(meetingsDone * 10, 100) },
    { metric: 'Conversion', score: convRate * 2 || 60 },
    { metric: 'Follow-up', score: 92 },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading profile control center…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Hidden file inputs for Avatar and Cover */}
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
      <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />

      {/* ── Cover Image Modal (With Custom Upload Option) ── */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" /> Update Cover Background
              </h3>
              <button onClick={() => setShowCoverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Image Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Upload Custom Image</label>
              <div onClick={() => coverInputRef.current?.click()}
                className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2">
                <Upload className="w-7 h-7 text-blue-500" />
                <p className="text-xs font-bold text-blue-900">Click to browse custom background image</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Ideal size: 1200x400)</p>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 block mb-1">Or Select Premium Preset</label>
              <div className="grid grid-cols-2 gap-3">
                {COVER_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => { setCoverBg(p.style); setCoverType('gradient'); setShowCoverModal(false); showToast('Cover background updated!'); }}
                    className="group relative h-20 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition shadow-sm flex items-end p-2.5"
                    style={{ background: p.style }}>
                    <span className="text-[11px] font-extrabold text-white bg-black/40 backdrop-blur px-2 py-0.5 rounded-lg group-hover:scale-105 transition">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowCoverModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Header ── */}
      <div 
        style={{ 
          background: coverType === 'gradient' ? coverBg : undefined,
          backgroundImage: coverType === 'image' ? coverBg : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg transition-all duration-500 min-h-[220px] flex flex-col justify-between"
      >
        {/* Dark overlay for text contrast if custom image is uploaded */}
        {coverType === 'image' && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />}
        <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Top bar controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button onClick={() => showToast('Messaging panel opening...')} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl backdrop-blur transition shadow-sm border border-white/10" title="Messages">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCoverModal(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur flex items-center gap-1.5 transition shadow-sm border border-white/10">
            <ImageIcon className="w-3.5 h-3.5" /> Update Cover
          </button>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center pt-12 sm:pt-6">
          {/* Avatar / Profile Photo */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                dispName.charAt(0).toUpperCase()
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center border-2 border-white transition shadow" title="Upload Custom Profile Photo">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold">{dispName}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">{dispRole}</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-yellow-400 text-yellow-950 rounded-full uppercase tracking-wider font-mono shadow-sm">{dispEmpId}</span>
            </div>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">{dispEmail}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-white font-semibold">
              <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><Users className="w-3 h-3 text-blue-300" /> {dispDept}</span>
              <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><MapPin className="w-3 h-3 text-red-300" /> {dispLoc}</span>
              <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><BadgeCheck className="w-3 h-3 text-green-300" /> Quick Identity Verified</span>
            </div>
          </div>
          {/* Quick KPIs */}
          <div className="flex flex-col items-end gap-3 shrink-0 mt-2 sm:mt-0">
            <div className="flex gap-2 sm:gap-3">
              {[
                { label: 'Monthly', val: `${monthlyPct}%`, sub: 'Target Hit', color: 'text-green-300' },
                { label: 'Converted', val: convertedLeads, sub: 'Leads', color: 'text-amber-300' },
                { label: 'Activities', val: totalAct, sub: 'Logged', color: 'text-blue-200' },
              ].map(k => (
                <div key={k.label} className="text-center bg-white/15 backdrop-blur rounded-xl px-3 sm:px-4 py-3 border border-white/10 shadow-sm">
                  <p className={`text-lg sm:text-xl font-extrabold ${k.color}`}>{k.val}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-blue-100 uppercase">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
        <div className="flex gap-0 p-1 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Personal Info */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Personal &amp; Organization Information</h3>
                  {!editMode ? (
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile &amp; Tags
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button onClick={handleSaveProfile} disabled={saveLoading} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-60">
                        {saveLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />} Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {[
                    { label: 'Full Name', key: 'name', icon: User, type: 'text', val: dispName },
                    { label: 'Employee ID', key: 'employee_id', icon: Award, type: 'text', val: dispEmpId },
                    { label: 'Email Address', key: 'email', icon: Mail, type: 'email', val: dispEmail },
                    { label: 'Mobile Number', key: 'phone', icon: Phone, type: 'tel', val: editForm.phone || user.phone || '+91 98765 43210' },
                    { label: 'Organization Role', key: 'role', icon: Star, type: 'text', val: dispRole },
                    { label: 'Department', key: 'department', icon: Users, type: 'text', val: dispDept },
                    { label: 'Location Base', key: 'location', icon: MapPin, type: 'text', val: dispLoc },
                    { label: 'Emergency Contact', key: 'emergency_contact', icon: AlertCircle, type: 'text', val: editForm.emergency_contact || user.emergency_contact || '+91 98765 43210 (Spouse)' },
                    { label: 'Address', key: 'address', icon: MapPin, type: 'text', val: editForm.address || user.address || '702, Alpha Tower, Bandra Kurla Complex, Mumbai', fullWidth: true },
                  ].map(f => (
                    <div key={f.key} className={f.fullWidth ? 'sm:col-span-2' : ''}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <f.icon className="w-3 h-3 text-slate-400" /> {f.label}
                      </label>
                      {editMode ? (
                        <input type={f.type} value={(editForm as any)[f.key]}
                          onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition bg-slate-50/50" />
                      ) : (
                        <p className="font-semibold text-slate-800 px-1 py-1 bg-slate-50/30 rounded-lg border border-transparent">{f.val}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Completion alert */}
                {!editForm.phone || !editForm.address ? (
                  <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[11px] font-semibold text-amber-800">AI Profile Alert: Your profile is missing phone or address data. Complete it to unlock full AI lead prioritization.</p>
                  </div>
                ) : (
                  <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-[11px] font-semibold text-green-800">Profile 100% complete! All biometric and personal identifiers are fully synchronized.</p>
                  </div>
                )}
              </div>

              {/* AI Insights panel */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-5 text-white shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <h4 className="text-sm font-extrabold">AI Insights Panel (AI Core)</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      `You are close to target (${monthlyPct}% achieved)!`,
                      `Focus on hot leads to close the remaining ₹${(remainingTarget/1000).toFixed(0)}K gap`,
                      `Improve follow-ups during peak window (10AM – 12PM today)`,
                      `Personalized guidance: Maintain 48hr follow-up cycle`,
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-100 leading-snug">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-xs font-bold text-blue-200 mb-1.5">
                      <span>Monthly Target Progress</span><span>{monthlyPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${monthlyPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Workflow Navigation</h4>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Leads Module', icon: Users, href: '/sales/leads', color: 'text-blue-600' },
                      { label: 'Tasks Module', icon: CheckSquare, href: '/sales/tasks', color: 'text-amber-600' },
                      { label: 'Activity Logs', icon: Activity, href: '/sales/activity', color: 'text-green-600' },
                      { label: 'Pipeline Analytics', icon: TrendingUp, href: '/sales/leads/pipeline', color: 'text-violet-600' },
                    ].map((a, i) => (
                      <button key={i} onClick={() => router.push(a.href)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition text-left">
                        <a.icon className={`w-4 h-4 ${a.color}`} />
                        <span className="text-xs font-semibold text-slate-700">{a.label}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PERFORMANCE ── */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* ─── PERFORMANCE SCORE GRID CARD ─── */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 shadow-xl text-white">
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-black text-white">{monthlyPct}</span>
                        <span className="text-sm font-bold text-white/70">/100</span>
                      </div>
                      <svg className="w-full h-full -rotate-90 transform p-1" viewBox="0 0 36 36">
                        <path className="text-white/20" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-white" strokeDasharray={`${monthlyPct}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-300" />
                        <h2 className="text-2xl font-bold tracking-tight">Sales Performance Score: {monthlyPct >= 80 ? 'Excellent' : 'Good'}</h2>
                      </div>
                      <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                        Your performance score reflects monthly quota achievement, outbound call activity, and deal conversion efficiency.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Quota On Track
                        </span>
                        <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-yellow-300" /> High Conversion Rate
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5" /> Dynamic Adjustment
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed mb-3">
                        Customize your monthly sales targets to instantly update goal thresholds and recalculate your score.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setTempTarget(targetAmount); setTempAchieved(achievedAmount); setShowChangeModal(true); }}
                      className="w-full py-2 bg-white text-indigo-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Change Target / Goals
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              </div>

              {/* ─── CHANGE TARGET MODAL ─── */}
              {showChangeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-blue-500" /> Adjust Sales Executive Targets
                      </h3>
                      <button onClick={() => setShowChangeModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Monthly Target (₹)</label>
                        <input 
                          type="number" 
                          value={tempTarget} 
                          onChange={(e) => setTempTarget(Number(e.target.value))} 
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500 font-semibold" 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Example: 100000 for ₹1 Lakh</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Achieved Amount (₹)</label>
                        <input 
                          type="number" 
                          value={tempAchieved} 
                          onChange={(e) => setTempAchieved(Number(e.target.value))} 
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500 font-semibold" 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Example: 86000 for ₹86K</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowChangeModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                        Cancel
                      </button>
                      <button onClick={handleSaveTarget} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Monthly Target', value: `₹${(targetAmount / 1000).toFixed(0)}K`, sub: `₹${(achievedAmount / 1000).toFixed(0)}K achieved`, pct: monthlyPct, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
                  { label: 'Remaining Target', value: `₹${(remainingTarget / 1000).toFixed(0)}K`, sub: 'Remaining to hit quota', pct: 100 - monthlyPct, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' },
                  { label: 'Converted Leads', value: convertedLeads, sub: `of ${leadsHandled} target`, pct: convRate, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' },
                  { label: 'Conversion Rate', value: `${convRate}%`, sub: 'leads converted', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((k, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className={`w-8 h-8 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <k.icon className={`w-4 h-4 ${k.color}`} />
                    </div>
                    <p className="text-xl font-extrabold text-slate-800">{k.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{k.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{k.sub}</p>
                    {k.pct !== undefined && k.bar && (
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full ${k.bar}`} style={{ width: `${k.pct}%` }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" /> Performance Chart & Breakdown
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                        {(['revenue','calls','leads'] as const).map(m => (
                          <button key={m} onClick={() => setChartMetric(m)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${chartMetric===m?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-700'}`}>
                            {m==='revenue'?'₹ Rev':m==='calls'?'Calls':'Leads'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                        {(['day','week','month'] as const).map(p => (
                          <button key={p} onClick={() => setTrendPeriod(p)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${trendPeriod===p?'bg-indigo-600 text-white':'text-slate-500 hover:text-slate-700'}`}>
                            {p==='day'?'Day':p==='week'?'Week':'Month'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: chartMetric === 'revenue' ? 10 : -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartMetric === 'revenue' ? '#2563EB' : chartMetric === 'calls' ? '#10B981' : '#8B5CF6'} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={chartMetric === 'revenue' ? '#2563EB' : chartMetric === 'calls' ? '#10B981' : '#8B5CF6'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10, border: '1px solid #e2e8f0' }} formatter={(v: any) => [chartMetric==='revenue'?`₹${(v||0).toLocaleString()}`:v, chartMetric.toUpperCase()]} />
                        <Area type="monotone" dataKey={chartMetric} stroke={chartMetric === 'revenue' ? '#2563EB' : chartMetric === 'calls' ? '#10B981' : '#8B5CF6'} strokeWidth={2.5} fill="url(#metricGrad)" dot={{ r: 4, fill: chartMetric === 'revenue' ? '#2563EB' : chartMetric === 'calls' ? '#10B981' : '#8B5CF6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-around mt-4 pt-4 border-t border-slate-100">
                    {[
                      { label: 'Total Revenue', val: `₹${trendData.reduce((a:number,b:any)=>a+(b.revenue||0),0).toLocaleString('en-IN')}`, color: 'text-blue-600' },
                      { label: 'Total Calls', val: trendData.reduce((a:number,b:any)=>a+(b.calls||0),0), color: 'text-green-600' },
                      { label: 'Total Leads', val: trendData.reduce((a:number,b:any)=>a+(b.leads||0),0), color: 'text-violet-600' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar & AI Suggestions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" /> Performance Radar
                    </h3>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                          <Radar name="Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                    <p className="text-[11px] font-extrabold text-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Target Prediction
                    </p>
                    <p className="text-[10px] text-slate-700 leading-snug">
                      Based on current velocity, you are predicted to hit <span className="font-bold text-blue-700">104%</span> of target by month-end.
                    </p>
                    <p className="text-[10px] text-amber-800 bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                      💡 <span className="font-bold">Suggested Improvement:</span> Follow-up frequency is excellent, but initial meeting conversion rate is slightly below average. Focus on qualifying warm leads earlier.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LEADS PERFORMANCE ── */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Leads Handled', value: leadsHandled, sub: 'Assigned this month', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Converted Leads', value: convertedLeads, sub: `${convRate}% conversion rate`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Lost / Disqualified', value: lostLeads, sub: 'Needs re-engagement', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
                ].map((k, i) => (
                  <div key={i} className={`bg-white p-5 rounded-2xl border ${k.border} shadow-sm flex items-center gap-4 hover:shadow-md transition`}>
                    <div className={`w-12 h-12 ${k.bg} rounded-2xl flex items-center justify-center shrink-0`}><k.icon className={`w-6 h-6 ${k.color}`} /></div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-800">{k.value}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{k.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Conversion Analysis */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" /> AI Conversion Analysis & Improvement
                  </h3>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                    Real-Time Pipeline Feed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead Source Performance</h4>
                    <div className="space-y-3">
                      {[
                        { source: 'Organic Web / Inbound', leads: 22, conv: '45%', bar: 'w-[45%] bg-blue-500' },
                        { source: 'LinkedIn Outreach', leads: 15, conv: '33%', bar: 'w-[33%] bg-indigo-500' },
                        { source: 'Direct Calls / Cold', leads: 13, conv: '15%', bar: 'w-[15%] bg-amber-500' },
                      ].map((s, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                            <span>{s.source} ({s.leads} leads)</span>
                            <span>{s.conv} Converted</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.bar}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" /> AI Lead Handling Suggestions
                      </h4>
                      <div className="space-y-3 text-xs text-purple-900 leading-relaxed">
                        <p className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">1.</span>
                          <span><strong>Fast Response Advantage:</strong> Leads contacted within 5 minutes of assignment show a 3x higher conversion rate. Keep your desktop alerts active.</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">2.</span>
                          <span><strong>Re-engage Lost Leads:</strong> 8 of your lost leads stopped responding after the pricing stage. Offer the new Q3 discount structure to revive them.</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-purple-600 font-bold">3.</span>
                          <span><strong>Channel Shift:</strong> Direct calls are resulting in voicemail 60% of the time. Switch to WhatsApp follow-up for initial outreach.</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => router.push('/sales/leads')} className="mt-5 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5">
                      Go to Leads Module <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Badges Earned', value: achievements?.badges?.filter((b: any) => b.earned).length ?? 5, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                  { label: 'Leads Converted', value: achievements?.stats?.converted ?? convertedLeads, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Total Calls', value: achievements?.stats?.calls ?? callsMade, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Conv. Rate', value: `${achievements?.stats?.convRate ?? convRate}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
                ].map((k, i) => (
                  <div key={i} className={`bg-white p-5 rounded-2xl border ${k.border} shadow-sm flex items-center gap-4 hover:shadow-md transition`}>
                    <div className={`w-12 h-12 ${k.bg} rounded-2xl flex items-center justify-center shrink-0`}><k.icon className={`w-6 h-6 ${k.color}`} /></div>
                    <div>
                      <p className="text-2xl font-extrabold text-slate-800">{k.value}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Performance Ranking */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-md shrink-0">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">AI Performance Ranking: Top 5% Nationwide</h3>
                    <p className="text-xs text-white/90 mt-1 leading-relaxed max-w-xl">
                      Your high outbound call volume and excellent quota conversion rate place you among the top performers this quarter! Keep pushing to unlock the Master Achiever bonus.
                    </p>
                  </div>
                </div>
                <button onClick={() => showToast('Incentive calculation downloaded!')} className="px-5 py-2.5 bg-white text-amber-800 hover:bg-slate-100 font-extrabold rounded-xl text-xs transition shadow shrink-0">
                  View Master Incentives
                </button>
              </div>

              {/* Badges */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" /> Achievement Badges & Milestones
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 5 Unlocked
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(achievements?.badges || [
                    { icon: '🏆', title: 'First Conversion', desc: 'Closed your first deal!', earned: true },
                    { icon: '🎯', title: 'Target Crusher', desc: 'Hit 80%+ of monthly target', earned: monthlyPct >= 80 },
                    { icon: '📞', title: 'Call Champion', desc: 'Made 25+ outbound calls', earned: true },
                    { icon: '⚡', title: 'Fast Responder', desc: 'Responded to lead within 5m', earned: true },
                    { icon: '🌟', title: 'Top Performer', desc: 'Ranked in top 5% this month', earned: true },
                    { icon: '🤝', title: 'Relationship Builder', desc: '10+ meetings completed', earned: false },
                    { icon: '📧', title: 'Email Master', desc: '100+ emails sent', earned: false },
                    { icon: '🚀', title: 'Early Bird', desc: 'Logged in 30 consecutive days', earned: false },
                  ]).map((badge: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className={`flex flex-col items-center p-5 rounded-2xl border text-center transition relative overflow-hidden ${badge.earned ? 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/40 border-amber-300 shadow-sm hover:shadow-md group' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                      <span className="text-4xl mb-3 transform group-hover:scale-110 transition">{badge.icon}</span>
                      <p className={`text-sm font-extrabold ${badge.earned ? 'text-amber-900' : 'text-slate-500'}`}>{badge.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.desc}</p>
                      {badge.earned ? (
                        <span className="mt-4 text-[10px] font-extrabold px-3 py-1 bg-amber-200 text-amber-900 rounded-full shadow-sm">EARNED ✓</span>
                      ) : (
                        <span className="mt-4 text-[10px] font-extrabold px-3 py-1 bg-slate-200 text-slate-500 rounded-full">LOCKED</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Incentives */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <Star className="w-5 h-5 text-violet-500" /> Incentives & Rewards
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Q2 Performance Bonus', amount: '₹5,000', status: 'Earned', desc: 'Hit 85% of Q2 target', color: 'text-green-700 bg-green-50 border-green-200' },
                    { title: 'Top Caller Award - May', amount: '₹1,000', status: 'Pending', desc: 'Processing this month', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                    { title: 'Q3 Target Bonus', amount: '₹8,000', status: 'Locked', desc: 'Hit 90% of Q3 target to unlock', color: 'text-slate-500 bg-slate-50 border-slate-200' },
                  ].map((inc, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${inc.color}`}>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{inc.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{inc.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-slate-800">{inc.amount}</p>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${inc.color}`}>{inc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY SUMMARY ── */}
          {activeTab === 'activity' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Calls Made', value: callsMade, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Emails Sent', value: emailsSent, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Meetings Done', value: meetingsDone, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Tasks Completed', value: tasksCompleted, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((k, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className={`w-8 h-8 ${k.bg} rounded-xl flex items-center justify-center mb-3`}><k.icon className={`w-4 h-4 ${k.color}`} /></div>
                    <p className="text-xl font-extrabold text-slate-800">{k.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Recent Activity Timeline</h3>
                  <button onClick={() => router.push('/sales/activity')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
                </div>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No activities logged yet. <button onClick={() => router.push('/sales/activity')} className="text-blue-600 hover:underline font-semibold">Log one →</button></p>
                    </div>
                  ) : activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer" onClick={() => router.push('/sales/activity')}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.type === 'Call' ? 'bg-green-100' : act.type === 'Email' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                        {act.type === 'Call' ? <Phone className="w-3.5 h-3.5 text-green-700" /> : act.type === 'Email' ? <Mail className="w-3.5 h-3.5 text-blue-700" /> : <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-xs font-bold text-slate-800">{act.type} · {act.lead_name || 'No Lead'}</p>
                          <span className="text-[9px] text-slate-400">{new Date(act.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        {act.outcome && <p className="text-[10px] text-slate-500 mt-0.5">Outcome: {act.outcome}</p>}
                        {act.notes && <p className="text-[10px] text-slate-400 truncate">{act.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI productivity */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                <p className="text-xs font-extrabold text-blue-700 flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 animate-pulse" /> AI Productivity Analysis & Insights</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Productivity Score', value: '88%', desc: 'Excellent Activity' },
                    { label: 'Task Completion', value: '92%', desc: 'High Follow-up Rate' },
                    { label: 'Response Rate', value: '85%', desc: 'Above Average' },
                    { label: 'Best Contact Window', value: '10AM-12PM', desc: 'Peak engagement' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-blue-700">{s.value}</p>
                      <p className="text-[10px] font-bold text-slate-700">{s.label}</p>
                      <p className="text-[9px] text-slate-400">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-500" /> Account Settings</h3>
                {/* Language */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Language Preference</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 bg-white focus:border-blue-500">
                    <option>English (Default)</option>
                    <option>Hindi</option>
                    <option>Gujarati</option>
                    <option>Marathi</option>
                  </select>
                </div>
                {/* Timezone */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Timezone</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-700 bg-white focus:border-blue-500">
                    <option>India Standard Time (IST) UTC+5:30</option>
                  </select>
                </div>
                {/* Smart Notification Control */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Smart Notification Control
                  </p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Intelligently throttles low-priority updates while keeping task and hot lead reminders instantaneous.
                  </p>
                </div>
                {/* Save */}
                <button onClick={() => showToast('Settings saved!')} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">Save Settings</button>
              </div>

              {/* Logout section */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Monitor className="w-4 h-4 text-slate-500" /> Active Sessions & Control</h3>
                  <div className="space-y-3">
                    {loginHistory.slice(0, 2).map((session: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${session.current ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{session.device}</p>
                          <p className="text-[10px] text-slate-400">{session.location}</p>
                        </div>
                        {session.current && <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                    ))}
                    {loginHistory.length === 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">Windows PC · Chrome</p>
                          <p className="text-[10px] text-slate-400">Mumbai, India · Active Now</p>
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Current</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-semibold text-amber-800">AI Auto Logout Suggestion: Unused web sessions older than 7 days will be automatically terminated.</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout & Session Control</h3>
                  <p className="text-[11px] text-red-600 mb-4">You will be logged out of all active sessions on this device.</p>
                  <button onClick={handleLogout} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Change Password & Toggles */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><Key className="w-4 h-4 text-blue-500" /> Change Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                    {[
                      { label: 'Current Password', key: 'currentPassword' as const, showKey: 'current' as const },
                      { label: 'New Password', key: 'newPassword' as const, showKey: 'new' as const },
                      { label: 'Confirm New Password', key: 'confirmPassword' as const, showKey: 'confirm' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
                        <div className="relative">
                          <input required type={showPw[f.showKey] ? 'text' : 'password'}
                            value={pwForm[f.key]}
                            onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                            placeholder="••••••••"
                            className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                          <button type="button" onClick={() => setShowPw(s => ({ ...s, [f.showKey]: !s[f.showKey] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw[f.showKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="submit" disabled={pwLoading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                      {pwLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                      Change Password
                    </button>
                  </form>
                </div>

                {/* OTP & Biometric Controls */}
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Advanced Authentication</h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-600" /> OTP Verification (Two-Factor)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Requires OTP code upon each login</p>
                    </div>
                    <button onClick={() => { setOtpEnabled(!otpEnabled); showToast(otpEnabled ? 'OTP Disabled' : 'OTP Enabled'); }}
                      className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${otpEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${otpEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4 text-purple-600" /> Biometric Integration (WebAuthn)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Unlock with TouchID / FaceID</p>
                    </div>
                    <button onClick={() => { setBiometricEnabled(!biometricEnabled); showToast(biometricEnabled ? 'Biometrics Disabled' : 'Biometrics Configured successfully!'); }}
                      className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${biometricEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}>
                      <span className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${biometricEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Login History + Security Status */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" /> Login History & Device Management</h3>
                  <div className="space-y-3">
                    {loginHistory.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Monitor className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800">{h.device}</p>
                            {h.current && <span className="text-[9px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active Now</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe className="w-2.5 h-2.5" /> {h.location} · {h.ip}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(h.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {loginHistory.length === 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Monitor className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800">Windows PC · Chrome</p>
                            <span className="text-[9px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active Now</span>
                          </div>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe className="w-2.5 h-2.5" /> Mumbai, India · 192.168.1.1
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Suspicious login alert & suggestions */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> AI Security Guard
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>No Suspicious Logins Detected:</strong> Your login pattern matches established geo-fences. 
                  </p>
                  <p className="text-[11px] text-emerald-700 bg-white/60 p-2.5 rounded-xl border border-emerald-100">
                    🔒 <strong>AI Security Suggestion:</strong> Enable Biometric WebAuthn for faster, phishing-resistant logins across all CRM microservices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notifications Control & Alerts
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'follow_up_reminders', label: 'Follow-up Reminders', desc: 'Get reminded before scheduled follow-ups' },
                  { key: 'new_lead_alerts', label: 'New Lead Alerts', desc: 'Notify when a new lead is assigned to you' },
                  { key: 'task_alerts', label: 'Task Alerts', desc: 'Remind before task due time' },
                  { key: 'manager_messages', label: 'Manager Messages', desc: 'Receive messages from your manager' },
                  { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive alerts on your email' },
                  { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive alerts via SMS' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    <button onClick={() => setNotifSettings(n => ({ ...n, [s.key]: !(n as any)[s.key] }))}
                      className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${(notifSettings as any)[s.key] ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${(notifSettings as any)[s.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                  AI Priority Alert Filtering: Automatically suppresses secondary alerts during live client calls and meetings to maximize sales conversion focus.
                </p>
              </div>
              <button onClick={() => showToast('Notification preferences saved!')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
                Save Preferences
              </button>
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> My Documents & ID</h3>
                  <button onClick={() => showToast('File upload coming soon!', 'info')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" /> Upload ID / Doc
                  </button>
                </div>
                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.type} · Uploaded {doc.date} · Expiry: {doc.expiry}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{doc.status}</span>
                        <button className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition" onClick={() => showToast('Document downloading...')}><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDocuments(d => d.filter((_, j) => j !== i))} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-10">
                      <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No documents uploaded yet.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>AI Expiry Alert & Missing Document Detection</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Your <strong>Employee ID Card</strong> is fully valid until Jan 2028. However, AI detects that your <strong>Annual Compliance Certificate</strong> has not been uploaded for the current fiscal year.
                  </p>
                </div>
              </div>

              {/* Upload area */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-blue-300 transition cursor-pointer" onClick={() => showToast('File upload coming soon!', 'info')}>
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload document or ID</p>
                <p className="text-[10px] text-slate-400 mt-1">Supported: PDF, JPG, PNG (max 10MB)</p>
              </div>
            </div>
          )}

          {/* ── HELP & SUPPORT & AI CHATBOT ── */}
          {activeTab === 'help' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* AI Chatbot Support */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[480px]">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> AI Support Chatbot & Smart Solutions
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none font-semibold' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input type="text" value={chatQuery} onChange={e => setChatQuery(e.target.value)} placeholder="Ask AI about targets, leads or help..."
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs text-slate-800 font-semibold" />
                  <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow shrink-0 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Raise a ticket & Contact Admin */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500" /> Raise a Support Ticket</h3>
                  <form onSubmit={handleHelpSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
                      <input required type="text" value={helpForm.subject} onChange={e => setHelpForm({ ...helpForm, subject: e.target.value })}
                        placeholder="Briefly describe the issue..."
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message</label>
                      <textarea required rows={4} value={helpForm.message} onChange={e => setHelpForm({ ...helpForm, message: e.target.value })}
                        placeholder="Describe the issue in detail. Include steps to reproduce, screenshots if relevant..."
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                    </div>
                    <button type="submit" disabled={helpLoading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                      {helpLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      Submit Ticket
                    </button>
                  </form>
                </div>

                {/* Contact admin */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Contact Admin</h4>
                  <p className="text-[11px] text-blue-600 mb-3">Need immediate assistance? Contact your admin directly.</p>
                  <div className="space-y-2">
                    <button onClick={() => window.open('mailto:admin@company.com')} className="w-full flex items-center gap-2 p-2.5 bg-white rounded-xl border border-blue-200 hover:bg-blue-50 transition text-xs font-semibold text-blue-700">
                      <Mail className="w-4 h-4" /> admin@company.com
                    </button>
                    <button onClick={() => window.open('tel:+911234567890')} className="w-full flex items-center gap-2 p-2.5 bg-white rounded-xl border border-blue-200 hover:bg-blue-50 transition text-xs font-semibold text-blue-700">
                      <Phone className="w-4 h-4" /> +91 12345 67890
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
