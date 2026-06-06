'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Edit2, Save, X, Shield, Target, TrendingUp,
  Users, Award, ChevronRight, Star, BarChart3, Activity, Calendar, Clock,
  MessageSquare, AlertCircle, CheckCircle, Monitor, ArrowLeft, Building2,
  PhoneCall, Send, UserCheck, FileText, PlusCircle, Tag, Globe, Zap,
  MoreVertical, ClipboardList, RotateCcw, Hash, MicOff, Volume2,
} from 'lucide-react';
import { smGetLead, smAssignLead, smGetTeam, smUpdateLead } from '../../../../services/salesManagerService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: string;
  priority: string;
  value: string;
  source: string;
  campaign: string;
  assignedTo: string;
  assignedToId: string;
  createdAt: string;
  lastActivity: string;
  website: string;
  address: string;
  industry: string;
  employees: string;
  conversionProbability: number;
  notes: { id: string; text: string; author: string; createdAt: string }[];
  activities: { id: string; type: string; outcome: string; date: string; notes: string; author: string }[];
  assignmentHistory: { id: string; from: string; to: string; date: string; reason: string }[];
  gender?: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  performance: { leadsHandled: number; conversionRate: number };
}

type ActiveTab = 'info' | 'activity' | 'notes' | 'history';

// ─── Mock Data ───────────────────────────────────────────────────────────────
function buildMockLead(id: string): Lead {
  return {
    id,
    name: 'Karthik Subramaniam',
    company: 'TechVista Solutions',
    email: 'karthik.subramaniam@techvista.com',
    phone: '+91 98765 12340',
    stage: 'Proposal',
    priority: 'High',
    value: '₹14.5L',
    source: 'LinkedIn',
    campaign: 'Q2 Enterprise Drive',
    assignedTo: 'Arun Menon',
    assignedToId: 'user-001',
    createdAt: '12 Apr 2026',
    lastActivity: '05 Jun 2026, 11:30',
    website: 'https://techvista.com',
    address: '14th Floor, DLF Cybercity, Gurugram, Haryana 122002',
    industry: 'Information Technology',
    employees: '200–500',
    conversionProbability: 72,
    notes: [
      { id: 'n1', text: 'Client is very interested in the enterprise pricing plan. Needs a custom demo with their CTO.', author: 'Arun Menon', createdAt: '04 Jun 2026, 15:20' },
      { id: 'n2', text: 'Budget approval is pending from their finance team. Expected by 10th June.', author: 'Arun Menon', createdAt: '02 Jun 2026, 10:45' },
      { id: 'n3', text: 'Initial discovery call went well. They currently use Salesforce but are looking to migrate.', author: 'Rajesh Kumar', createdAt: '18 Apr 2026, 09:00' },
    ],
    activities: [
      { id: 'a1', type: 'Meeting', outcome: 'Positive', date: '05 Jun 2026, 11:00', notes: 'Product demo conducted with CTO and VP Sales. Very positive response.', author: 'Arun Menon' },
      { id: 'a2', type: 'Email', outcome: 'Replied', date: '03 Jun 2026, 14:30', notes: 'Sent detailed proposal document with pricing tiers. Client replied asking for custom enterprise quote.', author: 'Arun Menon' },
      { id: 'a3', type: 'Call', outcome: 'Connected', date: '30 May 2026, 10:15', notes: 'Follow-up call. Client confirmed interest. Requested meeting with technical team.', author: 'Arun Menon' },
      { id: 'a4', type: 'Call', outcome: 'No Answer', date: '24 May 2026, 16:00', notes: 'Attempted to reach for follow-up. Left voicemail.', author: 'Deepa Krishnan' },
      { id: 'a5', type: 'Email', outcome: 'Opened', date: '20 Apr 2026, 09:00', notes: 'Sent introductory email with product overview and case studies.', author: 'Rajesh Kumar' },
    ],
    assignmentHistory: [
      { id: 'h1', from: 'Unassigned', to: 'Deepa Krishnan', date: '12 Apr 2026', reason: 'Initial assignment upon lead creation.' },
      { id: 'h2', from: 'Deepa Krishnan', to: 'Arun Menon', date: '28 Apr 2026', reason: 'Escalated to senior executive due to enterprise deal size.' },
    ],
  };
}

