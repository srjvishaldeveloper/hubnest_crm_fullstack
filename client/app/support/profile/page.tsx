'use client';

import { useEffect, useState } from 'react';
import { supportGetDashboard } from '../../../services/supportService';
import { useAuthStore } from '../../../store/authStore';
import {
  User,
  Mail,
  Phone,
  Shield,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Lock,
  Smartphone,
  Eye,
  Key,
  Globe,
  Star,
  Zap,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface ProfileStats {
  ticketsHandled: number;
  resolutionTime: string;
  satisfaction: number;
}

export default function SupportProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ProfileStats>({
    ticketsHandled: 48,
    resolutionTime: '2h 15m',
    satisfaction: 4.8
  });
  const [loading, setLoading] = useState(true);

  // Settings Forms
  const [name, setName] = useState(user?.name || 'Neha Verma');
  const [email, setEmail] = useState(user?.email || 'neha.verma@jobnest.com');
  const [phone, setPhone] = useState('+91 98765 43211');
  const [location, setLocation] = useState('New Delhi, India');

  // Security Toggles
  const [enable2fa, setEnable2fa] = useState(false);
  const [notifTicketAlerts, setNotifTicketAlerts] = useState(true);
  const [notifSlaAlerts, setNotifSlaAlerts] = useState(true);

  async function loadPerformanceStats() {
    try {
      setLoading(true);
      const res = await supportGetDashboard();
      if (res?.agentPerformance?.length > 0) {
        // Find current user's performance stats or take first entry
        const myPerf = res.agentPerformance.find((p: any) => p.id === user?.id) || res.agentPerformance[0];
        if (myPerf) {
          setStats({
            ticketsHandled: myPerf.ticketsHandled || 48,
            resolutionTime: myPerf.resolutionTime || '2h 15m',
            satisfaction: myPerf.satisfaction || 4.8
          });
        }
      }
    } catch (err) {
      console.error('Failed to load performance profile stats', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformanceStats();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Banner / Header profile */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/10">
          {user?.name?.charAt(0).toUpperCase() || 'N'}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-xl font-black text-[#0F172A]">{user?.name || 'Neha Verma'}</h1>
          <p className="text-xs text-slate-400 font-semibold">Employee ID: #{user?.adminId || 'SUP-0253'}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wider">
              {user?.role || 'Support Manager'}
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 uppercase tracking-wider">
              Customer Support Division
            </span>
          </div>
        </div>
      </div>

      {/* Main grids: Personal profile, Security audit settings, performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Info and Account Settings */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Info Edit Form */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-4">Personal Information</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-slate-400">Full Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Mobile Number</label>
                <input
                  type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Location</label>
                <input
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>
            </form>
          </div>

          {/* Security & Password reset section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm mb-4">Security Rules</h3>
              
              <div className="space-y-4 text-xs font-medium text-slate-600">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-600" /> Two-Factor Authentication (2FA)</p>
                    <p className="text-[10px] text-slate-400">Add an extra layer of login verification safety to protect support logs.</p>
                  </div>
                  <input
                    type="checkbox" checked={enable2fa} onChange={e => setEnable2fa(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5"><Mail className="w-4 h-4 text-indigo-500" /> Ticket Escalation Alerts</p>
                    <p className="text-[10px] text-slate-400">Notify instantly via email when a ticket is escalated by client managers.</p>
                  </div>
                  <input
                    type="checkbox" checked={notifTicketAlerts} onChange={e => setNotifTicketAlerts(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> SLA Deadline Reminders</p>
                    <p className="text-[10px] text-slate-400">Trigger warnings when assigned tickets are within 1 hour of breach.</p>
                  </div>
                  <input
                    type="checkbox" checked={notifSlaAlerts} onChange={e => setNotifSlaAlerts(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Active session audits */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">Active Device Sessions</h4>
              
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-850">Chrome on Windows (Current Session)</p>
                      <span className="text-[10px] text-slate-400 font-medium">IP: 192.168.1.48 • Delhi, India</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded uppercase">Active</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-850">JobNest Mobile App (iOS)</p>
                      <span className="text-[10px] text-slate-400 font-medium">IP: 103.88.22.4 • Mumbai, India</span>
                    </div>
                  </div>
                  <button className="text-[9px] font-extrabold text-red-500 hover:bg-red-50 border border-red-100 px-2 py-1 rounded uppercase">Revoke</button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Performance metrics and AI core workloads */}
        <div className="space-y-6">
          
          {/* Performance scorecard */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#2563EB]" /> Support KPIs</h3>
            
            <div className="space-y-3 text-xs font-semibold text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Total Tickets Resolved</span>
                <span className="font-black text-slate-800">{stats.ticketsHandled}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Avg Resolution Speed</span>
                <span className="font-black text-slate-800">{stats.resolutionTime}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>CSAT Score</span>
                <span className="font-black text-[#2563EB]">⭐ {stats.satisfaction} / 5.0</span>
              </div>
              <div className="flex justify-between">
                <span>SLA Compliance Rate</span>
                <span className="font-black text-green-600">96%</span>
              </div>
            </div>
          </div>

          {/* Workload balancer panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Workload Summary</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Current Assigned Backlog</span>
                  <span className="text-slate-700 font-bold">4 / 10 limit</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Burnout Index</span>
                  <span className="text-green-600 font-bold">Ideal Workload</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI profile coach */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">AI Insights Panel</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Your average ticket resolution speed is improving by 12% week-over-week. Good job! To boost satisfaction score further, try attaching related help articles to common billing tickets.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
