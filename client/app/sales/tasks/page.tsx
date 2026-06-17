'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, CheckSquare, Activity, Calendar, Sparkles, Plus, Clock,
  CheckCircle, Trash2, CalendarDays, X, Mail, Bell, RefreshCw,
  BadgeCheck, AlertTriangle, Target, Zap, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </div>
  );
}

const TYPE_ICON: Record<string, any> = {
  Call: Phone,
  Meeting: CheckSquare,
  'Follow-up': Bell,
  Email: Mail,
  Demo: Target,
  WhatsApp: Zap,
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
};

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-green-50 text-green-700',
  Meeting: 'bg-blue-50 text-blue-700',
  'Follow-up': 'bg-violet-50 text-violet-700',
  Email: 'bg-amber-50 text-amber-700',
  Demo: 'bg-indigo-50 text-indigo-700',
  WhatsApp: 'bg-emerald-50 text-emerald-700',
};

function fmtTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Today');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [newTask, setNewTask] = useState({ lead_id: '', type: 'Call', title: '', scheduled_at: '', priority: 'Medium', notes: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [tasksRes, leadsRes] = await Promise.all([
        api.get('/sales/tasks'),
        api.get('/sales/leads'),
      ]);
      setTasks(tasksRes.data.data.tasks || []);
      setLeads(leadsRes.data.data.leads || []);
    } catch {
      showToast('Could not load tasks from server', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/sales/tasks', newTask);
      const lead = leads.find(l => l.id === newTask.lead_id);
      setTasks(prev => [{ ...res.data.data.task, lead_name: lead?.name }, ...prev]);
      setIsAddOpen(false);
      setNewTask({ lead_id: '', type: 'Call', title: '', scheduled_at: '', priority: 'Medium', notes: '' });
      showToast('Task created successfully!');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleMarkDone = async (taskId: string) => {
    try {
      await api.patch(`/sales/tasks/${taskId}`, { status: 'Done', completed_at: new Date().toISOString() });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' } : t));
      showToast('Task marked as done!');
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' } : t));
      showToast('Task marked as done!');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/sales/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted');
    } catch {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted');
    }
  };

  const today = new Date().toDateString();
  const now = new Date();

  const filtered = tasks.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterPriority && t.priority !== filterPriority) return false;

    const d = new Date(t.scheduled_at);
    if (activeTab === 'Today') return t.status === 'Pending' && d.toDateString() === today;
    if (activeTab === 'Upcoming') return t.status === 'Pending' && d > now;
    if (activeTab === 'Completed') return t.status === 'Done';
    if (activeTab === 'Missed') return t.status === 'Pending' && d < now && d.toDateString() !== today;
    return true;
  });

  const stats = {
    today: tasks.filter(t => t.status === 'Pending' && new Date(t.scheduled_at).toDateString() === today).length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    completed: tasks.filter(t => t.status === 'Done').length,
    missed: tasks.filter(t => t.status === 'Pending' && new Date(t.scheduled_at) < now && new Date(t.scheduled_at).toDateString() !== today).length,
  };

  const tabs = [
    { key: 'Today', count: stats.today, color: 'text-blue-600' },
    { key: 'Upcoming', count: stats.pending - stats.today, color: 'text-violet-600' },
    { key: 'Completed', count: stats.completed, color: 'text-green-600' },
    { key: 'Missed', count: stats.missed, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tasks Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">{stats.today} task{stats.today !== 1 ? 's' : ''} due today · {stats.missed} missed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => router.push('/sales/tasks/calendar')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition">
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Due Today', value: stats.today, color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
          { label: 'Total Pending', value: stats.pending, color: 'text-violet-600', bg: 'bg-violet-50', icon: Bell },
          { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'Missed', value: stats.missed, color: 'text-red-500', bg: 'bg-red-50', icon: AlertTriangle },
        ].map(item => (
          <div key={item.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{item.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.key ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                {tab.key}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 ' + tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition shrink-0 ${showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type:</span>
              {['', 'Call', 'Meeting', 'Follow-up', 'Email', 'Demo'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t || 'All'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
              {['', 'High', 'Medium', 'Low'].map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${filterPriority === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p || 'All'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <CheckSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No tasks found in this view.</p>
            <button onClick={() => setIsAddOpen(true)} className="mt-2 text-xs font-bold text-blue-600 hover:underline">+ Add a Task</button>
          </div>
        ) : (
          filtered.map(task => {
            const isUrgent = task.priority === 'High' && task.status === 'Pending';
            const isOverdue = task.status === 'Pending' && new Date(task.scheduled_at) < now;
            const TIcon = TYPE_ICON[task.type] || Bell;
            return (
              <motion.div key={task.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:shadow-md
                  ${isOverdue && task.status === 'Pending' ? 'border-red-200 bg-red-50/20' : 'border-slate-200'}
                  ${task.status === 'Done' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${TYPE_COLORS[task.type] || 'bg-slate-50 text-slate-600'}`}>
                    <TIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-xs font-bold ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${PRIORITY_COLORS[task.priority] || 'bg-slate-100 text-slate-600'}`}>
                        {task.priority}
                      </span>
                      {isUrgent && task.status !== 'Done' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase animate-pulse">Do Now</span>
                      )}
                      {isOverdue && task.status === 'Pending' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">Overdue</span>
                      )}
                      {task.status === 'Done' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Done</span>
                      )}
                    </div>
                    {task.lead_name && (
                      <button onClick={() => router.push('/sales/leads')} className="text-[10px] text-blue-600 font-semibold hover:underline mt-0.5 block">
                        Lead: {task.lead_name} {task.lead_phone ? `· ${task.lead_phone}` : ''}
                      </button>
                    )}
                    {task.notes && <p className="text-[10px] text-slate-400 mt-1 leading-snug">{task.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Scheduled</span>
                    <p className={`text-[10px] font-bold mt-0.5 ${isOverdue && task.status === 'Pending' ? 'text-red-600' : 'text-slate-700'}`}>
                      {fmtTime(task.scheduled_at)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {task.lead_phone && task.status === 'Pending' && (
                      <button onClick={() => window.open(`tel:${task.lead_phone}`)}
                        className="p-1.5 border border-green-200 hover:bg-green-50 text-green-600 rounded-lg transition" title="Call Lead">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {task.status === 'Pending' && (
                      <button onClick={() => handleMarkDone(task.id)}
                        className="p-1.5 border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg transition" title="Mark Done">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 border border-red-100 hover:bg-red-50 text-red-400 rounded-lg transition" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* AI Tip */}
      {!loading && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-[11px] font-semibold text-blue-900">
            AI Tip: Best time to make calls is <strong>10:30 AM – 12:00 PM</strong>. Schedule your high-priority call tasks in that window for maximum connect rate.
          </p>
        </div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-md h-full relative z-10 border-l border-slate-200 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Schedule New Task</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Set a follow-up, call or meeting</p>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Title *</label>
                  <input required type="text" placeholder="e.g. Follow up on proposal" value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                    <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call', 'Meeting', 'Follow-up', 'Email', 'Demo', 'WhatsApp'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link to Lead</label>
                  <select value={newTask.lead_id} onChange={e => setNewTask({ ...newTask, lead_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                    <option value="">No Lead Assignment</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date & Time *</label>
                  <input required type="datetime-local" value={newTask.scheduled_at}
                    onChange={e => setNewTask({ ...newTask, scheduled_at: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                  <textarea rows={3} placeholder="Preparation notes, agenda..." value={newTask.notes}
                    onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition" />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-800 leading-snug">
                    AI: Best call times are <strong>10:30 AM – 12:00 PM</strong> for maximum connect rate.
                  </p>
                </div>

                <button type="submit" disabled={addLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {addLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