const MOCK_TEAM: TeamMember[] = [
  { id: 'user-001', name: 'Arun Menon', avatar: 'AM', performance: { leadsHandled: 88, conversionRate: 72 } },
  { id: 'user-002', name: 'Deepa Krishnan', avatar: 'DK', performance: { leadsHandled: 74, conversionRate: 65 } },
  { id: 'user-003', name: 'Farhan Ali', avatar: 'FA', performance: { leadsHandled: 62, conversionRate: 58 } },
  { id: 'user-004', name: 'Geeta Rao', avatar: 'GR', performance: { leadsHandled: 55, conversionRate: 54 } },
];

export function getLeadAvatar(leadId: string, gender?: string, name?: string) {
  const mAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  ];
  const fAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  ];
  
  let sum = 0;
  const str = leadId || name || 'default';
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  
  const isFemale = gender?.toLowerCase() === 'female' || (name && /neha|priya|kavita|pooja|ananya|geeta|deepa|sneha|kavya|gupta|sharma/i.test(name));
  const list = isFemale ? fAvatars : mAvatars;
  return list[sum % list.length];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function stageBadge(stage: string) {
  const map: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200',
    'Qualified': 'bg-violet-50 text-violet-700 border-violet-200',
    'Proposal': 'bg-amber-50 text-amber-700 border-amber-200',
    'Closed Won': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Closed Lost': 'bg-red-50 text-red-700 border-red-200',
  };
  return map[stage] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    'High': 'bg-red-50 text-red-700 border-red-200',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
    'Low': 'bg-green-50 text-green-700 border-green-200',
  };
  return map[p] || 'bg-slate-50 text-slate-700 border-slate-200';
}

function activityIcon(type: string) {
  switch (type) {
    case 'Call': return <PhoneCall className="w-4 h-4 text-blue-600" />;
    case 'Email': return <Send className="w-4 h-4 text-violet-600" />;
    case 'Meeting': return <Users className="w-4 h-4 text-emerald-600" />;
    default: return <Activity className="w-4 h-4 text-slate-500" />;
  }
}

function activityColor(type: string) {
  switch (type) {
    case 'Call': return 'bg-blue-50 border-blue-200';
    case 'Email': return 'bg-violet-50 border-violet-200';
    case 'Meeting': return 'bg-emerald-50 border-emerald-200';
    default: return 'bg-slate-50 border-slate-200';
  }
}

function outcomeColor(outcome: string) {
  const positive = ['Positive', 'Connected', 'Replied', 'Opened'];
  return positive.includes(outcome) ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';
}

