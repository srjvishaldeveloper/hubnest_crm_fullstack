'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, Users, CheckSquare, Activity, Calendar, Sparkles, Plus, Clock,
  Filter, CheckCircle, Trash2, CalendarDays, X, ChevronRight, Mail, Bell, Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_TASKS = [
  { id: '1', type: 'Call', title: 'Initial Call', lead_id: '1', lead_name: 'Arjun Mehta', lead_phone: '+91 98765 43210', scheduled_at: '2026-06-06T10:30:00Z', priority: 'High', status: 'Pending', notes: 'Discuss pricing.' },
  { id: '2', type: 'Meeting', title: 'Product Demo', lead_id: '2', lead_name: 'Priya Sharma', lead_phone: '+91 87654 32109', scheduled_at: '2026-06-06T11:45:00Z', priority: 'High', status: 'Pending', notes: 'Present slide deck.' },
  { id: '3', type: 'Follow-up', title: 'Contract Signature', lead_id: '3', lead_name: 'Rahul Singh', lead_phone: '+91 76543 21098', scheduled_at: '2026-06-06T14:30:00Z', priority: 'Medium', status: 'Pending', notes: 'Check if contract is signed.' },
  { id: '4', type: 'Email', title: 'Send Catalogue', lead_id: '4', lead_name: 'Kavitha Nair', lead_phone: '+91 65432 10987', scheduled_at: '2026-06-07T09:00:00Z', priority: 'Low', status: 'Pending', notes: 'Send catalogue via email.' },
  { id: '5', type: 'Call', title: 'Check Interest', lead_id: '5', lead_name: 'Priya Agarwal', lead_phone: '+91 95432 09876', scheduled_at: '2026-06-06T10:15:00Z', priority: 'High', status: 'Pending', notes: 'Follow-up call.' }
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Today'); // Today, Upcoming, Completed, Missed
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filterType, setFilterType] = useState('All Types');
  const [filterPriority, setFilterPriority] = useState('All Priorities');

  // New Task form state
  const [newTask, setNewTask] = useState({
    lead_id: '', type: 'Call', title: '', scheduled_at: '', priority: 'Medium', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, leadsRes] = await Promise.all([
        api.get('/sales/tasks'),
        api.get('/sales/leads')
      ]);
      setTasks(tasksRes.data.data.tasks);
      setLeads(leadsRes.data.data.leads);
    } catch {
      setTasks(MOCK_TASKS);
      setLeads([
        { id: '1', name: 'Arjun Mehta' },
        { id: '2', name: 'Priya Sharma' },
        { id: '3', name: 'Rahul Singh' },
        { id: '4', name: 'Kavitha Nair' },
        { id: '5', name: 'Priya Agarwal' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/sales/tasks', newTask);
      // find lead name
      const lead = leads.find(l => l.id === newTask.lead_id);
      const created = {
        ...res.data.data.task,
        lead_name: lead ? lead.name : 'No Lead'
      };
      setTasks([created, ...tasks]);
      setIsPanelOpen(false);
      setNewTask({ lead_id: '', type: 'Call', title: '', scheduled_at: '', priority: 'Medium', notes: '' });
    } catch {
      const lead = leads.find(l => l.id === newTask.lead_id);
      const mockCreated = {
        id: String(Date.now()),
        ...newTask,
        lead_name: lead ? lead.name : 'No Lead',
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      setTasks([mockCreated, ...tasks]);
      setIsPanelOpen(false);
    }
  };

  const handleMarkDone = async (taskId: string) => {
    try {
      await api.patch(`/sales/tasks/${taskId}`, { status: 'Done', completed_at: new Date().toISOString() });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done', completed_at: new Date().toISOString() } : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done', completed_at: new Date().toISOString() } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/sales/sales/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter(t => {
      // Filter by type
      if (filterType !== 'All Types' && t.type !== filterType) return false;
      // Filter by priority
      if (filterPriority !== 'All Priorities' && t.priority !== filterPriority) return false;

      const taskDate = new Date(t.scheduled_at).toDateString();
      const todayDate = new Date().toDateString();

      if (activeTab === 'Today') {
        return t.status === 'Pending' && taskDate === todayDate;
      }
      if (activeTab === 'Upcoming') {
        return t.status === 'Pending' && new Date(t.scheduled_at) > new Date();
      }
      if (activeTab === 'Completed') {
        return t.status === 'Done';
      }
      if (activeTab === 'Missed') {
        return t.status === 'Missed' || (t.status === 'Pending' && new Date(t.scheduled_at) < new Date() && taskDate !== todayDate);
      }
      return true;
    });
  };

  const filtered = getFilteredTasks();

  const stats = {
    today: tasks.filter(t => t.status === 'Pending' && new Date(t.scheduled_at).toDateString() === new Date().toDateString()).length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    completed: tasks.filter(t => t.status === 'Done').length,
    missed: tasks.filter(t => t.status === 'Missed' || (t.status === 'Pending' && new Date(t.scheduled_at) < new Date() && new Date(t.scheduled_at).toDateString() !== new Date().toDateString())).length
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tasks Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">Focus on completing follow-ups today.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/sales/tasks/calendar')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-[#161616] text-slate-700 text-xs font-semibold rounded-xl transition">
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
          <button onClick={() => setIsPanelOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: stats.today, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: stats.pending, color: 'text-violet-600 bg-violet-50' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600 bg-green-50' },
          { label: 'Missed', value: stats.missed, color: 'text-red-600 bg-red-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label} Tasks</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xl font-black text-slate-800">{item.value}</span>
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${item.color} uppercase`}>Live</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {['Today', 'Upcoming', 'Completed', 'Missed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                activeTab === tab ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs font-semibold p-2 border border-slate-200 rounded-xl outline-none bg-white w-1/2 sm:w-36"
          >
            {['All Types', 'Call', 'Meeting', 'Follow-up', 'Email'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-xs font-semibold p-2 border border-slate-200 rounded-xl outline-none bg-white w-1/2 sm:w-36"
          >
            {['All Priorities', 'High', 'Medium', 'Low'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-400">No tasks found matching these filters.</p>
          </div>
        ) : (
          filtered.map(task => {
            const isUrgent = task.priority === 'High' && task.status === 'Pending';
            return (
              <div
                key={task.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#161616] flex items-center justify-center shrink-0 border border-slate-100 dark:border-[#1f1f1f]">
                    {task.type === 'Call' && <Phone className="w-4.5 h-4.5 text-green-600" />}
                    {task.type === 'Meeting' && <CheckSquare className="w-4.5 h-4.5 text-blue-600" />}
                    {task.type === 'Follow-up' && <Bell className="w-4.5 h-4.5 text-violet-600" />}
                    {task.type === 'Email' && <Mail className="w-4.5 h-4.5 text-amber-600" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider
                        ${task.priority === 'High' ? 'bg-red-100 text-red-700' : (task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}`}>
                        {task.priority}
                      </span>
                      {isUrgent && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
                          Do Now
                        </span>
                      )}
                    </div>
                    <p onClick={() => router.push(`/sales/leads`)} className="text-[10px] text-slate-500 font-semibold mt-1 cursor-pointer hover:underline">
                      Lead: {task.lead_name || 'No Lead'} · {task.lead_phone || 'Private'}
                    </p>
                    {task.notes && <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{task.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Scheduled Time</span>
                    <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                      {new Date(task.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => handleMarkDone(task.id)}
                        className="p-1.5 border border-green-200 hover:bg-green-50 text-green-600 rounded-lg transition"
                        title="Mark Done"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide Creation Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-md h-full relative z-10 border-l border-slate-200 flex flex-col shadow-2xl p-6"
            >
              {/* Panel Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#1f1f1f]">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Schedule Task</h3>
                <button onClick={() => setIsPanelOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Panel Form */}
              <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discuss proposal structure"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Type</label>
                  <select
                    value={newTask.type}
                    onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    {['Call', 'Meeting', 'Follow-up', 'Email'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Lead</label>
                  <select
                    value={newTask.lead_id}
                    onChange={e => setNewTask({ ...newTask, lead_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    <option value="">No Lead Assignment</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTask.scheduled_at}
                    onChange={e => setNewTask({ ...newTask, scheduled_at: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white"
                  >
                    {['High', 'Medium', 'Low'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Log detail instructions..."
                    value={newTask.notes}
                    onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-800 leading-snug">
                    AI suggestion: Best time to schedule calls is between <strong>10:30 AM - 12:00 PM</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/10"
                >
                  Save Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
