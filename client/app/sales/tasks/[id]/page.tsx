'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, Clock, Phone, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';

const MOCK_TASK_DETAIL = {
  id: '1',
  type: 'Call',
  title: 'Initial Call',
  lead_id: '1',
  lead_name: 'Arjun Mehta',
  lead_phone: '+91 98765 43210',
  lead_email: 'arjun@example.com',
  scheduled_at: '2026-06-06T10:30:00Z',
  priority: 'High',
  status: 'Pending',
  notes: 'Discuss pricing guidelines and present cloud subscriptions.'
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/sales/tasks/${id}`);
        setTask(res.data.data.task);
        setNotes(res.data.data.task.notes || '');
      } catch {
        setTask(MOCK_TASK_DETAIL);
        setNotes(MOCK_TASK_DETAIL.notes);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    const updatePayload = {
      status: newStatus,
      notes,
      completed_at: newStatus === 'Done' ? new Date().toISOString() : null
    };

    try {
      await api.patch(`/sales/tasks/${id}`, updatePayload);
      setTask({ ...task, status: newStatus, notes });
      alert(`Task marked as ${newStatus}!`);
      router.push('/sales/tasks');
    } catch {
      setTask({ ...task, status: newStatus, notes });
      alert(`Task marked as ${newStatus} locally!`);
      router.push('/sales/tasks');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => router.push('/sales/tasks')} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Task Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage task execution progress.</p>
        </div>
      </div>

      {/* Task Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Task Type: {task.type}</span>
            <h3 className="text-sm font-extrabold text-slate-800 mt-1">{task.title}</h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
            ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {task.priority} Priority
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-55 bg-slate-50 dark:bg-[#161616] p-3.5 rounded-xl">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Scheduled At</span>
            <span className="font-semibold text-slate-800">{new Date(task.scheduled_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Current Status</span>
            <span className={`font-bold uppercase ${task.status === 'Done' ? 'text-green-600' : 'text-amber-500'}`}>{task.status}</span>
          </div>
        </div>

        {/* Lead Details Card */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#1f1f1f]">
          <h4 className="font-bold text-slate-800">Associated Lead Info</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Name</span>
              <span onClick={() => router.push('/sales/leads')} className="font-semibold text-[#2563EB] hover:underline cursor-pointer">{task.lead_name || 'Not Assigned'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Phone</span>
              <span className="font-semibold text-slate-800">{task.lead_phone || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Email</span>
              <span className="font-semibold text-slate-800 break-all">{task.lead_email || 'Not Provided'}</span>
            </div>
          </div>
        </div>

        {/* Notes Form */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#1f1f1f]">
          <label className="font-bold text-slate-800 block">Task Notes & Outcome</label>
          <textarea
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 font-medium text-xs leading-relaxed"
            placeholder="Log details about completed task..."
          />
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
          <button
            onClick={() => handleUpdateStatus('Done')}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/10"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            Mark Completed
          </button>
          <button
            onClick={() => handleUpdateStatus('Missed')}
            className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-red-200"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            Cancel/Missed
          </button>
        </div>
      </div>

    </div>
  );
}
