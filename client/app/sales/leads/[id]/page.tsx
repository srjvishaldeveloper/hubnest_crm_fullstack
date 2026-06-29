'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import {
  Phone, Mail, MessageSquare, Activity, Send, ArrowLeft, Sparkles,
  Clock, MapPin, Building2, User2, Calendar, CheckCircle2, XCircle,
  AlertTriangle, BadgeCheck, Edit3, Save, X, Plus, ChevronDown,
  ChevronUp, Target, Zap, TrendingUp, Star, Globe, Hash, FileText,
  RefreshCw, Trash2, Bell, Check, PhoneCall, PhoneOff, MailOpen,
  Users, BarChart2, Link2, Copy, ExternalLink, Mic, MicOff, Volume2, VolumeX, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  source?: string;
  platform?: string;
  status: string;
  priority: string;
  notes?: string;
  next_followup?: string;
  conversion_probability?: number;
  quality_score?: number;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  outcome?: string;
  notes?: string;
  duration_seconds?: number;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700 border-blue-200',
  Contacted: 'bg-purple-100 text-purple-700 border-purple-200',
  Interested: 'bg-amber-100 text-amber-700 border-amber-200',
  'Not Interested': 'bg-slate-100 text-slate-500 border-slate-200',
  Converted: 'bg-green-100 text-green-700 border-green-200',
  Lost: 'bg-red-100 text-red-500 border-red-200',
};
const PRIORITY_COLORS: Record<string, string> = {
  Hot: 'bg-red-100 text-red-700 border-red-200',
  Warm: 'bg-orange-100 text-orange-700 border-orange-200',
  Cold: 'bg-sky-100 text-sky-700 border-sky-200',
};
const OUTCOME_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  Connected: { icon: PhoneCall, color: 'text-green-500' },
  'Not Reachable': { icon: PhoneOff, color: 'text-red-400' },
  Voicemail: { icon: PhoneOff, color: 'text-amber-400' },
  Interested: { icon: Star, color: 'text-amber-500' },
  'Not Interested': { icon: XCircle, color: 'text-slate-400' },
  Converted: { icon: BadgeCheck, color: 'text-green-600' },
  Opened: { icon: MailOpen, color: 'text-blue-500' },
  Clicked: { icon: Link2, color: 'text-indigo-500' },
  Completed: { icon: CheckCircle2, color: 'text-teal-500' },
};
const ACTIVITY_ICONS: Record<string, { icon: typeof Phone; bg: string; text: string }> = {
  Call: { icon: Phone, bg: 'bg-blue-100', text: 'text-blue-600' },
  Email: { icon: Mail, bg: 'bg-green-100', text: 'text-green-600' },
  WhatsApp: { icon: MessageSquare, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  Meeting: { icon: Users, bg: 'bg-purple-100', text: 'text-purple-600' },
  Note: { icon: FileText, bg: 'bg-amber-100', text: 'text-amber-600' },
  SMS: { icon: MessageSquare, bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtDuration(secs?: number) {
  if (!secs) return '';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  return `${m}m ${secs % 60}s`;
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white
        ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
      {type === 'success' ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100" /></button>
    </motion.div>
  );
}

// ─── Calling Modal Component ───────────────────────────────────────────────────
function CallingModal({
  lead, onClose, onLogActivity
}: { lead: Lead; onClose: () => void; onLogActivity: (act: {type:string;outcome:string;notes:string;duration_seconds:number}) => void }) {
  const [activeTab, setActiveTab] = useState<'cloud' | 'direct' | 'whatsapp' | 'ai'>('cloud');
  
  // Cloud calling state
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callNotes, setCallNotes] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const startCloudCall = () => {
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 3000);
  };

  const endCloudCall = () => {
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    onLogActivity({
      type: 'Call',
      outcome: callOutcome,
      notes: callNotes || `Cloud Call with ${lead.name}. Duration: ${Math.round(callDuration)}s`,
      duration_seconds: callDuration
    });
    onClose();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.95,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)'}} className="p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-white/20 rounded-xl"><PhoneCall className="w-5 h-5 text-white"/></span>
              <h3 className="text-lg font-extrabold">Calling & Communication Hub</h3>
            </div>
            <p className="text-xs text-blue-200">Connect with {lead.name} · {lead.company || 'Private Lead'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1 text-xs font-extrabold">
          {[
            { id: 'cloud', label: '☁️ Cloud Calling (Beta)', desc: 'Integrated VoIP Dial' },
            { id: 'direct', label: '📱 Direct Dial (tel)', desc: 'Standard Cell Phone' },
            { id: 'whatsapp', label: '💬 WhatsApp Call', desc: 'Direct chat & audio' },
            { id: 'ai', label: '🤖 AI Call Script', desc: 'Smart talking points' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-2 rounded-2xl transition flex flex-col items-center justify-center gap-1 ${
                activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}>
              <span className="text-xs font-bold">{tab.label}</span>
              <span className="text-[10px] font-medium text-slate-400">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-xs space-y-4">
          
          {/* 1. Cloud Calling */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center max-w-md mx-auto shadow-inner relative overflow-hidden">
                <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5"/> VoIP Secure Route
                </div>
                <div className="absolute top-3 right-3 text-[10px] font-bold text-slate-400">
                  Line: +1 (800) CRM-CLOUD
                </div>

                {/* Avatar / Status */}
                <div className="my-6 flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white mb-4 relative shadow-lg ${
                    callState === 'calling' ? 'bg-amber-500 animate-pulse' : callState === 'connected' ? 'bg-emerald-500' : callState === 'ended' ? 'bg-slate-400' : 'bg-blue-600'
                  }`}>
                    {lead.name.charAt(0)}
                    {callState === 'calling' && (
                      <span className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping opacity-75"/>
                    )}
                    {callState === 'connected' && (
                      <span className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-pulse opacity-50"/>
                    )}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-800">{lead.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{lead.phone || 'No phone number saved'}</p>
                  
                  {/* Call State Badge / Timer */}
                  <div className="mt-4">
                    {callState === 'idle' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full">
                        Ready to Call
                      </span>
                    )}
                    {callState === 'calling' && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                        <PhoneCall className="w-3.5 h-3.5 animate-bounce"/> Calling via Cloud Dialer...
                      </span>
                    )}
                    {callState === 'connected' && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/> Connected
                        </span>
                        <span className="text-xl font-black text-slate-800 tracking-wider mt-1">{formatTimer(callDuration)}</span>
                      </div>
                    )}
                    {callState === 'ended' && (
                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                        Call Ended ({formatTimer(callDuration)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Call Action Controls */}
                {callState !== 'ended' && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200/60">
                    {callState === 'idle' ? (
                      <button onClick={startCloudCall} disabled={!lead.phone}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition disabled:opacity-40">
                        <PhoneCall className="w-5 h-5"/> Start Cloud Call
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setIsMuted(!isMuted)}
                          className={`p-4 rounded-2xl border transition shadow-sm ${isMuted ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {isMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                        </button>
                        <button onClick={endCloudCall}
                          className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/20 hover:shadow-xl hover:-translate-y-0.5 transition">
                          <PhoneOff className="w-5 h-5"/> End Call
                        </button>
                        <button onClick={() => setIsSpeaker(!isSpeaker)}
                          className={`p-4 rounded-2xl border transition shadow-sm ${isSpeaker ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {isSpeaker ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Post Call Logging Form */}
              {callState === 'ended' && (
                <motion.form initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} onSubmit={handleLogCall}
                  className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-4 max-w-md mx-auto">
                  <h5 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600"/> Log Call Outcome
                  </h5>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Call Outcome</label>
                    <select value={callOutcome} onChange={e => setCallOutcome(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500">
                      {['Connected','No Answer','Interested','Not Interested','Callback Requested','Voicemail'].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discussion Notes</label>
                    <textarea rows={3} value={callNotes} onChange={e => setCallNotes(e.target.value)}
                      placeholder="Details discussed during the call..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500"/>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCallState('idle')}
                      className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Call Again</button>
                    <button type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition">Save Activity Log</button>
                  </div>
                </motion.form>
              )}
            </div>
          )}

          {/* 2. Direct Dial (tel) */}
          {activeTab === 'direct' && (
            <div className="space-y-6 py-4 max-w-lg mx-auto text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Phone className="w-8 h-8"/>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">Standard Cellular Dialing</h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Clicking below will invoke your device's default phone dialer or softphone application (like Cisco Jabber, Skype, or mobile phone app).
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <span className="text-slate-400 font-bold text-xs">Destination Number:</span>
                <span className="text-base font-extrabold text-slate-800">{lead.phone || 'No phone provided'}</span>
              </div>
              <button onClick={() => { if (lead.phone) window.open(`tel:${lead.phone}`); }} disabled={!lead.phone}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40">
                Launch Device Dialer ({lead.phone})
              </button>
            </div>
          )}

          {/* 3. WhatsApp Call / Message */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 py-4 max-w-lg mx-auto text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <MessageSquare className="w-8 h-8"/>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">WhatsApp Direct Communication</h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Start an instant chat or WhatsApp audio call without saving the number to your phone contacts.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <span className="text-slate-400 font-bold text-xs">WhatsApp Number:</span>
                <span className="text-base font-extrabold text-slate-800">{lead.phone || 'No phone provided'}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {
                  const p = (lead.phone || '').replace(/\D/g, '');
                  window.open(`https://wa.me/${p}`, '_blank');
                }} disabled={!lead.phone}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5"/> Launch WhatsApp Chat
                </button>
              </div>
            </div>
          )}

          {/* 4. AI Call Script */}
          {activeTab === 'ai' && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm shrink-0">
                  <Sparkles className="w-6 h-6"/>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">AI Generated Call Pitch & Guide</h4>
                  <p className="text-blue-700 text-xs mt-0.5">Customized for {lead.name} ({lead.priority} Priority)</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">1. Icebreaker & Introduction</span>
                  <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl font-medium text-slate-800 italic leading-relaxed text-xs">
                    "Hi {lead.name}, I hope you're having a great week! This is your dedicated rep from Hubnest CRM. I noticed your interest in our premium solutions and wanted to share a quick 2-minute insight on how companies similar to {lead.company || 'yours'} are scaling their conversion rates by over 40%."
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">2. Key Talking Points ({lead.source || 'Direct Enquiry'})</span>
                  <ul className="space-y-2 text-slate-700 text-xs font-medium pl-4 list-disc">
                    <li>Mention their specific lead source ({lead.source || 'your inquiry'}) to establish immediate context.</li>
                    <li>Highlight our fullstack automation features and zero-latency communication tools.</li>
                    <li>Verify their timeline and current primary bottleneck.</li>
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">3. Overcoming Objections</span>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="font-bold text-amber-900 text-[11px]">"We don't have budget right now"</p>
                      <p className="text-[10px] text-amber-800 mt-1">Pitch our flexible pricing tiers and calculate the instant ROI on payroll & time saved.</p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="font-bold text-purple-900 text-[11px]">"Send me an email instead"</p>
                      <p className="text-[10px] text-purple-800 mt-1">Agree immediately, but ask for 30 seconds to confirm exactly which brochure modules to include.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => {
                  navigator.clipboard.writeText(`Call Pitch for ${lead.name}:\nHi ${lead.name}, I hope you're having a great week...`);
                  alert('AI Script copied to clipboard!');
                }} className="px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition">Copy Script</button>
                <button onClick={() => setActiveTab('cloud')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm">Proceed to Cloud Call</button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ─── Log Activity Modal ────────────────────────────────────────────────────────
function LogActivityModal({
  lead, onClose, onLogged
}: { lead: Lead; onClose: () => void; onLogged: () => void }) {
  const [type, setType] = useState('Call');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const OUTCOMES: Record<string, string[]> = {
    Call: ['Connected', 'Not Reachable', 'Voicemail', 'Interested', 'Not Interested', 'Converted'],
    Email: ['Sent', 'Opened', 'Clicked', 'Replied'],
    WhatsApp: ['Sent', 'Delivered', 'Read', 'Replied'],
    Meeting: ['Completed', 'No Show', 'Rescheduled'],
    Note: ['General'],
    SMS: ['Sent', 'Delivered'],
  };

  async function submit() {
    if (!outcome) return;
    setLoading(true);
    try {
      await api.post('/sales/activities', {
        lead_id: lead.id,
        type,
        outcome,
        notes: notes || undefined,
        duration_seconds: duration ? Number(duration) * 60 : undefined,
        follow_up_date: followUpDate || undefined,
      });
      onLogged();
      onClose();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}>
          <div>
            <h3 className="text-base font-bold text-white">Log Activity</h3>
            <p className="text-xs text-blue-200">{lead.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Activity Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(ACTIVITY_ICONS).map(t => (
                <button key={t} onClick={() => { setType(t); setOutcome(''); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition
                    ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {/* Outcome */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Outcome *</label>
            <div className="flex flex-wrap gap-2">
              {(OUTCOMES[type] || []).map(o => (
                <button key={o} onClick={() => setOutcome(o)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition
                    ${outcome === o ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          {type === 'Call' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Duration (minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 5"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was discussed?"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Schedule Follow-up</label>
            <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
          </div>
          <button onClick={submit} disabled={!outcome || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Activity className="w-4 h-4" />}
            Log Activity
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function LeadDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [callingLead, setCallingLead] = useState<Lead | null>(null);

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editFollowup, setEditFollowup] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editProb, setEditProb] = useState(50);
  const [saveLoading, setSaveLoading] = useState(false);

  // add note
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [showNoteBox, setShowNoteBox] = useState(false);

  // activity filter
  const [actFilter, setActFilter] = useState('All');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') =>
    setToast({ msg, type });

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sales/leads/${id}`);
      const l: Lead = res.data.data?.lead || res.data.lead;
      setLead(l);
      setEditStatus(l.status);
      setEditPriority(l.priority);
      setEditFollowup(l.next_followup?.slice(0, 16) || '');
      setEditNotes(l.notes || '');
      setEditProb(l.conversion_probability || 50);
    } catch {
      showToast('Failed to load lead details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivities = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await api.get(`/sales/leads/${id}/activity`);
      setActivities(res.data.data?.activities || res.data.activities || []);
    } catch {
      setActivities([]);
    } finally {
      setActLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchActivities();
    }
  }, [id, fetchLead, fetchActivities]);

  async function handleSave() {
    if (!lead) return;
    setSaveLoading(true);
    try {
      await api.patch(`/sales/leads/${id}`, {
        status: editStatus,
        priority: editPriority,
        next_followup: editFollowup || null,
        notes: editNotes || null,
        conversion_probability: editProb,
      });
      showToast('Lead updated successfully', 'success');
      setEditMode(false);
      fetchLead();
    } catch {
      showToast('Failed to update lead', 'error');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      await api.post('/sales/activities', {
        lead_id: id,
        type: 'Note',
        outcome: 'General',
        notes: newNote.trim(),
      });
      setNewNote('');
      setShowNoteBox(false);
      showToast('Note added', 'success');
      fetchActivities();
    } catch {
      showToast('Failed to add note', 'error');
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await api.patch(`/sales/leads/${id}`, { status });
      showToast(`Status changed to ${status}`, 'success');
      fetchLead();
    } catch {
      showToast('Failed to update status', 'error');
    }
  }

  async function handleScheduleFollowUp(date: string) {
    try {
      await api.patch(`/sales/leads/${id}`, { next_followup: date });
      showToast('Follow-up scheduled', 'success');
      fetchLead();
    } catch {
      showToast('Failed to schedule follow-up', 'error');
    }
  }

  const handleLogActivitySubmit = async (formData: {type:string;outcome:string;notes:string;duration_seconds:number}) => {
    if (!lead) return;
    try {
      await api.post('/sales/activities', { lead_id: lead.id, ...formData });
      fetchActivities();
      showToast('Activity logged successfully', 'success');
    } catch {
      showToast('Failed to log activity', 'error');
    }
  };

  const filteredActivities = actFilter === 'All'
    ? activities
    : activities.filter(a => a.type === actFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-lg">Lead not found</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOverdue = lead.next_followup && new Date(lead.next_followup) < new Date();
  const activityTypes = ['All', ...Array.from(new Set(activities.map(a => a.type)))];

  const callCount = activities.filter(a => a.type === 'Call').length;
  const emailCount = activities.filter(a => a.type === 'Email').length;
  const connectedCount = activities.filter(a => ['Connected', 'Interested', 'Converted', 'Completed', 'Opened'].includes(a.outcome || '')).length;
  const responseRate = activities.length ? Math.round((connectedCount / activities.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
      
      {/* Log Activity Modal */}
      {isLogOpen && (
        <LogActivityModal
          lead={lead}
          onClose={() => setIsLogOpen(false)}
          onLogged={() => { fetchActivities(); fetchLead(); showToast('Activity logged', 'success'); }}
        />
      )}

      {/* Calling Modal */}
      <AnimatePresence>
        {callingLead && (
          <CallingModal
            lead={callingLead}
            onClose={() => setCallingLead(null)}
            onLogActivity={handleLogActivitySubmit}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3 border-b border-slate-200"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">{lead.name}</h1>
          <p className="text-xs text-blue-200 truncate">{lead.company || 'No company'} · Added {fmtDate(lead.created_at)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${PRIORITY_COLORS[lead.priority] || 'bg-white/10 text-white border-white/20'}`}>
            {lead.priority === 'Hot' ? '🔥 Hot' : lead.priority}
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${STATUS_COLORS[lead.status] || 'bg-white/10 text-white border-white/20'}`}>
            {lead.status}
          </span>
        </div>
        <button onClick={() => { fetchLead(); fetchActivities(); }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            {
              label: 'Call Hub', icon: Phone, color: 'from-blue-500 to-blue-600',
              action: () => setCallingLead(lead)
            },
            {
              label: 'WhatsApp', icon: MessageSquare, color: 'from-emerald-500 to-green-600',
              action: () => {
                if (!lead.phone) return showToast('No phone number', 'info');
                const p = lead.phone.replace(/\D/g, '');
                const m = encodeURIComponent(`Hi ${lead.name}, following up on your enquiry. Are you available for a quick call?`);
                window.open(`https://wa.me/${p}?text=${m}`, '_blank');
              }
            },
            {
              label: 'Email', icon: Mail, color: 'from-purple-500 to-violet-600',
              action: () => { if (lead.email) window.open(`mailto:${lead.email}`); else showToast('No email address', 'info'); }
            },
            {
              label: 'Log', icon: Activity, color: 'from-amber-500 to-orange-600',
              action: () => setIsLogOpen(true)
            },
            {
              label: 'Note', icon: FileText, color: 'from-teal-500 to-cyan-600',
              action: () => setShowNoteBox(v => !v)
            },
          ].map((btn, i) => (
            <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={btn.action}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-white bg-gradient-to-br ${btn.color} shadow-sm hover:shadow-md transition`}>
              <btn.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase">{btn.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Add Note Box */}
        <AnimatePresence>
          {showNoteBox && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm overflow-hidden">
              <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Add Note
              </p>
              <textarea rows={3} value={newNote} onChange={e => setNewNote(e.target.value)}
                placeholder="Type your note here..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-blue-500 transition" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleAddNote} disabled={!newNote.trim() || noteLoading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1">
                  {noteLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Note
                </button>
                <button onClick={() => setShowNoteBox(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Calls', value: callCount, icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Emails', value: emailCount, icon: Mail, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Activities', value: activities.length, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Response %', value: `${responseRate}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-1`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span className={`text-lg font-extrabold ${color}`}>{value}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column — Lead Info */}
          <div className="lg:col-span-2 space-y-4">

            {/* Basic Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User2 className="w-4 h-4 text-blue-600" /> Basic Information
                </h2>
                <button onClick={() => setEditMode(v => !v)}
                  className={`p-2 rounded-xl text-sm transition ${editMode ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
                    <span className="text-sm font-bold text-slate-800">{lead.name}</span>
                  </div>
                  {/* Phone */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</span>
                    {lead.phone ? (
                      <button onClick={() => setCallingLead(lead)} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />{lead.phone}
                      </button>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </div>
                  {/* Email */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-sm font-semibold text-purple-600 hover:underline flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{lead.email}</span>
                      </a>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </div>
                  {/* Company */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company</span>
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />{lead.company || '—'}
                    </span>
                  </div>
                  {/* Location */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location</span>
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />{lead.location || '—'}
                    </span>
                  </div>
                  {/* Source */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Source</span>
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" />{lead.source || 'Manual'}
                    </span>
                  </div>
                  {/* Platform */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Platform</span>
                    <span className="text-sm font-semibold text-slate-700">{lead.platform || '—'}</span>
                  </div>
                  {/* Added */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Added On</span>
                    <span className="text-sm font-semibold text-slate-700">{fmtDate(lead.created_at)}</span>
                  </div>
                  {/* Updated */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Last Updated</span>
                    <span className="text-sm font-semibold text-slate-700">{fmtDate(lead.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Status + Priority — editable */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" /> Lead Status & Priority
                </h2>
                {editMode && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={saveLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-60">
                      {saveLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button onClick={() => setEditMode(false)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                {/* Status buttons (quick change) */}
                {!editMode ? (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Status</p>
                    <div className="flex flex-wrap gap-2">
                      {['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'].map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition
                            ${lead.status === s ? STATUS_COLORS[s] + ' border-current' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                        {['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'].map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                      <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                        {['Hot', 'Warm', 'Cold'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Win Probability */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">Win Probability</span>
                    <span className={`text-sm font-extrabold ${editProb >= 70 ? 'text-green-600' : editProb >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {editProb}%
                    </span>
                  </div>
                  <input type="range" min={0} max={100} value={editProb} onChange={e => setEditProb(Number(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-full rounded-full transition-all ${editProb >= 70 ? 'bg-green-500' : editProb >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${editProb}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>Low</span><span>Medium</span><span>High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Comments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Notes & Comments
                </h2>
                <button onClick={() => setShowNoteBox(v => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                  <Plus className="w-3 h-3" /> Add Note
                </button>
              </div>
              <div className="p-5 space-y-3">
                {/* existing notes field */}
                {editMode ? (
                  <textarea rows={4} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-blue-500 transition" />
                ) : lead.notes ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No notes yet. Add a note to track important details.</p>
                )}

                {/* Notes from activities */}
                {activities.filter(a => a.type === 'Note' && a.notes).map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Note · {timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{a.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" /> Activity History
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{activities.length}</span>
                </h2>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {activityTypes.map(t => (
                    <button key={t} onClick={() => setActFilter(t)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition
                        ${actFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-5">
                {actLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">No activities yet</p>
                    <button onClick={() => setIsLogOpen(true)}
                      className="mt-3 text-xs font-bold text-blue-600 hover:underline">
                      Log first activity →
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />
                    <div className="space-y-4">
                      {filteredActivities.map((act, i) => {
                        const info = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.Note;
                        const outcomeInfo = OUTCOME_ICONS[act.outcome || ''];
                        return (
                          <motion.div key={act.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="relative flex gap-4 pl-2">
                            <div className={`relative z-10 w-10 h-10 rounded-full ${info.bg} flex items-center justify-center shrink-0 border-2 border-white shadow-sm`}>
                              <info.icon className={`w-4 h-4 ${info.text}`} />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800">{act.type}</span>
                                  {act.outcome && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-slate-200 flex items-center gap-1 ${outcomeInfo?.color || 'text-slate-500'}`}>
                                      {outcomeInfo && <outcomeInfo.icon className="w-2.5 h-2.5" />}
                                      {act.outcome}
                                    </span>
                                  )}
                                  {act.duration_seconds ? (
                                    <span className="text-[9px] text-slate-400 font-semibold">
                                      {fmtDuration(act.duration_seconds)}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">{timeAgo(act.created_at)}</span>
                              </div>
                              {act.notes && (
                                <p className="text-xs text-slate-600 leading-relaxed">{act.notes}</p>
                              )}
                              <p className="text-[9px] text-slate-400 mt-1">{fmtDateTime(act.created_at)}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column — AI + Follow-up + Actions */}
          <div className="space-y-4">

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-lg text-white">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" /> AI Insights
              </h3>
              <div className="space-y-3">
                {/* Win probability */}
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-blue-100">Conversion Probability</span>
                    <span className={`text-sm font-extrabold ${editProb >= 70 ? 'text-green-300' : editProb >= 40 ? 'text-amber-300' : 'text-red-300'}`}>
                      {editProb}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${editProb >= 70 ? 'bg-green-400' : editProb >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${editProb}%` }} />
                  </div>
                </div>

                {/* Best time to call */}
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Best Time to Call</p>
                  <p className="text-xs font-semibold">Today 4:00 PM – 6:00 PM</p>
                </div>

                {/* Lead score */}
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Lead Score</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.ceil((lead.quality_score || editProb) / 20) ? 'text-amber-300 fill-amber-300' : 'text-white/20'}`} />
                    ))}
                    <span className="text-xs font-bold ml-1">{lead.quality_score || editProb}/100</span>
                  </div>
                </div>

                {/* Next best action */}
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Next Best Action</p>
                  <p className="text-xs font-semibold">
                    {lead.status === 'New' ? 'Make initial contact call'
                      : lead.status === 'Contacted' ? 'Send follow-up email with brochure'
                        : lead.status === 'Interested' ? 'Schedule a demo or meeting'
                          : lead.status === 'Converted' ? 'Onboard and upsell'
                            : 'Nurture with content'}
                  </p>
                </div>

                {/* Response rate */}
                <div className="bg-white/10 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Response Rate</p>
                  <p className="text-sm font-extrabold">{responseRate}%
                    <span className="text-[10px] font-normal text-blue-200 ml-1">({connectedCount}/{activities.length} attempts)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-up Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" /> Follow-up
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Current follow-up */}
                {lead.next_followup ? (
                  <div className={`p-3 rounded-xl border flex items-start gap-2 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                        {isOverdue ? 'Overdue!' : 'Scheduled'}
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">{fmtDateTime(lead.next_followup)}</p>
                    </div>
                    <button onClick={() => handleScheduleFollowUp('')}
                      className="p-1 hover:bg-white/60 rounded-lg text-slate-400 hover:text-red-500 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No follow-up scheduled</p>
                )}

                {/* Quick follow-up buttons */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Schedule</p>
                  {[
                    { label: 'In 1 Hour', offset: 60 * 60 * 1000 },
                    { label: 'Tomorrow 10 AM', offset: null, custom: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString(); } },
                    { label: 'In 3 Days', offset: 3 * 24 * 60 * 60 * 1000 },
                    { label: 'Next Week', offset: 7 * 24 * 60 * 60 * 1000 },
                  ].map((opt) => (
                    <button key={opt.label}
                      onClick={() => {
                        const date = opt.custom
                          ? opt.custom()
                          : new Date(Date.now() + (opt.offset || 0)).toISOString();
                        handleScheduleFollowUp(date);
                      }}
                      className="w-full py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition text-left px-3 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {opt.label}
                    </button>
                  ))}
                  {/* Custom datetime */}
                  <div>
                    <input type="datetime-local" value={editFollowup} onChange={e => setEditFollowup(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition" />
                    <button onClick={() => handleScheduleFollowUp(editFollowup)}
                      disabled={!editFollowup}
                      className="w-full mt-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition">
                      Set Custom Follow-up
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* More Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> More Actions
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <button onClick={() => setCallingLead(lead)}
                  className="w-full py-2.5 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition flex items-center gap-2 px-3">
                  <PhoneCall className="w-3.5 h-3.5" /> Launch Calling Hub
                </button>
                <button onClick={() => {
                  if (!lead.phone) return showToast('No phone number', 'info');
                  const p = lead.phone.replace(/\D/g, '');
                  const m = encodeURIComponent(`Hi ${lead.name}, this is a follow-up message. Please let us know if you're interested.`);
                  window.open(`https://wa.me/${p}?text=${m}`, '_blank');
                }}
                  className="w-full py-2.5 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-50 transition flex items-center gap-2 px-3">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Message
                </button>
                <button onClick={() => {
                  if (!lead.email) return showToast('No email address', 'info');
                  window.open(`mailto:${lead.email}?subject=Follow-up: ${lead.name}&body=Hi ${lead.name},%0D%0A%0D%0AThis is a follow-up regarding your enquiry.%0D%0A%0D%0ABest regards`, '_blank');
                }}
                  className="w-full py-2.5 border border-purple-200 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-50 transition flex items-center gap-2 px-3">
                  <Mail className="w-3.5 h-3.5" /> Send Email
                </button>
                <button onClick={() => {
                  const text = `Lead: ${lead.name}\nPhone: ${lead.phone || '—'}\nEmail: ${lead.email || '—'}\nStatus: ${lead.status}\nPriority: ${lead.priority}`;
                  navigator.clipboard?.writeText(text);
                  showToast('Lead info copied!', 'success');
                }}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition flex items-center gap-2 px-3">
                  <Copy className="w-3.5 h-3.5" /> Copy Lead Info
                </button>
                <button onClick={() => router.push(`/sales/tasks?lead_id=${lead.id}`)}
                  className="w-full py-2.5 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition flex items-center gap-2 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Create Task for Lead
                </button>
                <button
                  onClick={() => {
                    if (confirm('Mark this lead as converted?')) handleStatusChange('Converted');
                  }}
                  className="w-full py-2.5 border border-green-200 text-green-700 font-bold text-xs rounded-xl hover:bg-green-50 transition flex items-center gap-2 px-3">
                  <BadgeCheck className="w-3.5 h-3.5" /> Mark as Converted
                </button>
                <button
                  onClick={() => {
                    if (confirm('Mark this lead as lost?')) handleStatusChange('Lost');
                  }}
                  className="w-full py-2.5 border border-red-200 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 transition flex items-center gap-2 px-3">
                  <XCircle className="w-3.5 h-3.5" /> Mark as Lost
                </button>
              </div>
            </div>

            {/* Lead Source Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-teal-600" /> Lead Source Info
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Source', value: lead.source || 'Manual' },
                  { label: 'Platform', value: lead.platform || '—' },
                  { label: 'Quality Score', value: lead.quality_score ? `${lead.quality_score}/100` : '—' },
                  { label: 'ID', value: `#${lead.id?.slice(-6)}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{label}</span>
                    <span className="text-xs font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          <button onClick={() => router.push('/sales/leads')}
            className="py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> All Leads
          </button>
          <button onClick={() => setIsLogOpen(true)}
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition">
            <Activity className="w-3.5 h-3.5" /> Log Activity
          </button>
          <button onClick={() => router.push('/sales/tasks')}
            className="py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition">
            Tasks <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
