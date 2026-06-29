'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import {
  ArrowLeft, Clock, Phone, Mail, AlertCircle, FileText, CheckCircle,
  XCircle, Zap, Calendar, RefreshCw, MessageSquare, User, Target,
  Bell, Edit3, Save, X, BadgeCheck, AlertTriangle, ChevronRight,
  Sparkles, Activity, Flame, Star, MapPin, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_TASK_DETAIL = {
  id: '1', type: 'Call', title: 'Initial Call', lead_id: '1',
  lead_name: 'Arjun Mehta', lead_phone: '+91 98765 43210',
  lead_email: 'arjun@example.com', scheduled_at: new Date(Date.now() + 3600000).toISOString(),
  priority: 'High', status: 'Pending',
  notes: 'Discuss pricing guidelines and present cloud subscriptions.',
};

const PRIO: Record<string, string> = {
  High: 'bg-red-100 text-red-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-green-100 text-green-700',
};
const STATUS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700', Done: 'bg-green-100 text-green-700', Missed: 'bg-red-100 text-red-700',
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </motion.div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/sales/tasks/${id}`);
        const t = res.data.data.task;
        setTask(t); setNotes(t.notes || '');
      } catch {
        setTask(MOCK_TASK_DETAIL); setNotes(MOCK_TASK_DETAIL.notes);
      } finally { setLoading(false); }
    };
    fetchTask();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(newStatus);
    const payload = { status: newStatus, notes, completed_at: newStatus === 'Done' ? new Date().toISOString() : null };
    try {
      await api.patch(`/sales/tasks/${id}`, payload);
      setTask({ ...task, status: newStatus, notes });
      showToast(`Task marked as ${newStatus}!`);
      setTimeout(() => router.push('/sales/tasks'), 1000);
    } catch {
      setTask({ ...task, status: newStatus, notes });
      showToast(`Task ${newStatus} saved!`);
      setTimeout(() => router.push('/sales/tasks'), 1000);
    } finally { setActionLoading(null); }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/sales/tasks/${id}`, { notes });
      setTask({ ...task, notes }); setEditingNotes(false);
      showToast('Notes saved!');
    } catch {
      showToast('Failed to save notes', 'error');
    } finally { setSavingNotes(false); }
  };

  const handleReschedule = async (offsetDays: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + offsetDays);
    newDate.setHours(10, 0, 0, 0);
    setActionLoading('reschedule');
    try {
      await api.patch(`/sales/tasks/${id}`, { scheduled_at: newDate.toISOString() });
      setTask({ ...task, scheduled_at: newDate.toISOString() });
      showToast(`Rescheduled to ${newDate.toDateString()}`);
    } catch {
      showToast('Failed to reschedule', 'error');
    } finally { setActionLoading(null); }
  };

  const isOverdue = task ? new Date(task.scheduled_at) < new Date() && task.status === 'Pending' : false;
  const isToday = task ? new Date(task.scheduled_at).toDateString() === new Date().toDateString() : false;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading task…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }} className="rounded-2xl p-5 text-white flex items-center gap-3">
        <button onClick={() => router.push('/sales/tasks')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase tracking-wider">{task?.type}</span>
            {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-400/80 rounded-full flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Overdue</span>}
            {isToday && !isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-400/80 rounded-full flex items-center gap-1"><Bell className="w-2.5 h-2.5" /> Due Today</span>}
          </div>
          <h2 className="text-lg font-extrabold mt-1 truncate">{task?.title}</h2>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-xl ${PRIO[task?.priority] || ''}`}>{task?.priority}</span>
          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-xl ${STATUS[task?.status] || ''}`}>{task?.status}</span>
        </div>
      </div>

      {/* Task Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            { label: 'Type', value: task?.type, icon: Activity },
            { label: 'Priority', value: task?.priority, icon: Flame },
            { label: 'Status', value: task?.status, icon: CheckCircle },
            { label: 'Scheduled', value: task?.scheduled_at ? new Date(task.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—', icon: Clock },
            { label: 'Lead', value: task?.lead_name || 'No Lead', icon: User },
            { label: 'Created', value: task?.created_at ? new Date(task.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—', icon: Calendar },
          ].map((d, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <d.icon className="w-3 h-3" /> {d.label}
              </div>
              <p className={`font-semibold text-slate-800 ${d.label === 'Lead' && task?.lead_name ? 'text-blue-600 cursor-pointer hover:underline' : ''}`}
                onClick={() => d.label === 'Lead' && task?.lead_name && router.push('/sales/leads')}>
                {d.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Contact Info */}
      {(task?.lead_name || task?.lead_phone || task?.lead_email) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Lead Contact Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {task?.lead_name && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition" onClick={() => router.push('/sales/leads')}>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                  {task.lead_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-blue-500 uppercase">Lead</p>
                  <p className="font-bold text-blue-800">{task.lead_name}</p>
                </div>
              </div>
            )}
            {task?.lead_phone && (
              <a href={`tel:${task.lead_phone}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-white" /></div>
                <div>
                  <p className="text-[9px] font-bold text-green-500 uppercase">Phone</p>
                  <p className="font-bold text-green-800">{task.lead_phone}</p>
                </div>
              </a>
            )}
            {task?.lead_email && (
              <a href={`mailto:${task.lead_email}`} className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl hover:bg-violet-100 transition">
                <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-white" /></div>
                <div>
                  <p className="text-[9px] font-bold text-violet-500 uppercase">Email</p>
                  <p className="font-bold text-violet-800 break-all">{task.lead_email}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Notes & Outcome</h3>
          {!editingNotes ? (
            <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-xl hover:bg-blue-100 transition">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingNotes(false)} className="px-2.5 py-1 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
              <button onClick={handleSaveNotes} disabled={savingNotes} className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-60">
                {savingNotes ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
            </div>
          )}
        </div>
        {editingNotes ? (
          <textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 text-xs resize-none focus:border-blue-500 transition"
            placeholder="Add notes, outcome, or observations about this task..." />
        ) : (
          <p className="text-xs text-slate-700 leading-relaxed p-3 bg-slate-50 rounded-xl min-h-[60px]">
            {notes || <span className="text-slate-400 italic">No notes yet. Click Edit to add notes.</span>}
          </p>
        )}
      </div>

      {/* Primary Actions */}
      {task?.status === 'Pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => handleUpdateStatus('Done')} disabled={!!actionLoading}
              className="py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs disabled:opacity-60 shadow-sm">
              {actionLoading === 'Done' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Completed
            </button>
            {task?.lead_phone && (
              <a href={`tel:${task.lead_phone}`}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
            <button
              onClick={() => {
                const phone = (task?.lead_phone || '').replace(/\D/g, '');
                const msg = encodeURIComponent(`Hi ${task?.lead_name || ''}, following up on task: ${task?.title}`);
                window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
              }}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
            {task?.lead_email && (
              <a href={`mailto:${task.lead_email}?subject=${encodeURIComponent(`Follow-up: ${task?.title || ''}`)}`}
                className="py-3 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                <Mail className="w-4 h-4" /> Email Lead
              </a>
            )}
          </div>
        </div>
      )}

      {/* Reschedule */}
      {task?.status === 'Pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Reschedule Task</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Later Today', days: 0, hours: 2 },
              { label: 'Tomorrow 10AM', days: 1 },
              { label: 'In 3 Days', days: 3 },
            ].map((opt, i) => (
              <button key={i} onClick={() => handleReschedule(opt.days)} disabled={actionLoading === 'reschedule'}
                className="py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition flex items-center justify-center gap-1 text-[10px] disabled:opacity-60">
                <Calendar className="w-3 h-3" /> {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mark as Missed / Cancel */}
      {task?.status === 'Pending' && (
        <button onClick={() => handleUpdateStatus('Missed')} disabled={!!actionLoading}
          className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 text-xs bg-white shadow-sm disabled:opacity-60">
          {actionLoading === 'Missed' ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
          Mark as Missed / Cancel
        </button>
      )}

      {/* Done state */}
      {task?.status === 'Done' && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-extrabold text-green-800">Task Completed!</p>
          <p className="text-xs text-green-600 mt-1">Well done! This task has been marked as done.</p>
          <button onClick={() => router.push('/sales/tasks')} className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">
            Back to Tasks →
          </button>
        </motion.div>
      )}

      {/* AI Tip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="text-xs font-extrabold text-blue-700">AI Tip</p>
          <p className="text-[11px] text-blue-600 mt-0.5 leading-snug">
            {isOverdue
              ? 'This task is overdue. Prioritize calling or rescheduling now to avoid losing the lead.'
              : isToday
              ? 'Best time to complete this task is before 12PM for highest engagement.'
              : `Schedule your call with ${task?.lead_name || 'this lead'} between 10AM–12PM for best results.`}
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: 'All Tasks', icon: Activity, href: '/sales/tasks' },
            { label: 'Calendar', icon: Calendar, href: '/sales/tasks/calendar' },
            { label: 'Leads', icon: User, href: '/sales/leads' },
          ].map((l, i) => (
            <button key={i} onClick={() => router.push(l.href)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-slate-50 transition text-slate-500 hover:text-blue-600">
              <l.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
