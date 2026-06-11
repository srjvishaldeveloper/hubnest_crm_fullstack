'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, Loader2, RefreshCw, CheckCircle,
  X, Send, Pencil, XCircle, ChevronLeft, ChevronRight,
  Clock, LayoutList,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────

interface ScheduledCampaign {
  id: string | number;
  name: string;
  type: string;
  audience_count?: number;
  scheduled_at: string;
  status: string;
}

interface DraftCampaign {
  id: string | number;
  name: string;
  type: string;
}

// ─── Constants ────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  Email:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SMS:       'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  WhatsApp:  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Meta:      'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Push:      'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const STATUS_STYLES: Record<string, string> = {
  Scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Draft:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Paused:    'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ──────────────────────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Component ────────────────────────────────────────────────

export default function CampaignScheduler() {
  const [campaigns, setCampaigns]       = useState<ScheduledCampaign[]>([]);
  const [draftCampaigns, setDraftCampaigns] = useState<DraftCampaign[]>([]);
  const [loading, setLoading]           = useState(false);
  const [weekAnchor, setWeekAnchor]     = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [selectedDraft, setSelectedDraft] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [editingId, setEditingId]       = useState<string | number | null>(null);
  const [editDate, setEditDate]         = useState('');
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduledRes, draftRes] = await Promise.all([
        api.get('/campaigns', { params: { status: 'Scheduled' } }),
        api.get('/campaigns', { params: { status: 'Draft' } }),
      ]);
      setCampaigns(scheduledRes.data?.campaigns || scheduledRes.data?.data || []);
      setDraftCampaigns(draftRes.data?.campaigns || draftRes.data?.data || []);
    } catch {
      setCampaigns([]);
      setDraftCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const weekDays = getWeekDays(weekAnchor);

  const visibleCampaigns = selectedDay
    ? campaigns.filter(c => c.scheduled_at && sameDay(new Date(c.scheduled_at), selectedDay))
    : campaigns;

  const stats = {
    this_week: campaigns.filter(c => {
      if (!c.scheduled_at) return false;
      const d = new Date(c.scheduled_at);
      return weekDays.some(wd => sameDay(wd, d));
    }).length,
    today:     campaigns.filter(c => c.scheduled_at && sameDay(new Date(c.scheduled_at), new Date())).length,
    completed: campaigns.filter(c => c.status === 'Completed').length,
    paused:    campaigns.filter(c => c.status === 'Paused').length,
  };

  function hasCampaignsOnDay(day: Date) {
    return campaigns.some(c => c.scheduled_at && sameDay(new Date(c.scheduled_at), day));
  }

  async function handleStatusChange(id: string | number, status: string) {
    try {
      await api.patch(`/campaigns/${id}`, { status });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast(`Campaign updated to ${status}.`);
    } catch { showToast('Update failed.'); }
  }

  async function handleEditSchedule(id: string | number) {
    if (!editDate) return;
    setSaving(true);
    try {
      await api.patch(`/campaigns/${id}`, { scheduled_at: editDate });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, scheduled_at: editDate } : c));
      setEditingId(null);
      setEditDate('');
      showToast('Schedule updated.');
    } catch { showToast('Update failed.'); }
    finally { setSaving(false); }
  }

  async function handleScheduleNew() {
    if (!selectedDraft || !scheduleDate) return;
    setSaving(true);
    try {
      await api.patch(`/campaigns/${selectedDraft}`, { status: 'Scheduled', scheduled_at: scheduleDate });
      const draft = draftCampaigns.find(d => String(d.id) === selectedDraft);
      if (draft) {
        setCampaigns(prev => [{ ...draft, status: 'Scheduled', scheduled_at: scheduleDate }, ...prev]);
        setDraftCampaigns(prev => prev.filter(d => String(d.id) !== selectedDraft));
      }
      setShowModal(false);
      setSelectedDraft('');
      setScheduleDate('');
      showToast('Campaign scheduled.');
    } catch { showToast('Failed to schedule.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0e0e0e] p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 dark:bg-[#1f1f1f] text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Campaign Scheduler</h1>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Schedule and manage upcoming campaign sends</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCampaigns} className="p-2 rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-500 dark:text-[#a3a3a3] hover:text-blue-600 transition">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
            <Plus size={13} /> Schedule New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {[
          { label: 'Scheduled This Week', value: stats.this_week, color: 'text-blue-600' },
          { label: 'Sending Today',       value: stats.today,     color: 'text-emerald-600' },
          { label: 'Completed This Week', value: stats.completed, color: 'text-slate-600 dark:text-[#a3a3a3]' },
          { label: 'Paused',              value: stats.paused,    color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? '–' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Week Strip */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-[#ededed]">
              {weekDays[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate() - 7); setWeekAnchor(d); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400 transition">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setWeekAnchor(new Date())}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-[#252525] text-slate-600 dark:text-[#a3a3a3] hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition">
              Today
            </button>
            <button onClick={() => { const d = new Date(weekAnchor); d.setDate(d.getDate() + 7); setWeekAnchor(d); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400 transition">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isToday   = sameDay(day, new Date());
            const isSelected = selectedDay && sameDay(day, selectedDay);
            const hasCamp   = hasCampaignsOnDay(day);
            return (
              <button key={i} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`flex flex-col items-center py-3 rounded-xl transition ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a] text-slate-600 dark:text-[#a3a3a3]'}`}>
                <span className="text-[10px] font-semibold uppercase tracking-wide">{DAY_NAMES[i]}</span>
                <span className="text-base font-bold mt-0.5">{day.getDate()}</span>
                <div className="mt-1.5 h-1.5">
                  {hasCamp && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                </div>
              </button>
            );
          })}
        </div>
        {selectedDay && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-[#1f1f1f] pt-2">
            <span className="text-xs text-slate-500 dark:text-[#a3a3a3]">
              Showing campaigns for <span className="font-bold text-slate-900 dark:text-[#ededed]">{selectedDay.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition">
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Campaign List */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-[#1f1f1f]">
          <LayoutList size={13} className="text-slate-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-[#ededed]">Scheduled Campaigns</h2>
          <span className="ml-auto text-[10px] text-slate-400 dark:text-[#a3a3a3]">{visibleCampaigns.length} campaigns</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                {['Campaign', 'Type', 'Audience', 'Scheduled At', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-blue-500" />
                </td></tr>
              ) : visibleCampaigns.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <Clock size={32} className="mx-auto text-slate-300 dark:text-[#333] mb-3" />
                  <p className="text-slate-400 dark:text-[#a3a3a3] font-semibold">Nothing scheduled{selectedDay ? ' for this day' : ''}</p>
                  <p className="text-slate-400 dark:text-[#a3a3a3] text-[10px] mt-1">Use "Schedule New Campaign" to add one.</p>
                </td></tr>
              ) : visibleCampaigns.map(c => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-[#1a1a1a] hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a] transition">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-[#ededed]">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${TYPE_STYLES[c.type] || 'bg-slate-100 text-slate-500'}`}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">{c.audience_count ? c.audience_count.toLocaleString() : '–'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#a3a3a3]">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)}
                          className="px-2 py-1 text-[10px] rounded-lg border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500" />
                        <button onClick={() => handleEditSchedule(c.id)} disabled={saving}
                          className="p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60">
                          {saving ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditDate(''); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <span>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '–'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditingId(c.id); setEditDate(c.scheduled_at || ''); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition" title="Edit Schedule">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleStatusChange(c.id, 'Draft')}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition" title="Cancel (set to Draft)">
                        <XCircle size={12} />
                      </button>
                      <button onClick={() => handleStatusChange(c.id, 'Active')}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition" title="Send Now">
                        <Send size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule New Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed]">Schedule a Campaign</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-400 transition">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Select Draft Campaign <span className="text-red-500">*</span></label>
                <select value={selectedDraft} onChange={e => setSelectedDraft(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold">
                  <option value="">Choose a draft campaign…</option>
                  {draftCampaigns.map(d => (
                    <option key={d.id} value={String(d.id)}>{d.name} ({d.type})</option>
                  ))}
                </select>
                {draftCampaigns.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3] mt-1">No draft campaigns available. Create one first.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5 block">Schedule Date & Time <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#333] text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#252525] transition">
                Cancel
              </button>
              <button onClick={handleScheduleNew} disabled={saving || !selectedDraft || !scheduleDate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={12} className="animate-spin" />} Schedule Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
