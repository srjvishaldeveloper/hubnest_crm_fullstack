'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, Mail, Calendar, Activity, Plus, Filter, Download, ArrowUpRight,
  TrendingUp, Award, Clock, Sparkles, X, MessageSquare, BookOpen, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_ACTIVITIES = [
  { id: '1', type: 'Call', lead_name: 'Priya Agarwal', outcome: 'Connected', duration_seconds: 204, notes: 'Interested in upgrading to enterprise cloud solutions. Schedule proposal delivery.', created_at: new Date().toISOString() },
  { id: '2', type: 'Email', lead_name: 'Arjun Mehta', outcome: 'Interested', duration_seconds: 0, notes: 'Sent catalogue details and custom pricing guidelines.', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '3', type: 'Meeting', lead_name: 'Rajesh Kumar', outcome: 'Connected', duration_seconds: 1800, notes: 'Conducted screen share demo. Addressed concerns regarding workspace migration.', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'Call', lead_name: 'Kavitha Nair', outcome: 'No Answer', duration_seconds: 0, notes: 'Attempted phone call follow-up. Customer did not pick up.', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', type: 'Email', lead_name: 'Rahul Singh', outcome: 'Interested', duration_seconds: 0, notes: 'Sent follow-up contract document via email.', created_at: new Date(Date.now() - 172800000).toISOString() }
];

const weeklyActivityData = [
  { name: 'Mon', Calls: 8, Emails: 3, Meetings: 1 },
  { name: 'Tue', Calls: 12, Emails: 5, Meetings: 2 },
  { name: 'Wed', Calls: 10, Emails: 4, Meetings: 1 },
  { name: 'Thu', Calls: 15, Emails: 6, Meetings: 3 },
  { name: 'Fri', Calls: 14, Emails: 5, Meetings: 2 },
  { name: 'Sat', Calls: 4, Emails: 2, Meetings: 0 },
  { name: 'Sun', Calls: 2, Emails: 1, Meetings: 0 },
];

export default function ActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All'); // All, Calls, Emails, Meetings
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [summary, setSummary] = useState({ Call: 12, Email: 5, Meeting: 2 });

  // Log activity form state
  const [newLog, setNewLog] = useState({
    lead_id: '', type: 'Call', outcome: 'Connected', duration_seconds: 0, notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, leadsRes, summaryRes] = await Promise.all([
        api.get('/sales/activities'),
        api.get('/sales/leads'),
        api.get('/sales/activities/summary')
      ]);
      setActivities(actRes.data.data.activities);
      setLeads(leadsRes.data.data.leads);
      setSummary(summaryRes.data.data.summary);
    } catch {
      setActivities(MOCK_ACTIVITIES);
      setLeads([
        { id: '1', name: 'Arjun Mehta' },
        { id: '2', name: 'Priya Sharma' },
        { id: '3', name: 'Rahul Singh' },
        { id: '4', name: 'Kavitha Nair' },
        { id: '5', name: 'Priya Agarwal' }
      ]);
      setSummary({ Call: 12, Email: 5, Meeting: 2 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/sales/activities', newLog);
      const lead = leads.find(l => l.id === newLog.lead_id);
      const created = {
        ...res.data.data.activity,
        lead_name: lead ? lead.name : 'No Lead'
      };
      setActivities([created, ...activities]);
      setIsLogPanelOpen(false);
      setNewLog({ lead_id: '', type: 'Call', outcome: 'Connected', duration_seconds: 0, notes: '' });
      // Update local counts
      setSummary(prev => ({ ...prev, [newLog.type]: (prev as any)[newLog.type] + 1 }));
    } catch {
      const lead = leads.find(l => l.id === newLog.lead_id);
      const mockCreated = {
        id: String(Date.now()),
        ...newLog,
        lead_name: lead ? lead.name : 'No Lead',
        created_at: new Date().toISOString()
      };
      setActivities([mockCreated, ...activities]);
      setIsLogPanelOpen(false);
      setSummary(prev => ({ ...prev, [newLog.type]: (prev as any)[newLog.type] + 1 }));
    }
  };

  const filtered = activities.filter(act => {
    if (activeTab === 'Calls') return act.type === 'Call';
    if (activeTab === 'Emails') return act.type === 'Email';
    if (activeTab === 'Meetings') return act.type === 'Meeting';
    return true;
  });

  const totalActivities = summary.Call + summary.Email + summary.Meeting;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">Logs of all call, email, and meeting interactions.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setIsLogPanelOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10">
            <Plus className="w-4 h-4" /> Log Activity
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Calls Made', value: summary.Call, color: 'text-green-600 bg-green-50' },
          { label: 'Emails Sent', value: summary.Email, color: 'text-blue-600 bg-blue-50' },
          { label: 'Meetings Done', value: summary.Meeting, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Activities', value: totalActivities, color: 'text-violet-600 bg-violet-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xl font-black text-slate-800">{item.value}</span>
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${item.color} uppercase`}>Today</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {['All', 'Calls', 'Emails', 'Meetings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid: Timeline & Performance Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Timeline Log */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">Timeline Activity</h3>
          {loading ? (
            <div className="text-center py-12">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xs">No activities logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
              {filtered.map(act => (
                <div key={act.id} className="relative">
                  {/* Color coded icon dots */}
                  <span className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 border-white ring-2 flex items-center justify-center text-white
                    ${act.type === 'Call' ? 'bg-green-500 ring-green-100' : (act.type === 'Email' ? 'bg-blue-500 ring-blue-100' : 'bg-amber-500 ring-amber-100')}`}>
                    {act.type === 'Call' && <Phone className="w-2.5 h-2.5" />}
                    {act.type === 'Email' && <Mail className="w-2.5 h-2.5" />}
                    {act.type === 'Meeting' && <Calendar className="w-2.5 h-2.5" />}
                  </span>

                  <div>
                    <div className="flex justify-between items-start gap-2 text-[10px] text-slate-400 font-bold">
                      <span className="font-sans text-slate-500">
                        {act.type === 'Call' ? 'Outgoing Call' : (act.type === 'Email' ? 'Sent Email' : 'Conducted Meeting')}
                      </span>
                      <span className="font-mono">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <p className="text-xs font-bold text-slate-800">Discussed with: <span className="text-[#2563EB] hover:underline cursor-pointer" onClick={() => router.push('/sales/leads')}>{act.lead_name || 'No Lead'}</span></p>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase
                        ${act.outcome === 'Connected' || act.outcome === 'Interested' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {act.outcome}
                      </span>
                    </div>
                    {act.type === 'Call' && act.duration_seconds > 0 && (
                      <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                        Call Duration: {Math.floor(act.duration_seconds / 60)}m {act.duration_seconds % 60}s
                      </span>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {act.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 mb-3">Weekly Activities</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                  <Bar dataKey="Calls" fill="#22C55E" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Emails" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Meetings" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Productivity Metrics</h3>
            {[
              { label: 'Response Rate', value: '68%', color: 'text-blue-600 bg-blue-50/50' },
              { label: 'Engagement Rate', value: '45%', color: 'text-green-600 bg-green-50/50' },
              { label: 'Productivity Score (AI)', value: '82', color: 'text-violet-600 bg-violet-50/50' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500">{metric.label}</span>
                <span className={`px-2 py-0.5 rounded-md font-extrabold ${metric.color}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Log Activity Panel */}
      <AnimatePresence>
        {isLogPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsLogPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-md h-full relative z-10 border-l border-slate-200 flex flex-col shadow-2xl p-6"
            >
              {/* Panel Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Communication</h3>
                <button onClick={() => setIsLogPanelOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Panel Form */}
              <form onSubmit={handleLogActivity} className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Communication Type</label>
                  <select
                    value={newLog.type}
                    onChange={e => setNewLog({ ...newLog, type: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    {['Call', 'Email', 'Meeting'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Lead</label>
                  <select
                    value={newLog.lead_id}
                    onChange={e => setNewLog({ ...newLog, lead_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    <option value="">No Lead Assignment</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outcome</label>
                  <select
                    value={newLog.outcome}
                    onChange={e => setNewLog({ ...newLog, outcome: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    {['Connected', 'No Answer', 'Interested', 'Not Interested', 'Converted', 'Lost'].map(ot => (
                      <option key={ot} value={ot}>{ot}</option>
                    ))}
                  </select>
                </div>

                {newLog.type === 'Call' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Call Duration (seconds)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={newLog.duration_seconds || ''}
                      onChange={e => setNewLog({ ...newLog, duration_seconds: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Log detail notes about discussion topic and next actions..."
                    value={newLog.notes}
                    onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-blue-800 leading-snug">
                    AI suggestion: Log detailed notes to let AI identify next best actions automatically.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/10"
                >
                  Save Log
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
