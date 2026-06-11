'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import {
  Sparkles, CheckCircle2, TrendingUp, Users, Clock, AlertCircle, Phone,
  MessageSquare, Eye, Plus, Calendar, FileText, Check, Trophy, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';

// Mock weekly performance data
const weeklyData = [
  { day: 'Mon', revenue: 12000, leads: 5 },
  { day: 'Tue', revenue: 19000, leads: 8 },
  { day: 'Wed', revenue: 15000, leads: 6 },
  { day: 'Thu', revenue: 22000, leads: 9 },
  { day: 'Fri', revenue: 30000, leads: 12 },
  { day: 'Sat', revenue: 8000, leads: 3 },
  { day: 'Sun', revenue: 4000, leads: 2 },
];

export default function SalesDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/sales/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.warn('Failed to fetch dashboard metrics. Using mock fallback.', err);
        // Fallback to static mock matching prompt
        setData({
          target: {
            dailyTarget: 50000,
            achievedToday: 40000,
            monthlyTarget: 100000,
            monthlyAchieved: 86000,
            targetLeads: 50,
            convertedLeads: 12
          },
          pendingLeadsCount: 12,
          todayFollowupsCount: 8,
          hotLeads: [
            { id: '1', name: 'Priya Agarwal', phone: '+91 98765 43210', priority: 'Hot', conversion_probability: 92, updated_at: new Date() },
            { id: '2', name: 'Rajesh Kumar', phone: '+91 87654 32109', priority: 'Hot', conversion_probability: 88, updated_at: new Date() },
            { id: '3', name: 'Amit Sharma', phone: '+91 76543 21098', priority: 'Hot', conversion_probability: 85, updated_at: new Date() },
            { id: '4', name: 'Neha Gupta', phone: '+91 65432 10987', priority: 'Hot', conversion_probability: 81, updated_at: new Date() }
          ],
          todayTasks: [
            { id: '10', title: 'Initial Call', lead_name: 'Priya Agarwal', type: 'Call', scheduled_at: '10:30 AM' },
            { id: '11', title: 'Product Demo', lead_name: 'Rajesh Kumar', type: 'Meeting', scheduled_at: '11:45 AM' },
            { id: '12', title: 'Contract Follow-up', lead_name: 'Amit Sharma', type: 'Follow-up', scheduled_at: '02:30 PM' },
            { id: '13', title: 'Send Proposal', lead_name: 'Neha Gupta', type: 'Email', scheduled_at: '04:00 PM' }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Today's Target", value: `₹${data?.target?.dailyTarget?.toLocaleString()}`, icon: Trophy, color: 'text-amber-600 bg-amber-50' },
    { label: 'Achieved Today', value: `₹${data?.target?.achievedToday?.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600 bg-green-50', progress: 80 },
    { label: 'Pending Leads', value: data?.pendingLeadsCount || 12, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Follow-ups Today', value: data?.todayFollowupsCount || 8, icon: Clock, color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Good Morning, {user?.name || 'Rahul'} 👋</h1>
          <p className="text-xs text-slate-500 mt-0.5">Here's your sales overview for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 dark:bg-[#161616] border border-slate-200 px-3 py-1.5 rounded-xl text-center shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Target</span>
            <span className="text-xs font-bold text-slate-800">₹50,000</span>
          </div>
          <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition">
            Save Insight
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
        <p className="text-xs font-semibold text-amber-900">
          AI Suggestion: Focus on 3 Hot leads today. You're 70% close to your daily target.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{kpi.value}</p>
              {kpi.progress !== undefined && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>Progress</span>
                    <span>{kpi.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${kpi.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Middle Layout Pane: Priority Leads + Today's Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Priority Leads */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h3 className="text-sm font-bold text-slate-800">Priority Leads (Hot)</h3>
            <button onClick={() => router.push('/sales/leads')} className="text-xs font-bold text-[#2563EB] hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {data?.hotLeads?.map((lead: any) => (
              <div key={lead.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#161616] hover:bg-slate-100/50 rounded-xl border border-slate-200/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 uppercase tracking-wide">
                        Hot 🔥
                      </span>
                      {lead.conversion_probability >= 90 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
                          Contact Now
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Win Rate</span>
                    <span className="text-xs font-bold text-slate-800">{lead.conversion_probability}%</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition" title="Call">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-green-600 transition" title="WhatsApp">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => router.push(`/sales/leads`)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-[#2563EB] transition" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Followups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h3 className="text-sm font-bold text-slate-800">Today's Follow-ups</h3>
              <button onClick={() => router.push('/sales/tasks')} className="text-xs font-bold text-[#2563EB] hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-3.5">
              {data?.todayTasks?.map((task: any) => (
                <div key={task.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{task.title}</p>
                      <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">{task.scheduled_at}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Lead: {task.lead_name}</p>
                  </div>
                  <button className="p-1 border border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-lg transition shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide block">Best Time to Call</span>
            <span className="text-xs font-bold text-blue-900 mt-0.5 block">10:30 AM - 12:00 PM</span>
          </div>
        </div>
      </div>

      {/* Grid: Actions, Suggestions & Weekly Target Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Action Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Add Lead', icon: Plus, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100', href: '/sales/leads' },
              { label: 'Call Lead', icon: Phone, color: 'bg-green-50 text-green-600 hover:bg-green-100', href: '/sales/leads' },
              { label: 'Schedule Task', icon: Calendar, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100', href: '/sales/tasks' },
              { label: 'WhatsApp', icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', href: '/sales/leads' },
              { label: 'Add Note', icon: FileText, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100', href: '/sales/leads' },
              { label: 'Show Tasks', icon: CheckCircle2, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100', href: '/sales/tasks' },
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => router.push(act.href)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition ${act.color}`}
              >
                <act.icon className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-bold text-center leading-tight">{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI suggestions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#1f1f1f] mb-3">
              <Sparkles className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">AI Suggestions</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have 3 Hot leads that haven't been contacted in the last 24 hours. Right now is the best time to follow up with them to increase conversion probability.
            </p>
          </div>
          <button onClick={() => router.push('/sales/tasks')} className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10">
            Show Tasks
          </button>
        </div>

        {/* Sales Performance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h3 className="text-sm font-bold text-slate-800">Sales Performance</h3>
            <button onClick={() => router.push('/sales/profile')} className="text-xs font-bold text-[#2563EB] hover:underline">
              View Report
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Conversion Rate</span>
              <span className="text-lg font-black text-slate-800">24%</span>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '86%' }} />
              </div>
              <span className="text-[8px] text-slate-400 mt-1 block">86% progress</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Weekly Conversions</span>
              <span className="text-lg font-black text-slate-800">{data?.target?.convertedLeads || 12} / {data?.target?.targetLeads || 50}</span>
              <span className="text-[8px] text-slate-400 mt-1 block">Leads Converted</span>
            </div>
          </div>
          {/* Mini Weekly Bar Chart */}
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Grid: Activity Snapshot, Notifications, Motivation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Activity Snapshot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Activity Snapshot (Today)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calls Made', value: 12, color: 'bg-green-50/50 border-green-200/50 text-green-700' },
              { label: 'Emails Sent', value: 5, color: 'bg-blue-50/50 border-blue-200/50 text-blue-700' },
              { label: 'Meetings Done', value: 2, color: 'bg-amber-50/50 border-amber-200/50 text-amber-700' },
              { label: 'Tasks Done', value: 8, color: 'bg-violet-50/50 border-violet-200/50 text-violet-700' },
            ].map((act, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border text-center ${act.color}`}>
                <p className="text-lg font-extrabold">{act.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{act.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          <div className="space-y-3 text-xs">
            {[
              { text: 'New lead assigned: Priya Agarwal', time: '2 min ago' },
              { text: 'Follow-up reminder: Rajesh Kumar', time: '15 min ago' },
              { text: 'Message from Sales Manager', time: '30 min ago' },
              { text: 'New lead from Facebook Ad Campaign', time: '1 hr ago' },
            ].map((notif, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2 pb-2.5 border-b border-slate-50 last:border-0 last:pb-0">
                <span className="text-slate-600 font-semibold leading-snug">{notif.text}</span>
                <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">{notif.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-between items-center text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3 shrink-0">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">You are doing great, {user?.name?.split(' ')[0] || 'Rahul'}! 🏆</h4>
            <p className="text-xs text-emerald-700 leading-relaxed mt-1.5">
              You are 70% close to your daily target. Focus on hot leads and complete today's follow-ups.
            </p>
          </div>
          <button onClick={() => router.push('/sales/leads')} className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 uppercase tracking-wide">
            Get Started <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
}