// ─── Conversion Probability Ring ─────────────────────────────────────────────
function ProbabilityRing({ value }: { value: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  const color = value >= 70 ? '#059669' : value >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#0F172A]">{value}%</span>
        <span className="text-[9px] font-medium text-[#64748B] leading-tight text-center">convert</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [newNote, setNewNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);

  // Calling VoIP Simulator State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WhatsApp Simulator State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Email Simulator State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Edit Lead State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: '',
    source: '',
    campaign: '',
    priority: '',
    stage: '',
    gender: '',
    website: '',
    address: '',
    industry: '',
    employees: '',
  });
  const [updatingLead, setUpdatingLead] = useState(false);

  // Schedule Follow-up State
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupNotes, setFollowupNotes] = useState('');
  const [schedulingFollowup, setSchedulingFollowup] = useState(false);

  // VoIP Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callActive) {
      timer = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  const handleStartCall = () => {
    setCallActive(true);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setShowCallModal(false);
    if (lead) {
      const act = {
        id: `a${Date.now()}`,
        type: 'Call',
        outcome: 'Connected',
        date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        notes: `Outbound VoIP call placed. Duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s. Client was receptive.`,
        author: 'Rajesh Kumar',
      };
      setLead(l => l ? { ...l, activities: [act, ...l.activities] } : null);
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsappText.trim()) return;
    setSendingWhatsApp(true);
    setTimeout(() => {
      if (lead) {
        const act = {
          id: `a${Date.now()}`,
          type: 'Call',
          outcome: 'Sent',
          date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes: `WhatsApp message sent: "${whatsappText}"`,
          author: 'Rajesh Kumar',
        };
        setLead(l => l ? { ...l, activities: [act, ...l.activities] } : null);
      }
      setWhatsappText('');
      setSendingWhatsApp(false);
      setShowWhatsAppModal(false);
    }, 1000);
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    setTimeout(() => {
      if (lead) {
        const act = {
          id: `a${Date.now()}`,
          type: 'Email',
          outcome: 'Sent',
          date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes: `Sent Email: "${emailSubject}" - ${emailBody.substring(0, 100)}...`,
          author: 'Rajesh Kumar',
        };
        setLead(l => l ? { ...l, activities: [act, ...l.activities] } : null);
      }
      setEmailSubject('');
      setEmailBody('');
      setSendingEmail(false);
      setShowEmailModal(false);
    }, 1000);
  };

  useEffect(() => {
    if (lead && showEditModal) {
      setEditForm({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        value: lead.value || '',
        source: lead.source || '',
        campaign: lead.campaign || '',
        priority: lead.priority || '',
        stage: lead.stage || '',
        gender: lead.gender || 'Male',
        website: lead.website || '',
        address: lead.address || '',
        industry: lead.industry || '',
        employees: lead.employees || '',
      });
    }
  }, [lead, showEditModal]);

  const handleSaveDetails = async () => {
    if (!lead) return;
    setUpdatingLead(true);
    try {
      await smUpdateLead(lead.id, editForm);
      setLead(l => l ? { ...l, ...editForm } : null);
      setShowEditModal(false);
    } catch {
      setLead(l => l ? { ...l, ...editForm } : null);
      setShowEditModal(false);
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleScheduleFollowup = () => {
    if (!followupDate) return;
    setSchedulingFollowup(true);
    setTimeout(() => {
      if (lead) {
        const act = {
          id: `a${Date.now()}`,
          type: followupType,
          outcome: 'Scheduled',
          date: new Date(followupDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes: `Scheduled ${followupType} follow-up. Notes: ${followupNotes}`,
          author: 'Rajesh Kumar',
        };
        setLead(l => l ? { ...l, activities: [act, ...l.activities] } : null);
      }
      setFollowupDate('');
      setFollowupNotes('');
      setSchedulingFollowup(false);
      setShowFollowupModal(false);
    }, 1000);
  };

  useEffect(() => {
    async function load() {
      try {
        const [leadData, teamData] = await Promise.all([smGetLead(id), smGetTeam()]);
        const leadObj = leadData?.lead || leadData;
        if (leadObj) setLead(leadObj);
        else setLead(buildMockLead(id));
        if (teamData) setTeam(teamData);
      } catch {
        setLead(buildMockLead(id));
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
    else setLoading(false);
  }, [id]);

  async function handleAssign() {
    if (!lead || !selectedAssignee) return;
    setAssigning(true);
    try {
      await smAssignLead(lead.id, selectedAssignee, assignNote);
      const member = team.find(m => m.id === selectedAssignee);
      setLead(l => l ? { ...l, assignedTo: member?.name || l.assignedTo, assignedToId: selectedAssignee } : l);
      setShowAssignModal(false);
    } catch {
      setShowAssignModal(false);
    } finally {
      setAssigning(false);
    }
  }

  function handleAddNote() {
    if (!newNote.trim() || !lead) return;
    const note = {
      id: `n${Date.now()}`,
      text: newNote.trim(),
      author: 'Rajesh Kumar',
      createdAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setLead(l => l ? { ...l, notes: [note, ...l.notes] } : l);
    setNewNote('');
  }

  const STAGES = ['New', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Info', icon: <User className="w-4 h-4" /> },
    { key: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
    { key: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
    { key: 'history', label: 'Assignment History', icon: <RotateCcw className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Loading lead details…</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-base font-semibold text-[#0F172A]">Lead not found</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Back + Breadcrumb ── */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#64748B] text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-[#0F172A] transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <span>Sales Manager</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-[#2563EB] cursor-pointer" onClick={() => router.push('/sales-manager/leads')}>Leads</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#0F172A] font-semibold">{lead.name}</span>
        </div>
      </motion.div>

      {/* ── Lead Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        {/* Header gradient strip */}
        <div className="h-2" style={{ background: 'linear-gradient(90deg, #1e3a8a, #2563EB, #7C3AED)' }} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 relative bg-slate-100">
              <img
                src={getLeadAvatar(lead.id, lead.gender, lead.name)}
                alt={lead.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', zIndex: -1 }}
              >
                {lead.name ? lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'LD'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[#0F172A]">{lead.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageBadge(lead.stage)}`}>{lead.stage}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityBadge(lead.priority)}`}>
                  {lead.priority} Priority
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Building2 className="w-3.5 h-3.5" /> {lead.company}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Mail className="w-3.5 h-3.5" /> {lead.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Phone className="w-3.5 h-3.5" /> {lead.phone}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Tag className="w-3.5 h-3.5" /> {lead.value}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-xs text-[#94A3B8]">
                  <span className="text-[#64748B] font-medium">Assigned:</span> {lead.assignedTo}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  <span className="text-[#64748B] font-medium">Created:</span> {lead.createdAt}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  <span className="text-[#64748B] font-medium">Last Activity:</span> {lead.lastActivity}
                </span>
              </div>
            </div>

            {/* Probability Ring */}
            <div className="flex flex-col items-center flex-shrink-0">
              <ProbabilityRing value={lead.conversionProbability} />
              <p className="text-[10px] text-[#64748B] mt-1 font-medium">Conversion Probability</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="border-t border-slate-100 px-6 py-3 flex flex-wrap gap-2 bg-slate-50/50">
          <button
            onClick={() => { setShowCallModal(true); handleStartCall(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call
          </button>
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 shadow-sm shadow-amber-500/20 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" /> Assign
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#059669] text-white text-xs font-semibold rounded-xl hover:bg-[#047857] shadow-sm shadow-[#059669]/20 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Details
          </button>
          <button
            onClick={() => setShowFollowupModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 shadow-sm shadow-slate-500/20 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule Follow-up
          </button>
          <div className="relative">
            <button
              onClick={() => setStatusDropdown(v => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0F172A] text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" /> Update Status
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${statusDropdown ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {statusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-20 min-w-[160px] overflow-hidden"
                >
                  {STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => { setLead(l => l ? { ...l, stage } : l); setStatusDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 ${lead.stage === stage ? 'text-[#2563EB] font-semibold bg-blue-50/50' : 'text-[#0F172A]'}`}
                    >
                      {lead.stage === stage && <CheckCircle className="w-3 h-3" />}
                      {stage}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => { setActiveTab('notes'); setNewNote(''); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0F172A] text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Add Note
          </button>
        </div>
      </motion.div>

      {/* ── Tab + Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            {/* ──── INFO TAB ──── */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Details */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2563EB]" /> Contact Details
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: <User className="w-4 h-4 text-[#94A3B8]" />, label: 'Full Name', value: lead.name },
                      { icon: <User className="w-4 h-4 text-[#94A3B8]" />, label: 'Gender', value: lead.gender || 'Male' },
                      { icon: <Mail className="w-4 h-4 text-[#94A3B8]" />, label: 'Email', value: lead.email },
                      { icon: <Phone className="w-4 h-4 text-[#94A3B8]" />, label: 'Phone', value: lead.phone },
                      { icon: <MapPin className="w-4 h-4 text-[#94A3B8]" />, label: 'Address', value: lead.address },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8] font-medium">{item.label}</p>
                          <p className="text-sm font-semibold text-[#0F172A] mt-0.5">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lead Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#2563EB]" /> Lead Details
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Source', value: lead.source, icon: <Globe className="w-4 h-4 text-[#94A3B8]" /> },
                        { label: 'Campaign', value: lead.campaign, icon: <Zap className="w-4 h-4 text-[#94A3B8]" /> },
                        { label: 'Deal Value', value: lead.value, icon: <Tag className="w-4 h-4 text-[#94A3B8]" /> },
                        { label: 'Assigned To', value: lead.assignedTo, icon: <UserCheck className="w-4 h-4 text-[#94A3B8]" /> },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-xs text-[#94A3B8] font-medium">{item.label}</p>
                            <p className="text-sm font-semibold text-[#0F172A]">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#2563EB]" /> Company Info
                    </h3>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 space-y-2">
                      {[
                        { label: 'Company', value: lead.company },
                        { label: 'Industry', value: lead.industry },
                        { label: 'Employees', value: lead.employees },
                        { label: 'Website', value: lead.website },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span className="text-[#94A3B8] font-medium text-xs">{item.label}</span>
                          <span className="text-[#0F172A] font-semibold text-xs">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──── ACTIVITY TAB ──── */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A]">Activity History</h3>
                  <span className="text-xs text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-full">{lead.activities.length} activities</span>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {lead.activities.map((act, idx) => (
                      <motion.div
                        key={act.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="relative flex gap-4"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${activityColor(act.type)}`}>
                          {activityIcon(act.type)}
                        </div>
                        {/* Content */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#0F172A]">{act.type}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${outcomeColor(act.outcome)}`}>{act.outcome}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] flex-shrink-0">
                              <Clock className="w-3 h-3" /> {act.date}
                            </div>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">{act.notes}</p>
                          <p className="text-[11px] text-[#94A3B8] mt-2 flex items-center gap-1">
                            <User className="w-3 h-3" /> By {act.author}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──── NOTES TAB ──── */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A]">Notes</h3>
                  <span className="text-xs text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-full">{lead.notes.length} notes</span>
                </div>

                {/* Add Note */}
                <div className="p-4 rounded-2xl border border-[#2563EB]/20 bg-blue-50/30">
                  <label className="block text-xs font-semibold text-[#64748B] mb-2">Add a Note</label>
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Write your note here…"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] bg-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {lead.notes.map((note, idx) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm"
                    >
                      <p className="text-sm text-[#0F172A] leading-relaxed">{note.text}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold">
                            {note.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          {note.author}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Calendar className="w-3 h-3" /> {note.createdAt}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ──── HISTORY TAB ──── */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Assignment History</h3>

                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {lead.assignmentHistory.map((hist, idx) => (
                      <motion.div
                        key={hist.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                              <span className="text-[#64748B] font-medium">{hist.from}</span>
                              <ChevronRight className="w-4 h-4 text-amber-500" />
                              <span>{hist.to}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                              <Calendar className="w-3 h-3" /> {hist.date}
                            </div>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">{hist.reason}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── Reassign Modal ── */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowAssignModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Reassign Lead</h3>
                    <p className="text-xs text-[#64748B]">{lead.name} • {lead.company}</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Select assignee */}
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-2">Select Team Member</label>
                  <div className="space-y-2">
                    {team.map(member => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedAssignee(member.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selectedAssignee === member.id
                            ? 'border-[#2563EB] bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A]">{member.name}</p>
                          <p className="text-xs text-[#64748B]">{member.performance.leadsHandled} leads • {member.performance.conversionRate}% conversion</p>
                        </div>
                        {member.id === lead.assignedToId && (
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Current</span>
                        )}
                        {selectedAssignee === member.id && (
                          <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Assignment Note (optional)</label>
                  <textarea
                    rows={2}
                    value={assignNote}
                    onChange={e => setAssignNote(e.target.value)}
                    placeholder="Reason for reassignment…"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] bg-slate-50 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedAssignee || assigning}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                  >
                    {assigning ? 'Assigning…' : 'Reassign Lead'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Calling Simulator Modal ── */}
      <AnimatePresence>
        {showCallModal && lead && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 text-white rounded-3xl w-full max-w-sm overflow-hidden p-8 border border-slate-800 shadow-2xl relative"
            >
              <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-4 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                  {callActive ? 'VoIP call in progress' : 'Calling...'}
                </span>

                <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl ring-8 ring-slate-900 bg-slate-800 relative mb-6">
                  <img
                    src={getLeadAvatar(lead.id, lead.gender, lead.name)}
                    alt={lead.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', zIndex: -1 }}>
                    {lead.name ? lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'LD'}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1">{lead.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{lead.phone}</p>

                <div className="text-3xl font-mono font-medium mb-12 text-blue-400">
                  {Math.floor(callDuration / 60).toString().padStart(2, '0')}:
                  {(callDuration % 60).toString().padStart(2, '0')}
                </div>

                {!callActive ? (
                  <div className="space-y-4 w-full">
                    <button
                      onClick={handleStartCall}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-lg shadow-emerald-500/20"
                    >
                      Connect Call
                    </button>
                    <button
                      onClick={() => setShowCallModal(false)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8 w-full">
                    <div className="flex gap-6">
                      <button
                        onClick={() => setCallMuted(!callMuted)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${callMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <MicOff className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCallSpeaker(!callSpeaker)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${callSpeaker ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all transform hover:rotate-135 shadow-lg shadow-red-500/30"
                    >
                      <PhoneCall className="w-6 h-6 rotate-135" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WhatsApp Composer Modal ── */}
      <AnimatePresence>
        {showWhatsAppModal && lead && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">WhatsApp Lead</h3>
                    <p className="text-xs text-emerald-100">{lead.name} • {lead.phone}</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-2">Message Body</label>
                  <textarea
                    rows={4}
                    value={whatsappText}
                    onChange={e => setWhatsappText(e.target.value)}
                    placeholder="Type WhatsApp message..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-[#0F172A] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={!whatsappText.trim() || sendingWhatsApp}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {sendingWhatsApp ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Email Composer Modal ── */}
      <AnimatePresence>
        {showEmailModal && lead && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-violet-700 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Send className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Email Lead</h3>
                    <p className="text-xs text-violet-100">{lead.name} • {lead.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Message</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    placeholder="Write email body..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-[#0F172A] outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                    className="flex-1 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-violet-500/20 flex items-center justify-center gap-2"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Lead Details Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Edit2 className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Edit Lead Details</h3>
                    <p className="text-xs text-emerald-100">{lead.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Name</label>
                    <input
                      type="text" value={editForm.name}
                      onChange={e => setEditForm(v => ({ ...v, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Company</label>
                    <input
                      type="text" value={editForm.company}
                      onChange={e => setEditForm(v => ({ ...v, company: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Email</label>
                    <input
                      type="email" value={editForm.email}
                      onChange={e => setEditForm(v => ({ ...v, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Phone</label>
                    <input
                      type="text" value={editForm.phone}
                      onChange={e => setEditForm(v => ({ ...v, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Deal Value</label>
                    <input
                      type="text" value={editForm.value}
                      onChange={e => setEditForm(v => ({ ...v, value: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Source</label>
                    <input
                      type="text" value={editForm.source}
                      onChange={e => setEditForm(v => ({ ...v, source: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Campaign</label>
                    <input
                      type="text" value={editForm.campaign}
                      onChange={e => setEditForm(v => ({ ...v, campaign: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={e => setEditForm(v => ({ ...v, priority: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm(v => ({ ...v, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Industry</label>
                    <input
                      type="text" value={editForm.industry}
                      onChange={e => setEditForm(v => ({ ...v, industry: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Employees</label>
                    <input
                      type="text" value={editForm.employees}
                      onChange={e => setEditForm(v => ({ ...v, employees: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Address</label>
                    <textarea
                      rows={2} value={editForm.address}
                      onChange={e => setEditForm(v => ({ ...v, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-2">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveDetails} disabled={updatingLead} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50">
                  {updatingLead ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Schedule Follow-up Modal ── */}
      <AnimatePresence>
        {showFollowupModal && lead && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#2563EB] text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Schedule Follow-up</h3>
                    <p className="text-xs text-blue-100">{lead.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowFollowupModal(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={followupDate}
                    onChange={e => setFollowupDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Action Type</label>
                  <select
                    value={followupType}
                    onChange={e => setFollowupType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] outline-none"
                  >
                    <option>Call</option>
                    <option>Email</option>
                    <option>Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Follow-up Notes</label>
                  <textarea
                    rows={3}
                    value={followupNotes}
                    onChange={e => setFollowupNotes(e.target.value)}
                    placeholder="Enter notes for this schedule..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-[#0F172A] outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFollowupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleFollowup}
                    disabled={!followupDate || schedulingFollowup}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-500/20"
                  >
                    {schedulingFollowup ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
