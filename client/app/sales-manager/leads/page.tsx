'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  UserCheck,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Eye,
  RefreshCw,
  Check,
  X,
  Users,
  TrendingUp,
  AlertCircle,
  Flame,
  Thermometer,
  Snowflake,
  BarChart3,
  Download,
  MoreVertical,
  ArrowUpRight,
  Edit2,
  MapPin,
  Building2,
  PhoneCall,
  Send,
  FileText,
  PlusCircle,
  Tag,
  Globe,
  Zap,
  ClipboardList,
  RotateCcw,
  Hash,
  MicOff,
  Volume2,
  Calendar,
  Clock,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  smGetLeads,
  smGetTeam,
  smAssignLead,
  smBulkAssignLeads,
  smCreateLead,
  smUpdateLead,
  smGetLead,
} from '../../../services/salesManagerService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  _id: string;
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  source?: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Negotiation' | 'Converted' | 'Lost';
  priority: 'Hot' | 'Warm' | 'Cold';
  assignedTo?: { _id: string; name: string; email?: string };
  lastActivity?: string;
  createdAt?: string;
  gender?: string;
}

interface DetailedLead {
  _id: string;
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: Lead['status'];
  priority: Lead['priority'];
  value: string;
  source: string;
  campaign: string;
  assignedTo?: { _id: string; name: string; email?: string };
  createdAt: string;
  lastActivity: string;
  website: string;
  address: string;
  industry: string;
  employees: string;
  conversionProbability: number;
  gender?: string;
  notes: { id: string; text: string; author: string; createdAt: string }[];
  activities: { id: string; type: string; outcome: string; date: string; notes: string; author: string }[];
  assignmentHistory: { id: string; from: string; to: string; date: string; reason: string }[];
}

interface TeamMember {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  role?: string;
}

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

function buildDetailedLead(l: Lead): DetailedLead {
  const prob = l.priority === 'Hot' ? 90 : l.priority === 'Warm' ? 65 : 30;
  return {
    _id: l._id,
    id: l._id,
    name: l.name,
    company: l.company || 'Not Specified',
    email: l.email || 'no-email@example.com',
    phone: l.phone || '—',
    status: l.status,
    priority: l.priority,
    value: l.priority === 'Hot' ? '₹15.5L' : l.priority === 'Warm' ? '₹6.2L' : '₹1.8L',
    source: l.source || 'Website',
    campaign: 'Inbound Inquiry',
    assignedTo: l.assignedTo,
    createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '01 Jun 2026',
    lastActivity: l.lastActivity ? new Date(l.lastActivity).toLocaleDateString('en-IN') : 'Just now',
    website: 'https://hubnest.com',
    address: 'DLF Cybercity, Gurugram, Haryana',
    industry: 'Technology',
    employees: '50-100',
    conversionProbability: prob,
    gender: l.gender || (l.name && /neha|priya|kavita|pooja|ananya|geeta|deepa|sneha|kavya/i.test(l.name) ? 'Female' : 'Male'),
    notes: [
      { id: 'n1', text: 'Lead is showing strong interest in high-tier plans. Schedule follow-up call.', author: 'System User', createdAt: '05 Jun 2026, 12:00' },
      { id: 'n2', text: 'Lead created via registration form.', author: 'System', createdAt: '01 Jun 2026, 09:00' },
    ],
    activities: [
      { id: 'a1', type: 'Call', outcome: 'Connected', date: '05 Jun 2026, 11:30', notes: 'Lead requested a brochure and pricing options.', author: 'Rajeev Kumar' },
      { id: 'a2', type: 'Email', outcome: 'Sent', date: '02 Jun 2026, 14:00', notes: 'Sent initial greetings and product guide.', author: 'Rajeev Kumar' },
    ],
    assignmentHistory: [
      { id: 'h1', from: 'Unassigned', to: l.assignedTo?.name || 'Unassigned', date: '01 Jun 2026', reason: 'Initial routing rules.' }
    ]
  };
}

// ─── Mock data (graceful fallback) ────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { _id: '1', name: 'Arjun Mehta', company: 'TechSpark Pvt Ltd', phone: '+91 98765 43210', email: 'arjun@techspark.com', source: 'Website', status: 'Interested', priority: 'Hot', assignedTo: { _id: 'e1', name: 'Priya Sharma' }, lastActivity: '2026-06-05T10:30:00Z', createdAt: '2026-06-01T09:00:00Z' },
  { _id: '2', name: 'Neha Gupta', company: 'InnoWave Solutions', phone: '+91 91234 56789', email: 'neha@innowave.in', source: 'Referral', status: 'Negotiation', priority: 'Hot', assignedTo: { _id: 'e2', name: 'Rahul Verma' }, lastActivity: '2026-06-05T14:15:00Z', createdAt: '2026-06-02T11:00:00Z' },
  { _id: '3', name: 'Sanjay Patel', company: 'Global Imports', phone: '+91 87654 32109', email: 'sanjay@globalimports.com', source: 'Cold Call', status: 'Contacted', priority: 'Warm', assignedTo: { _id: 'e1', name: 'Priya Sharma' }, lastActivity: '2026-06-04T09:00:00Z', createdAt: '2026-06-03T08:30:00Z' },
  { _id: '4', name: 'Kavita Rao', company: 'Sunrise Enterprises', phone: '+91 76543 21098', email: 'kavita@sunrise.co', source: 'LinkedIn', status: 'New', priority: 'Cold', assignedTo: { _id: 'e3', name: 'Amit Joshi' }, lastActivity: '2026-06-03T16:00:00Z', createdAt: '2026-06-03T10:00:00Z' },
  { _id: '5', name: 'Rohit Singh', company: 'Bharat Digital', phone: '+91 65432 10987', email: 'rohit@bharatdigital.com', source: 'Website', status: 'Converted', priority: 'Hot', assignedTo: { _id: 'e2', name: 'Rahul Verma' }, lastActivity: '2026-06-05T18:00:00Z', createdAt: '2026-05-28T10:00:00Z' },
  { _id: '6', name: 'Pooja Iyer', company: 'Cloud Nine Tech', phone: '+91 54321 09876', email: 'pooja@cloudnine.io', source: 'Event', status: 'Lost', priority: 'Warm', assignedTo: { _id: 'e3', name: 'Amit Joshi' }, lastActivity: '2026-06-01T11:00:00Z', createdAt: '2026-05-25T09:00:00Z' },
  { _id: '7', name: 'Vikram Desai', company: 'Pinnacle Corp', phone: '+91 43210 98765', email: 'vikram@pinnacle.com', source: 'Referral', status: 'Interested', priority: 'Warm', assignedTo: { _id: 'e1', name: 'Priya Sharma' }, lastActivity: '2026-06-05T12:00:00Z', createdAt: '2026-06-04T07:00:00Z' },
  { _id: '8', name: 'Ananya Kapoor', company: 'Stellar Ventures', phone: '+91 32109 87654', email: 'ananya@stellar.in', source: 'Cold Call', status: 'New', priority: 'Cold', lastActivity: '2026-06-06T09:00:00Z', createdAt: '2026-06-06T09:00:00Z' },
];

const MOCK_TEAM: TeamMember[] = [
  { _id: 'e1', name: 'Priya Sharma', email: 'priya@hubnest.com', role: 'Sales Executive' },
  { _id: 'e2', name: 'Rahul Verma', email: 'rahul@hubnest.com', role: 'Sales Executive' },
  { _id: 'e3', name: 'Amit Joshi', email: 'amit@hubnest.com', role: 'Sales Executive' },
  { _id: 'e4', name: 'Sneha Pillai', email: 'sneha@hubnest.com', role: 'Sales Executive' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Lead['status'], { label: string; bg: string; text: string; dot: string }> = {
  New:         { label: 'New',         bg: 'rgba(37,99,235,0.1)',   text: '#2563EB', dot: '#2563EB' },
  Contacted:   { label: 'Contacted',   bg: 'rgba(124,58,237,0.1)', text: '#7C3AED', dot: '#7C3AED' },
  Interested:  { label: 'Interested',  bg: 'rgba(217,119,6,0.1)',  text: '#D97706', dot: '#D97706' },
  Negotiation: { label: 'Negotiation', bg: 'rgba(234,88,12,0.1)',  text: '#EA580C', dot: '#EA580C' },
  Converted:   { label: 'Converted',   bg: 'rgba(5,150,105,0.1)',  text: '#059669', dot: '#059669' },
  Lost:        { label: 'Lost',        bg: 'rgba(220,38,38,0.1)',  text: '#DC2626', dot: '#DC2626' },
};

const PRIORITY_CONFIG: Record<Lead['priority'], { label: string; bg: string; text: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  Hot:  { label: 'Hot',  bg: 'rgba(220,38,38,0.1)',  text: '#DC2626', Icon: Flame },
  Warm: { label: 'Warm', bg: 'rgba(217,119,6,0.1)', text: '#D97706', Icon: Thermometer },
  Cold: { label: 'Cold', bg: 'rgba(71,85,105,0.1)',  text: '#475569', Icon: Snowflake },
};

const SOURCE_OPTIONS = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Event', 'Social Media', 'Other'];
const STATUS_FILTERS = ['All', 'New', 'Contacted', 'Interested', 'Negotiation', 'Converted', 'Lost'] as const;
const PRIORITY_FILTERS = ['All', 'Hot', 'Warm', 'Cold'] as const;

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Lead['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ background: cfg.bg, color: cfg.text, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Lead['priority'] }) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.Icon;
  return (
    <span style={{ background: cfg.bg, color: cfg.text, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <Icon size={11} color={cfg.text} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 32, gender, leadId }: { name: string; size?: number; gender?: string; leadId?: string }) {
  const bg = avatarColor(name);
  const avatarUrl = getLeadAvatar(leadId || '', gender, name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', background: bg }}>
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 700, zIndex: -1 }}>
        {getInitials(name)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addParam = searchParams.get('add');

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (addParam === 'true') {
      setShowAddModal(true);
      router.replace('/sales-manager/leads');
    }
  }, [addParam, router]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [priorityFilter, setPriorityFilter] = useState<typeof PRIORITY_FILTERS[number]>('All');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Date' | 'Name' | 'Priority' | 'Status'>('Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAssignTarget, setBulkAssignTarget] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Reassign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetLead, setAssignTargetLead] = useState<Lead | null>(null);
  const [newAssignee, setNewAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Add Lead Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', company: '', source: 'Website', priority: 'Warm' as Lead['priority'], assignTo: '', gender: 'Male' });
  const [addingLead, setAddingLead] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Lead Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTargetLead, setEditTargetLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', company: '', source: 'Website', priority: 'Warm' as Lead['priority'], assignTo: '', status: 'New' as Lead['status'], gender: 'Male' });
  const [updatingLead, setUpdatingLead] = useState(false);
  const [editError, setEditError] = useState('');

  // ─── Split View States ───────────────────────────────────────────────────────
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<DetailedLead | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'activity' | 'notes' | 'history'>('info');
  const [newDetailNote, setNewDetailNote] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

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

  // Schedule Follow-up State
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupNotes, setFollowupNotes] = useState('');
  const [schedulingFollowup, setSchedulingFollowup] = useState(false);

  // Handle screen sizing for responsive grid columns
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch full details when selectedLeadId changes
  useEffect(() => {
    async function fetchDetails() {
      if (!selectedLeadId) {
        setSelectedLeadDetails(null);
        return;
      }
      setLoadingDetails(true);
      try {
        const leadData = await smGetLead(selectedLeadId);
        const rawLead = leadData?.lead || leadData;
        const basicLead = leads.find(l => l._id === selectedLeadId || l.id === selectedLeadId);
        
        const mergedLead = {
          ...rawLead,
          _id: selectedLeadId,
          id: selectedLeadId,
          name: rawLead?.name || basicLead?.name || 'Lead Name',
          company: rawLead?.company || basicLead?.company || 'Not Specified',
          phone: rawLead?.phone || basicLead?.phone || '—',
          email: rawLead?.email || basicLead?.email || '—',
          status: rawLead?.status || basicLead?.status || 'New',
          priority: rawLead?.priority || basicLead?.priority || 'Warm',
          gender: rawLead?.gender || basicLead?.gender || (basicLead?.name && /neha|priya|kavita|pooja|ananya|geeta|deepa|sneha|kavya/i.test(basicLead.name) ? 'Female' : 'Male'),
          value: rawLead?.value || (basicLead?.priority === 'Hot' ? '₹15.5L' : basicLead?.priority === 'Warm' ? '₹6.2L' : '₹1.8L'),
          source: rawLead?.source || basicLead?.source || 'Website',
          campaign: rawLead?.campaign || 'Inbound Inquiry',
          assignedTo: rawLead?.assignedTo || basicLead?.assignedTo,
          createdAt: rawLead?.createdAt || basicLead?.createdAt || new Date().toISOString(),
          lastActivity: rawLead?.lastActivity || basicLead?.lastActivity || new Date().toISOString(),
          conversionProbability: rawLead?.conversionProbability || rawLead?.conversion_probability || (basicLead?.priority === 'Hot' ? 90 : basicLead?.priority === 'Warm' ? 65 : 30),
          notes: rawLead?.notes || [
            { id: 'n1', text: 'Interested in product details. Requested pricing booklet.', author: 'System User', createdAt: '05 Jun 2026, 12:00' },
            { id: 'n2', text: 'Lead created via registration form.', author: 'System', createdAt: '01 Jun 2026, 09:00' }
          ],
          activities: rawLead?.activities || [
            { id: 'a1', type: 'Call', outcome: 'Connected', date: '05 Jun 2026, 11:30', notes: 'Lead requested a brochure and pricing options.', author: 'Rajeev Kumar' },
            { id: 'a2', type: 'Email', outcome: 'Sent', date: '02 Jun 2026, 14:00', notes: 'Sent initial greetings and product guide.', author: 'Rajeev Kumar' }
          ],
          assignmentHistory: rawLead?.assignmentHistory || [
            { id: 'h1', from: 'Unassigned', to: rawLead?.assignedTo?.name || basicLead?.assignedTo?.name || 'Unassigned', date: '01 Jun 2026', reason: 'Initial routing rules.' }
          ]
        };
        setSelectedLeadDetails(mergedLead);
      } catch {
        const basicLead = leads.find(l => l._id === selectedLeadId || l.id === selectedLeadId);
        if (basicLead) {
          setSelectedLeadDetails(buildDetailedLead(basicLead));
        }
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [selectedLeadId, leads]);

  // VoIP call duration timer
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

  const handleOpenEditModal = (lead: Lead) => {
    setEditTargetLead(lead);
    setEditForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      company: lead.company || '',
      source: lead.source || 'Website',
      priority: lead.priority || 'Warm',
      assignTo: lead.assignedTo?._id || '',
      status: lead.status || 'New',
      gender: lead.gender || 'Male',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditLead = async () => {
    if (!editTargetLead) return;
    if (!editForm.name.trim()) { setEditError('Name is required'); return; }
    setEditError('');
    setUpdatingLead(true);
    try {
      const updated = await smUpdateLead(editTargetLead._id, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        company: editForm.company,
        source: editForm.source,
        priority: editForm.priority,
        status: editForm.status,
        assignedTo: editForm.assignTo || undefined,
        gender: editForm.gender
      });
      
      const newLeadData = updated ?? {
        ...editTargetLead,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        company: editForm.company,
        source: editForm.source,
        priority: editForm.priority,
        status: editForm.status,
        gender: editForm.gender,
        assignedTo: editForm.assignTo ? { _id: editForm.assignTo, name: team.find(m => m._id === editForm.assignTo)?.name ?? '' } : undefined
      };
      
      setLeads(prev => prev.map(l => l._id === editTargetLead._id ? newLeadData : l));
      
      // Update selected lead details if active
      if (selectedLeadId === editTargetLead._id) {
        setSelectedLeadDetails(prev => prev ? { ...prev, ...newLeadData } : null);
      }
      setShowEditModal(false);
    } catch {
      const fallbackLead = {
        ...editTargetLead,
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        company: editForm.company,
        source: editForm.source,
        priority: editForm.priority,
        status: editForm.status,
        gender: editForm.gender,
        assignedTo: editForm.assignTo ? { _id: editForm.assignTo, name: team.find(m => m._id === editForm.assignTo)?.name ?? '' } : undefined
      };
      setLeads(prev => prev.map(l => l._id === editTargetLead._id ? fallbackLead : l));
      if (selectedLeadId === editTargetLead._id) {
        setSelectedLeadDetails(prev => prev ? { ...prev, ...fallbackLead } : null);
      }
      setShowEditModal(false);
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleExportLeads = () => {
    const headers = 'Name,Company,Phone,Email,Status,Priority,Assigned To,Created At\n';
    const rows = leads.map(l => {
      return `"${l.name}","${l.company || ''}","${l.phone || ''}","${l.email || ''}","${l.status}","${l.priority}","${l.assignedTo?.name || 'Unassigned'}","${l.createdAt || ''}"`;
    }).join('\n');
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HubNest_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Action menus
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ─── Load Data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [leadsData, teamData] = await Promise.all([smGetLeads(), smGetTeam()]);
      
      let rawLeads: any[] = [];
      if (leadsData) {
        rawLeads = Array.isArray(leadsData) ? leadsData : (leadsData.leads ?? MOCK_LEADS);
      } else {
        rawLeads = MOCK_LEADS;
      }
      
      let rawTeam: any[] = [];
      if (teamData) {
        rawTeam = Array.isArray(teamData) ? teamData : (teamData.members ?? MOCK_TEAM);
      } else {
        rawTeam = MOCK_TEAM;
      }

      // Normalize team members
      const normalizedTeam = rawTeam.map((m: any) => ({
        ...m,
        _id: m._id || m.id || String(Math.random()),
        id: m.id || m._id
      }));
      setTeam(normalizedTeam);

      // Normalize leads
      const normalizedLeads = rawLeads.map((l: any) => {
        let assignedTo = undefined;
        if (l.assigned_to || l.assignedTo) {
          const assocId = l.assigned_to || l.assignedTo?._id || l.assignedTo?.id;
          const matchedMem = normalizedTeam.find((m: any) => m.id === assocId || m._id === assocId);
          assignedTo = {
            _id: assocId,
            name: matchedMem?.name || l.assigned_name || l.assignedTo?.name || 'Unassigned'
          };
        }
        return {
          ...l,
          _id: l._id || l.id || String(Math.random()),
          id: l.id || l._id,
          assignedTo
        };
      });
      setLeads(normalizedLeads);
    } catch {
      setLeads(MOCK_LEADS);
      setTeam(MOCK_TEAM);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered / Paginated Leads ─────────────────────────────────────────────
  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || l.priority === priorityFilter;
    const matchAssigned = assignedToFilter === 'All' || l.assignedTo?._id === assignedToFilter;
    return matchSearch && matchStatus && matchPriority && matchAssigned;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'Name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'Status') cmp = a.status.localeCompare(b.status);
    else if (sortBy === 'Priority') {
      const pMap = { Hot: 3, Warm: 2, Cold: 1 };
      cmp = (pMap[a.priority] || 0) - (pMap[b.priority] || 0);
    }
    else { // Date
      const dA = new Date(a.createdAt || 0).getTime();
      const dB = new Date(b.createdAt || 0).getTime();
      cmp = dA - dB;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, priorityFilter, assignedToFilter, sortBy, sortOrder]);

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.priority === 'Hot').length,
    warm: leads.filter(l => l.priority === 'Warm').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    thisWeek: leads.filter(l => l.createdAt && new Date(l.createdAt) >= weekAgo).length,
  };

  // ─── Select Helpers ─────────────────────────────────────────────────────────
  const isAllSelected = paginated.length > 0 && paginated.every(l => selectedLeads.includes(l._id));
  const toggleAll = () => {
    if (isAllSelected) setSelectedLeads(prev => prev.filter(id => !paginated.map(l => l._id).includes(id)));
    else setSelectedLeads(prev => [...new Set([...prev, ...paginated.map(l => l._id)])]);
  };
  const toggleLead = (id: string) => setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ─── Reassign Lead ──────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!assignTargetLead || !newAssignee) return;
    setAssigning(true);
    try {
      await smAssignLead(assignTargetLead._id, newAssignee);
      setLeads(prev => prev.map(l => l._id === assignTargetLead._id ? { ...l, assignedTo: team.find(m => m._id === newAssignee) ? { _id: newAssignee, name: team.find(m => m._id === newAssignee)!.name } : l.assignedTo } : l));
    } catch { /* silently update UI */ } finally {
      setAssigning(false);
      setShowAssignModal(false);
      setAssignTargetLead(null);
      setNewAssignee('');
    }
  };

  // ─── Bulk Assign ────────────────────────────────────────────────────────────
  const handleBulkAssign = async () => {
    if (!bulkAssignTarget || selectedLeads.length === 0) return;
    setBulkAssigning(true);
    try {
      await smBulkAssignLeads(selectedLeads, bulkAssignTarget);
      const member = team.find(m => m._id === bulkAssignTarget);
      if (member) {
        setLeads(prev => prev.map(l => selectedLeads.includes(l._id) ? { ...l, assignedTo: { _id: member._id, name: member.name } } : l));
      }
    } catch { /* silently */ } finally {
      setBulkAssigning(false);
      setSelectedLeads([]);
      setBulkAssignTarget('');
    }
  };

  // ─── Add Lead ───────────────────────────────────────────────────────────────
  const handleAddLead = async () => {
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    setAddError('');
    setAddingLead(true);
    try {
      const created = await smCreateLead({ ...addForm, assignedTo: addForm.assignTo || undefined });
      const rawLead = created?.lead ?? created;
      const newLead = {
        ...rawLead,
        _id: rawLead?._id || rawLead?.id || Date.now().toString(),
        id: rawLead?.id || rawLead?._id,
        name: rawLead?.name || addForm.name,
        company: rawLead?.company || addForm.company,
        phone: rawLead?.phone || addForm.phone,
        email: rawLead?.email || addForm.email,
        source: rawLead?.source || addForm.source,
        priority: rawLead?.priority || addForm.priority,
        status: rawLead?.status || 'New',
        gender: rawLead?.gender || addForm.gender,
        createdAt: rawLead?.createdAt || new Date().toISOString(),
        assignedTo: addForm.assignTo ? { _id: addForm.assignTo, name: team.find(m => m.id === addForm.assignTo || m._id === addForm.assignTo)?.name ?? '' } : undefined
      };
      setLeads(prev => [newLead, ...prev]);
    } catch {
      setLeads(prev => [{
        _id: Date.now().toString(),
        name: addForm.name,
        phone: addForm.phone,
        email: addForm.email,
        company: addForm.company,
        source: addForm.source,
        priority: addForm.priority,
        status: 'New',
        gender: addForm.gender,
        createdAt: new Date().toISOString(),
        assignedTo: addForm.assignTo ? { _id: addForm.assignTo, name: team.find(m => m._id === addForm.assignTo || m.id === addForm.assignTo)?.name ?? '' } : undefined
      }, ...prev]);
    } finally {
      setAddingLead(false);
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '', company: '', source: 'Website', priority: 'Warm', assignTo: '', gender: 'Male' });
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      onClick={() => setOpenMenu(null)}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Leads</h1>
                <span style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>
                  {filtered.length}
                </span>
              </div>
              <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Manage and track all your sales leads</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['table', 'card'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: viewMode === v ? '#fff' : 'transparent',
                  color: viewMode === v ? '#2563EB' : '#64748B',
                  boxShadow: viewMode === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s' }}>
                {v === 'table' ? '≡ Table' : '⊞ Cards'}
              </button>
            ))}
          </div>

          <button onClick={() => loadData(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          <button onClick={handleExportLeads} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <Download size={15} />
            Export
          </button>

          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            <Plus size={15} color="#fff" />
            Add Lead
          </button>
        </div>
      </motion.div>

      {/* ── Stats Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, grad: 'linear-gradient(135deg,#2563EB,#3B82F6)', light: 'rgba(37,99,235,0.08)' },
          { label: 'Hot Leads', value: stats.hot, icon: Flame, grad: 'linear-gradient(135deg,#DC2626,#F97316)', light: 'rgba(220,38,38,0.08)' },
          { label: 'Warm Leads', value: stats.warm, icon: Thermometer, grad: 'linear-gradient(135deg,#D97706,#FBBF24)', light: 'rgba(217,119,6,0.08)' },
          { label: 'Converted', value: stats.converted, icon: TrendingUp, grad: 'linear-gradient(135deg,#059669,#34D399)', light: 'rgba(5,150,105,0.08)' },
          { label: 'This Week', value: stats.thisWeek, icon: BarChart3, grad: 'linear-gradient(135deg,#7C3AED,#A78BFA)', light: 'rgba(124,58,237,0.08)' },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(226,232,240,0.8)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', padding: '16px 20px', marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads, company, phone..."
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Assigned To filter */}
          <select value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#475569', background: '#F8FAFC', outline: 'none', cursor: 'pointer' }}>
            <option value="All">All Assignees</option>
            {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>

          {/* Sort By */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#475569', background: '#F8FAFC', outline: 'none', cursor: 'pointer' }}>
            <option value="Date">Sort by Date</option>
            <option value="Name">Sort by Name</option>
            <option value="Priority">Sort by Priority</option>
            <option value="Status">Sort by Status</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#475569', background: '#F8FAFC', outline: 'none', cursor: 'pointer' }}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#94A3B8" />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Filters</span>
          </div>
        </div>

        {/* Priority chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, alignSelf: 'center' }}>PRIORITY:</span>
          {PRIORITY_FILTERS.map(p => {
            const isActive = priorityFilter === p;
            const cfg = p !== 'All' ? PRIORITY_CONFIG[p] : null;
            const Icon = cfg?.Icon;
            return (
              <button key={p} onClick={() => setPriorityFilter(p)}
                style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${isActive ? (cfg?.text ?? '#2563EB') : '#E2E8F0'}`,
                  background: isActive ? (cfg?.bg ?? 'rgba(37,99,235,0.1)') : '#fff',
                  color: isActive ? (cfg?.text ?? '#2563EB') : '#64748B',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
                {p !== 'All' && Icon && <Icon size={11} color={isActive ? cfg?.text : '#94A3B8'} />}
                {p}
              </button>
            );
          })}

          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, alignSelf: 'center', marginLeft: 8 }}>STATUS:</span>
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s;
            const cfg = s !== 'All' ? STATUS_CONFIG[s] : null;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${isActive ? (cfg?.dot ?? '#2563EB') : '#E2E8F0'}`,
                  background: isActive ? (cfg?.bg ?? 'rgba(37,99,235,0.1)') : '#fff',
                  color: isActive ? (cfg?.text ?? '#2563EB') : '#64748B',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                {s}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bulk Action Bar ── */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10, scaleY: 0.9 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
            style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 14, padding: '12px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
              <Check size={16} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected</span>
            </div>
            <select value={bulkAssignTarget} onChange={e => setBulkAssignTarget(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', fontSize: 13, background: 'rgba(255,255,255,0.2)', color: '#fff', outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ color: '#000' }}>Bulk Assign to...</option>
              {team.map(m => <option key={m._id} value={m._id} style={{ color: '#000' }}>{m.name}</option>)}
            </select>
            <button onClick={handleBulkAssign} disabled={!bulkAssignTarget || bulkAssigning}
              style={{ padding: '7px 18px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {bulkAssigning ? 'Assigning...' : 'Assign'}
            </button>
            <button onClick={() => setSelectedLeads([])} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area (Split View or List View) ── */}
      {loading ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Loading leads...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <AlertCircle size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#0F172A', fontWeight: 700, marginBottom: 6 }}>No leads found</h3>
          <p style={{ color: '#64748B', fontSize: 14 }}>Try adjusting your search or filters</p>
        </motion.div>
      ) : selectedLeadId ? (
        /* ── 3-COLUMN SPLIT VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 768 ? '1fr' : windowWidth < 1280 ? '340px 1fr' : '340px 1fr 340px', gap: 20, minHeight: '600px' }}>
          {/* Column 1: Leads Sidebar */}
          {(windowWidth >= 768) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', padding: 14, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#475569', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Lead List</span>
                <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 10 }}>{filtered.length}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(l => {
                  const isLeadSelected = l._id === selectedLeadId;
                  return (
                    <div
                      key={l._id}
                      onClick={() => setSelectedLeadId(l._id)}
                      style={{
                        padding: '14px',
                        borderRadius: 14,
                        background: isLeadSelected ? 'rgba(37,99,235,0.04)' : '#fff',
                        border: `1.5px solid ${isLeadSelected ? '#2563EB' : 'rgba(226,232,240,0.8)'}`,
                        boxShadow: isLeadSelected ? '0 4px 12px rgba(37,99,235,0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        gap: 12,
                        position: 'relative'
                      }}
                      onMouseEnter={e => { if (!isLeadSelected) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                      onMouseLeave={e => { if (!isLeadSelected) e.currentTarget.style.borderColor = 'rgba(226,232,240,0.8)'; }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar name={l.name} size={42} gender={l.gender} leadId={l._id} />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Name and Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                          <StatusBadge status={l.status} />
                        </div>

                        {/* Company */}
                        <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.company || 'No Company'}</div>

                        {/* Phone */}
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{l.phone || 'No Phone'}</div>

                        {/* Executive Owner */}
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          <span style={{ color: '#94A3B8', fontWeight: 600 }}>Executive: </span>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{l.assignedTo?.name || 'Unassigned'}</span>
                        </div>

                        {/* Last Activity and Priority */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 6 }}>
                          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{formatDate(l.lastActivity ?? l.createdAt)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PriorityBadge priority={l.priority} />
                            {/* Floating Call Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadId(l._id);
                                setShowCallModal(true);
                                setCallActive(true);
                              }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#22C55E',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(34,197,94,0.3)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Phone size={11} fill="#fff" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Column 2: Lead Details Panel */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {loadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#64748B' }}>Loading lead details...</span>
              </div>
            ) : selectedLeadDetails ? (
              <>
                {/* Top Close Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, marginBottom: -4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lead Profile</span>
                  <button 
                    onClick={() => setSelectedLeadId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: 'none',
                      background: '#F1F5F9',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#E2E8F0';
                      e.currentTarget.style.color = '#0F172A';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <X size={14} /> Hide Details
                  </button>
                </div>

                {/* Detail Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar name={selectedLeadDetails.name} size={52} gender={selectedLeadDetails.gender} leadId={selectedLeadDetails._id} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{selectedLeadDetails.name}</h2>
                        <PriorityBadge priority={selectedLeadDetails.priority} />
                        <StatusBadge status={selectedLeadDetails.status} />
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Building2 size={13} />
                        <span>{selectedLeadDetails.company || 'No Company'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{selectedLeadDetails.conversionProbability}%</span>
                    <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conversion Probability</span>
                  </div>
                </div>

                {/* Contact Information 2x2 Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', background: '#F8FAFC', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569' }}>
                    <Phone size={14} color="#64748B" />
                    <span style={{ fontWeight: 600 }}>{selectedLeadDetails.phone || 'No Phone'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569' }}>
                    <Mail size={14} color="#64748B" />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLeadDetails.email || 'No Email'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569' }}>
                    <Building2 size={14} color="#64748B" />
                    <span style={{ fontWeight: 600 }}>{selectedLeadDetails.company || 'No Company'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569' }}>
                    <MapPin size={14} color="#64748B" />
                    <span style={{ fontWeight: 600 }}>{selectedLeadDetails.address || 'No Location'}</span>
                  </div>
                </div>

                {/* 5-Button Quick Action Toolbar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <button onClick={() => { setShowCallModal(true); setCallActive(true); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Phone size={16} color="#22C55E" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Call</span>
                  </button>
                  <button onClick={() => setShowWhatsAppModal(true)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <MessageSquare size={16} color="#25D366" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>WhatsApp</span>
                  </button>
                  <button onClick={() => setShowEmailModal(true)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Mail size={16} color="#2563EB" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Email</span>
                  </button>
                  <button onClick={() => {
                    const el = document.getElementById('notes-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <FileText size={16} color="#7C3AED" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Add Note</span>
                  </button>
                  <button onClick={() => handleOpenEditModal(selectedLeadDetails)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Edit2 size={16} color="#64748B" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Edit</span>
                  </button>
                </div>

                {/* Lead Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>Lead Information</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Lead Source</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>{selectedLeadDetails.source || 'Facebook Ads'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Lead Owner</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#0F172A', fontWeight: 700 }}>{selectedLeadDetails.assignedTo?.name || 'Unassigned'}</span>
                      <button onClick={() => {
                        const el = document.getElementById('owner-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Change</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Lead Status</span>
                    <select
                      id="status-select"
                      value={selectedLeadDetails.status}
                      onChange={async (e) => {
                        const st = e.target.value as Lead['status'];
                        try {
                          await smUpdateLead(selectedLeadDetails._id, { status: st });
                          setSelectedLeadDetails(prev => prev ? { ...prev, status: st } : null);
                          setLeads(prev => prev.map(l => l._id === selectedLeadDetails._id ? { ...l, status: st } : l));
                        } catch { /* ignore */ }
                      }}
                      style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#334155', background: '#F8FAFC', outline: 'none' }}
                    >
                      {(['New', 'Contacted', 'Interested', 'Negotiation', 'Converted', 'Lost'] as Lead['status'][]).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Priority</span>
                    <select
                      value={selectedLeadDetails.priority}
                      onChange={async (e) => {
                        const pr = e.target.value as Lead['priority'];
                        try {
                          await smUpdateLead(selectedLeadDetails._id, { priority: pr });
                          setSelectedLeadDetails(prev => prev ? { ...prev, priority: pr } : null);
                          setLeads(prev => prev.map(l => l._id === selectedLeadDetails._id ? { ...l, priority: pr } : l));
                        } catch { /* ignore */ }
                      }}
                      style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#334155', background: '#F8FAFC', outline: 'none' }}
                    >
                      {(['Hot', 'Warm', 'Cold'] as Lead['priority'][]).map(pr => (
                        <option key={pr} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Created On</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>
                      {selectedLeadDetails.createdAt ? new Date(selectedLeadDetails.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '18 May 2025, 10:30 AM'}
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status Timeline</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '16px', right: '16px', height: '3px', background: '#E2E8F0', zIndex: 1 }} />
                    {(() => {
                      const stages: Lead['status'][] = ['New', 'Contacted', 'Interested', 'Negotiation', 'Converted'];
                      const currentIdx = stages.indexOf(selectedLeadDetails.status === 'Lost' ? 'New' : selectedLeadDetails.status);
                      const widthPercent = currentIdx >= 0 ? (currentIdx / (stages.length - 1)) * 100 : 0;
                      return (
                        <div style={{ position: 'absolute', top: '10px', left: '16px', width: `calc(${widthPercent}% - 16px)`, height: '3px', background: '#2563EB', zIndex: 1, transition: 'width 0.4s ease' }} />
                      );
                    })()}

                    {(['New', 'Contacted', 'Interested', 'Negotiation', selectedLeadDetails.status === 'Lost' ? 'Lost' : 'Converted'] as Lead['status'][]).map((st) => {
                      const stagesList: Lead['status'][] = ['New', 'Contacted', 'Interested', 'Negotiation', 'Converted', 'Lost'];
                      const currentIdx = stagesList.indexOf(selectedLeadDetails.status);
                      const stageIdx = stagesList.indexOf(st);
                      const isCompleted = selectedLeadDetails.status === 'Lost' ? (st === 'Lost') : (stageIdx <= currentIdx);
                      const isActive = selectedLeadDetails.status === st;

                      return (
                        <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isCompleted ? (st === 'Lost' ? '#DC2626' : '#2563EB') : '#fff',
                            border: `2px solid ${isCompleted ? (st === 'Lost' ? '#DC2626' : '#2563EB') : '#CBD5E1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            boxShadow: isActive ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none'
                          }}>
                            {isCompleted ? <Check size={10} color="#fff" strokeWidth={3} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CBD5E1' }} />}
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: isActive || isCompleted ? 700 : 500, color: isActive ? '#0F172A' : '#64748B', marginTop: 6 }}>{st}</span>
                          <span style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>
                            {st === 'New' ? '18 May' : st === 'Contacted' && isCompleted ? '19 May' : st === 'Interested' && isCompleted ? '21 May' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activity History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Activity History</span>
                    <button onClick={() => alert('All activities:\n' + selectedLeadDetails.activities.map(a => `${a.date}: ${a.type} - ${a.notes}`).join('\n'))}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>View All Activities</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedLeadDetails.activities && selectedLeadDetails.activities.slice(0, 3).map((act) => {
                      let Icon = ClipboardList;
                      let bg = '#F1F5F9';
                      let text = '#64748B';
                      if (act.type.includes('Call')) { Icon = PhoneCall; bg = 'rgba(16,185,129,0.1)'; text = '#059669'; }
                      else if (act.type.includes('Email')) { Icon = Mail; bg = 'rgba(37,99,235,0.1)'; text = '#2563EB'; }
                      else if (act.type.includes('WhatsApp') || act.type.includes('Message')) { Icon = MessageSquare; bg = 'rgba(37,211,102,0.1)'; text = '#25D366'; }

                      return (
                        <div key={act.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} color={text} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>{act.type}</span>
                              <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{act.date}</span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>{act.notes}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(!selectedLeadDetails.activities || selectedLeadDetails.activities.length === 0) && (
                      <div style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No activity records found</div>
                    )}
                  </div>
                </div>

                {/* Notes & Comments */}
                <div id="notes-section" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Notes & Comments</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedLeadDetails.notes && selectedLeadDetails.notes.map((note) => (
                      <div key={note.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: 12 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{note.text}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                          <span>By {note.author}</span>
                          <span>{note.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      placeholder="Add internal note/comment..."
                      value={newDetailNote}
                      onChange={e => setNewDetailNote(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, outline: 'none' }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          if (!newDetailNote.trim()) return;
                          const noteText = newDetailNote.trim();
                          setNewDetailNote('');
                          const newNoteObj = {
                            id: Date.now().toString(),
                            text: noteText,
                            author: 'Sales Manager',
                            createdAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          };
                          const newActivityObj = {
                            id: `act-${Date.now()}`,
                            type: 'Note Added',
                            outcome: 'Internal Log',
                            date: newNoteObj.createdAt,
                            notes: noteText,
                            author: 'Sales Manager'
                          };
                          setSelectedLeadDetails(prev => prev ? {
                            ...prev,
                            notes: [newNoteObj, ...prev.notes],
                            activities: [newActivityObj, ...prev.activities]
                          } : null);
                          try {
                            await smUpdateLead(selectedLeadDetails._id, { notes: [newNoteObj, ...selectedLeadDetails.notes] });
                          } catch { /* ignore */ }
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!newDetailNote.trim()) return;
                        const noteText = newDetailNote.trim();
                        setNewDetailNote('');
                        const newNoteObj = {
                          id: Date.now().toString(),
                          text: noteText,
                          author: 'Sales Manager',
                          createdAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        };
                        const newActivityObj = {
                          id: `act-${Date.now()}`,
                          type: 'Note Added',
                          outcome: 'Internal Log',
                          date: newNoteObj.createdAt,
                          notes: noteText,
                          author: 'Sales Manager'
                        };
                        setSelectedLeadDetails(prev => prev ? {
                          ...prev,
                          notes: [newNoteObj, ...prev.notes],
                          activities: [newActivityObj, ...prev.activities]
                        } : null);
                        try {
                          await smUpdateLead(selectedLeadDetails._id, { notes: [newNoteObj, ...selectedLeadDetails.notes] });
                        } catch { /* ignore */ }
                      }}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* AI Insights */}
                <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', padding: 16, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F59E0B' }}>AI Insights</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#E2E8F0' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', marginTop: 6 }} />
                      <span>High conversion probability ({selectedLeadDetails.conversionProbability}%)</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', marginTop: 6 }} />
                      <span>Best time to call: Today 4:00 PM - 6:00 PM</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', marginTop: 6 }} />
                      <span>Suggested Action: Schedule a follow-up call</span>
                    </div>
                  </div>
                  <button onClick={() => alert('Opening full AI Lead Analysis report...')}
                    style={{ width: '100%', marginTop: 14, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600, fontSize: 11.5, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  >
                    View Full AI Report
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Could not load lead details</div>
            )}
          </div>

          {/* Column 3: Actions & Insights Panel */}
          {windowWidth >= 1280 && selectedLeadDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Owner / Reassign Panel */}
              <div id="owner-section" style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Assign / Reassign Lead</div>
                
                <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Current Owner</div>
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Avatar name={selectedLeadDetails.assignedTo?.name || 'Unassigned'} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {selectedLeadDetails.assignedTo?.name || 'Unassigned'}
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Sales Executive</div>
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Change Owner</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#0F172A', background: '#fff', outline: 'none' }}
                  >
                    <option value="">Select executive</option>
                    {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <button
                    onClick={async () => {
                      if (!newAssignee) return;
                      try {
                        await smAssignLead(selectedLeadDetails._id, newAssignee);
                        const member = team.find(m => m._id === newAssignee);
                        if (member) {
                          const newAssignObj = { _id: member._id, name: member.name };
                          setSelectedLeadDetails(prev => prev ? {
                            ...prev,
                            assignedTo: newAssignObj,
                            assignmentHistory: [
                              {
                                id: `hist-${Date.now()}`,
                                from: prev.assignedTo?.name || 'Unassigned',
                                to: member.name,
                                date: new Date().toLocaleDateString('en-IN'),
                                reason: 'Manual re-assignment by Manager'
                              },
                              ...prev.assignmentHistory
                            ]
                          } : null);
                          setLeads(prev => prev.map(l => l._id === selectedLeadDetails._id ? { ...l, assignedTo: newAssignObj } : l));
                          alert('Lead successfully reassigned.');
                        }
                      } catch { /* ignore */ }
                    }}
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Lead Actions */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Lead Actions</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={() => {
                    const selectEl = document.getElementById('status-select');
                    if (selectEl) selectEl.focus();
                  }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <TrendingUp size={16} color="#3B82F6" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Change Status</span>
                  </button>
                  <button onClick={() => {
                    const el = document.getElementById('notes-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <FileText size={16} color="#7C3AED" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Add Note</span>
                  </button>
                  <button onClick={() => setShowFollowupModal(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Calendar size={16} color="#059669" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Schedule Follow-up</span>
                  </button>
                  <button onClick={() => {
                    const el = document.getElementById('owner-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Users size={16} color="#F59E0B" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Reassign Lead</span>
                  </button>
                  <button onClick={async () => {
                    try {
                      await smUpdateLead(selectedLeadDetails._id, { priority: 'Hot', status: 'Negotiation' });
                      const newAct = {
                        id: `escalate-${Date.now()}`,
                        type: 'Lead Escalated',
                        outcome: 'Priority Boosted',
                        date: new Date().toLocaleDateString('en-IN'),
                        notes: 'Lead escalated to HOT priority and negotiation stage by Manager.',
                        author: 'Sales Manager'
                      };
                      setSelectedLeadDetails(prev => prev ? {
                        ...prev,
                        priority: 'Hot',
                        status: 'Negotiation',
                        activities: [newAct, ...prev.activities]
                      } : null);
                      setLeads(prev => prev.map(l => l._id === selectedLeadDetails._id ? { ...l, priority: 'Hot', status: 'Negotiation' } : l));
                      alert('Lead successfully escalated!');
                    } catch { /* ignore */ }
                  }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <AlertTriangle size={16} color="#DC2626" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Escalate Lead</span>
                  </button>
                  <button onClick={async () => {
                    const newPrio = selectedLeadDetails.priority === 'Hot' ? 'Warm' : 'Hot';
                    try {
                      await smUpdateLead(selectedLeadDetails._id, { priority: newPrio });
                      setSelectedLeadDetails(prev => prev ? { ...prev, priority: newPrio } : null);
                      setLeads(prev => prev.map(l => l._id === selectedLeadDetails._id ? { ...l, priority: newPrio } : l));
                      alert(`Lead marked as ${newPrio}.`);
                    } catch { /* ignore */ }
                  }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 10px', borderRadius: 10, border: '1.5px solid #F1F5F9', background: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Star size={16} fill={selectedLeadDetails.priority === 'Hot' ? '#DC2626' : 'none'} color={selectedLeadDetails.priority === 'Hot' ? '#DC2626' : '#475569'} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{selectedLeadDetails.priority === 'Hot' ? 'Remove Star' : 'Mark Important'}</span>
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div style={{ background: '#EFF6FF', borderRadius: 14, border: '1.5px solid #DBEAFE', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Sparkles size={14} color="#1E40AF" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#1E40AF' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1E40AF', marginTop: 6 }} />
                    <span>{selectedLeadDetails.name} is highly interested. Follow up soon.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1E40AF', marginTop: 6 }} />
                    <span>Assign to {selectedLeadDetails.assignedTo?.name || 'Rahul Sharma'} (Best Fit)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1E40AF', marginTop: 6 }} />
                    <span>Schedule follow-up in next 2 days.</span>
                  </div>
                </div>
              </div>

              {/* Lead Performance */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Lead Performance</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Total Activities</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedLeadDetails.activities ? selectedLeadDetails.activities.length : 12}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Conversations</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>8</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Meetings</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>2</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: '#64748B' }}>Conversion Rate</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>80% <span style={{ fontSize: 10, fontWeight: 500 }}>+20% vs last month</span></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 12 }}>
                  <span style={{ color: '#64748B' }}>Last Activity</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>10 min ago</span>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Engagement Score</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: '#22C55E' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E' }}>High</span>
                </div>
              </div>

              {/* Follow-up Overview */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Follow-up Overview</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>Upcoming Follow-ups</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>3</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>Overdue Follow-ups</span>
                    <span style={{ fontWeight: 700, color: '#DC2626' }}>2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>Completed Follow-ups</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>8</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                  <button onClick={() => alert('Viewing all follow-up history...')}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    View All Follow-ups
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (

        /* ── TABLE VIEW ── */
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 18, border: '1.5px solid rgba(226,232,240,0.8)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 18 }}>

          <div style={{ overflowX: 'auto' }}>
            <table className="table-to-cards" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', width: 40 }}>
                    <input type="checkbox" checked={isAllSelected} onChange={toggleAll}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }} />
                  </th>
                  {['Lead / Company', 'Phone', 'Assigned To', 'Status', 'Priority', 'Last Activity', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((lead, i) => {
                  const isSelected = selectedLeads.includes(lead._id);
                  return (
                    <motion.tr key={lead._id} custom={i} initial="hidden" animate="visible" variants={cardVariants}
                      style={{ borderBottom: '1px solid #F1F5F9', background: isSelected ? 'rgba(37,99,235,0.03)' : '#fff', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(37,99,235,0.03)' : '#fff'; }}>

                      <td data-label="Select" style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleLead(lead._id)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }} />
                      </td>

                      <td data-label="Lead / Company" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={lead.name} size={36} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{lead.name}</div>
                            {lead.company && <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{lead.company}</div>}
                          </div>
                        </div>
                      </td>

                      <td data-label="Phone / Email" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={13} color="#94A3B8" />
                          <span style={{ fontSize: 13, color: '#475569' }}>{lead.phone ?? '—'}</span>
                        </div>
                        {lead.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <Mail size={13} color="#94A3B8" />
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>{lead.email}</span>
                          </div>
                        )}
                      </td>

                      <td data-label="Assigned To" style={{ padding: '14px 16px' }}>
                        {lead.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={lead.assignedTo.name} size={26} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{lead.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: '#CBD5E1', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>

                      <td data-label="Status" style={{ padding: '14px 16px' }}><StatusBadge status={lead.status} /></td>
                      <td data-label="Priority" style={{ padding: '14px 16px' }}><PriorityBadge priority={lead.priority} /></td>

                      <td data-label="Last Activity" style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 13, color: '#64748B' }}>{formatDate(lead.lastActivity ?? lead.createdAt)}</span>
                      </td>

                      <td data-label="Actions" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedLeadId(lead._id)}
                            title="View Lead"
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', fontSize: 12, fontWeight: 600 }}>
                            <Eye size={13} /> View
                          </button>
                          <button onClick={() => { setSelectedLeadId(lead._id); setShowCallModal(true); setCallActive(true); }}
                            title="Call Lead"
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#22C55E', fontSize: 12, fontWeight: 600 }}>
                            <Phone size={13} color="#22C55E" /> Call
                          </button>
                          <button onClick={() => handleOpenEditModal(lead)}
                            title="Edit Lead"
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: 12, fontWeight: 600 }}>
                            <Edit2 size={13} /> Edit
                          </button>
                          <button onClick={() => { setAssignTargetLead(lead); setNewAssignee(lead.assignedTo?._id ?? ''); setShowAssignModal(true); }}
                            title="Reassign"
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#7C3AED', fontSize: 12, fontWeight: 600 }}>
                            <UserCheck size={13} /> Reassign
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

      ) : (

        /* ── CARD VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 18 }}>
          {paginated.map((lead, i) => (
            <motion.div key={lead._id} custom={i} initial="hidden" animate="visible" variants={cardVariants}
              style={{ background: '#fff', borderRadius: 18, border: `2px solid ${selectedLeads.includes(lead._id) ? '#2563EB' : 'rgba(226,232,240,0.8)'}`, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
              onClick={() => toggleLead(lead._id)}>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={lead.name} size={42} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{lead.name}</div>
                    {lead.company && <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{lead.company}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={13} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: '#475569' }}>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="#94A3B8" />
                    <span style={{ fontSize: 13, color: '#475569' }}>{lead.email}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <StatusBadge status={lead.status} />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatDate(lead.lastActivity ?? lead.createdAt)}</span>
              </div>

              {lead.assignedTo && (
                <div style={{ padding: '8px 12px', borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Avatar name={lead.assignedTo.name} size={24} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{lead.assignedTo.name}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedLeadId(lead._id)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#2563EB', fontSize: 11, fontWeight: 700 }}>
                  <Eye size={12} /> View
                </button>
                <button onClick={() => { setSelectedLeadId(lead._id); setShowCallModal(true); setCallActive(true); }}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#22C55E', fontSize: 11, fontWeight: 700 }}>
                  <Phone size={12} color="#22C55E" /> Call
                </button>
                <button onClick={() => handleOpenEditModal(lead)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#059669', fontSize: 11, fontWeight: 700 }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => { setAssignTargetLead(lead); setNewAssignee(lead.assignedTo?._id ?? ''); setShowAssignModal(true); }}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#7C3AED', fontSize: 11, fontWeight: 700 }}>
                  <UserCheck size={12} /> Reassign
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 4px' }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} leads
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: currentPage === 1 ? '#F8FAFC' : '#fff', color: currentPage === 1 ? '#CBD5E1' : '#2563EB', fontWeight: 700, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid', borderColor: currentPage === p ? '#2563EB' : '#E2E8F0', background: currentPage === p ? '#2563EB' : '#fff', color: currentPage === p ? '#fff' : '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                {p}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: currentPage === totalPages ? '#F8FAFC' : '#fff', color: currentPage === totalPages ? '#CBD5E1' : '#2563EB', fontWeight: 700, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
              Next →
            </button>
          </div>
        </motion.div>
      )}

      {/* ── FAB: Add Lead ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        style={{ position: 'fixed', bottom: 32, right: 32, width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', border: 'none', boxShadow: '0 8px 24px rgba(37,99,235,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </motion.button>

      {/* ── Reassign Modal ── */}
      <AnimatePresence>
        {showAssignModal && assignTargetLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => { setShowAssignModal(false); setAssignTargetLead(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Reassign Lead</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Assign to a different executive</p>
                  </div>
                </div>
                <button onClick={() => { setShowAssignModal(false); setAssignTargetLead(null); }}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={assignTargetLead.name} size={38} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{assignTargetLead.name}</div>
                    {assignTargetLead.company && <div style={{ fontSize: 12, color: '#64748B' }}>{assignTargetLead.company}</div>}
                  </div>
                </div>
                {assignTargetLead.assignedTo && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Currently assigned to:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{assignTargetLead.assignedTo.name}</span>
                  </div>
                )}
              </div>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Assign To</label>
              <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', background: '#F8FAFC', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}>
                <option value="">Select executive...</option>
                {team.map(m => <option key={m._id} value={m._id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
              </select>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowAssignModal(false); setAssignTargetLead(null); }}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAssign} disabled={!newAssignee || assigning}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: newAssignee ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : '#E2E8F0', color: newAssignee ? '#fff' : '#94A3B8', fontWeight: 700, fontSize: 14, cursor: newAssignee ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={16} /> {assigning ? 'Saving...' : 'Confirm Assign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Lead Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add New Lead</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Fill in the details below</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              {addError && (
                <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {addError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Arjun Mehta', icon: Users },
                  { label: 'Company', key: 'company', type: 'text', placeholder: 'TechSpark Pvt Ltd', icon: BarChart3 },
                  { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210', icon: Phone },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'arjun@example.com', icon: Mail },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{f.label}</label>
                    <div style={{ position: 'relative' }}>
                      <f.icon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type={f.type} placeholder={f.placeholder}
                        value={(addForm as Record<string, string>)[f.key] ?? ''}
                        onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Source</label>
                  <select value={addForm.source} onChange={e => setAddForm(prev => ({ ...prev, source: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Priority</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Hot', 'Warm', 'Cold'] as Lead['priority'][]).map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      const isActive = addForm.priority === p;
                      return (
                        <button key={p} onClick={() => setAddForm(prev => ({ ...prev, priority: p }))}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: `1.5px solid ${isActive ? cfg.text : '#E2E8F0'}`, background: isActive ? cfg.bg : '#fff', color: isActive ? cfg.text : '#94A3B8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <cfg.Icon size={12} color={isActive ? cfg.text : '#94A3B8'} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Gender</label>
                  <select value={addForm.gender} onChange={e => setAddForm(prev => ({ ...prev, gender: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Assign To</label>
                  <select value={addForm.assignTo} onChange={e => setAddForm(prev => ({ ...prev, assignTo: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: addForm.assignTo ? '#0F172A' : '#94A3B8', background: '#F8FAFC', outline: 'none' }}>
                    <option value="">Leave unassigned</option>
                    {team.map(m => <option key={m._id} value={m._id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAddLead} disabled={addingLead}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: addingLead ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
                  <Plus size={16} /> {addingLead ? 'Creating Lead...' : 'Create Lead'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Lead Modal ── */}
      <AnimatePresence>
        {showEditModal && editTargetLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Edit Lead Details</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Update the details below</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              {editError && (
                <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {editError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Arjun Mehta', icon: Users },
                  { label: 'Company', key: 'company', type: 'text', placeholder: 'TechSpark Pvt Ltd', icon: BarChart3 },
                  { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210', icon: Phone },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'arjun@example.com', icon: Mail },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{f.label}</label>
                    <div style={{ position: 'relative' }}>
                      <f.icon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type={f.type} placeholder={f.placeholder}
                        value={(editForm as Record<string, string>)[f.key] ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Source</label>
                  <select value={editForm.source} onChange={e => setEditForm(prev => ({ ...prev, source: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Priority</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Hot', 'Warm', 'Cold'] as Lead['priority'][]).map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      const isActive = editForm.priority === p;
                      return (
                        <button key={p} onClick={() => setEditForm(prev => ({ ...prev, priority: p }))}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: `1.5px solid ${isActive ? cfg.text : '#E2E8F0'}`, background: isActive ? cfg.bg : '#fff', color: isActive ? cfg.text : '#94A3B8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <cfg.Icon size={12} color={isActive ? cfg.text : '#94A3B8'} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as Lead['status'] }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    {['New', 'Contacted', 'Interested', 'Negotiation', 'Converted', 'Lost'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Assigned To</label>
                  <select value={editForm.assignTo} onChange={e => setEditForm(prev => ({ ...prev, assignTo: e.target.value }))}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: editForm.assignTo ? '#0F172A' : '#94A3B8', background: '#F8FAFC', outline: 'none' }}>
                    <option value="">Leave unassigned</option>
                    {team.map(m => <option key={m._id} value={m._id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowEditModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleEditLead} disabled={updatingLead}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: updatingLead ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
                  <Check size={16} /> {updatingLead ? 'Saving Details...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VoIP Call Simulator Modal ── */}
      <AnimatePresence>
        {showCallModal && selectedLeadDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              style={{ background: '#1E293B', color: '#fff', borderRadius: 24, padding: '32px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                {callActive ? 'Active Call via HubNest VoIP' : 'Dialing...'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                  {callActive && (
                    <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px dashed rgba(16,185,129,0.4)', animation: 'spin 10s linear infinite' }} />
                  )}
                  <Avatar name={selectedLeadDetails.name} size={80} gender={selectedLeadDetails.gender} leadId={selectedLeadDetails._id} />
                </div>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{selectedLeadDetails.name}</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 24px' }}>{selectedLeadDetails.phone || 'No phone number'}</p>

              {callActive && (
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums', marginBottom: 30 }}>
                  {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32 }}>
                <button
                  onClick={() => setCallMuted(!callMuted)}
                  style={{
                    width: 50, height: 50, borderRadius: '50%', border: 'none',
                    background: callMuted ? '#EF4444' : 'rgba(255,255,255,0.1)',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title={callMuted ? 'Unmute' : 'Mute'}
                >
                  <MicOff size={20} color="#fff" />
                </button>

                <button
                  onClick={() => setCallSpeaker(!callSpeaker)}
                  style={{
                    width: 50, height: 50, borderRadius: '50%', border: 'none',
                    background: callSpeaker ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="Speaker"
                >
                  <Volume2 size={20} color="#fff" />
                </button>
              </div>

              <button
                onClick={async () => {
                  setCallActive(false);
                  setShowCallModal(false);
                  
                  const durationStr = `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`;
                  const callNote = `VoIP Call connected successfully. Duration: ${durationStr}. Speaker: ${callSpeaker ? 'On' : 'Off'}, Muted: ${callMuted ? 'Yes' : 'No'}.`;
                  
                  const newActivity = {
                    id: `call-${Date.now()}`,
                    type: 'Outbound Call (VoIP)',
                    outcome: 'Completed',
                    date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    notes: callNote,
                    author: 'Sales Manager'
                  };

                  setSelectedLeadDetails(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      activities: [newActivity, ...prev.activities]
                    };
                  });
                  
                  try {
                    await smUpdateLead(selectedLeadDetails._id, {
                      lastActivity: new Date().toISOString()
                    });
                  } catch { /* ignore */ }
                }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 16, border: 'none',
                  background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Phone size={16} fill="#fff" /> End Call
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WhatsApp Simulator Modal ── */}
      <AnimatePresence>
        {showWhatsAppModal && selectedLeadDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}
            onClick={() => setShowWhatsAppModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#25D366,#128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>WhatsApp Chat Composer</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Send message to lead's phone</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>SENDING TO:</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#166534', marginTop: 2 }}>{selectedLeadDetails.name} ({selectedLeadDetails.phone || 'No Phone'})</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Quick Templates:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setWhatsappText(`Hi ${selectedLeadDetails.name}, I tried reaching you from HubNest CRM. Let me know when you are free to discuss your inquiry.`)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 11, color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Intro Follow-up
                  </button>
                  <button
                    onClick={() => setWhatsappText(`Hello ${selectedLeadDetails.name}, here is the product brochure and pricing model we discussed. Let's schedule a pilot demo.`)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 11, color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Share Brochure
                  </button>
                </div>
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Message Text</label>
              <textarea
                value={whatsappText}
                onChange={e => setWhatsappText(e.target.value)}
                placeholder="Type your WhatsApp message..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowWhatsAppModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!whatsappText.trim()) return;
                    setSendingWhatsApp(true);
                    
                    const msgContent = whatsappText.trim();
                    
                    await new Promise(r => setTimeout(r, 800));
                    setSendingWhatsApp(false);
                    setShowWhatsAppModal(false);
                    setWhatsappText('');

                    const newActivity = {
                      id: `wa-${Date.now()}`,
                      type: 'WhatsApp Sent',
                      outcome: 'Delivered',
                      date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      notes: `Sent via HubNest WhatsApp integration: "${msgContent}"`,
                      author: 'Sales Manager'
                    };

                    setSelectedLeadDetails(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        activities: [newActivity, ...prev.activities]
                      };
                    });
                  }}
                  disabled={sendingWhatsApp || !whatsappText.trim()}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (sendingWhatsApp || !whatsappText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Send size={15} color="#fff" /> {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp Message'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Email Composer Modal ── */}
      <AnimatePresence>
        {showEmailModal && selectedLeadDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}
            onClick={() => setShowEmailModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Compose Email</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Send email proposal to lead</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>RECIPIENT EMAIL</label>
                  <input type="email" readOnly value={selectedLeadDetails.email || 'no-email@example.com'}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#64748B', background: '#F1F5F9', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>SUBJECT</label>
                  <input type="text" placeholder="Partnership Proposal" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>EMAIL BODY</label>
                  <textarea placeholder="Write email body..." value={emailBody} onChange={e => setEmailBody(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', minHeight: '140px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowEmailModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!emailSubject.trim() || !emailBody.trim()) return;
                    setSendingEmail(true);
                    
                    const finalSubject = emailSubject.trim();
                    const finalBody = emailBody.trim();

                    await new Promise(r => setTimeout(r, 1000));
                    setSendingEmail(false);
                    setShowEmailModal(false);
                    setEmailSubject('');
                    setEmailBody('');

                    const newActivity = {
                      id: `email-${Date.now()}`,
                      type: 'Email Sent',
                      outcome: 'Sent',
                      date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      notes: `Subject: ${finalSubject}\nBody: ${finalBody.slice(0, 100)}...`,
                      author: 'Sales Manager'
                    };

                    setSelectedLeadDetails(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        activities: [newActivity, ...prev.activities]
                      };
                    });
                  }}
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563EB,#3B82F6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (sendingEmail || !emailSubject.trim() || !emailBody.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Send size={15} color="#fff" /> {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Schedule Follow-up Modal ── */}
      <AnimatePresence>
        {showFollowupModal && selectedLeadDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}
            onClick={() => setShowFollowupModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Schedule Follow-up</h2>
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Set next touchpoint for lead</p>
                  </div>
                </div>
                <button onClick={() => setShowFollowupModal(false)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Follow-up Date & Time</label>
                  <input type="datetime-local" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Action Type</label>
                  <select value={followupType} onChange={e => setFollowupType(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Online Meeting">Online Meeting</option>
                    <option value="Site Visit">Site Visit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Follow-up Agenda / Notes</label>
                  <textarea placeholder="Agenda details..." value={followupNotes} onChange={e => setFollowupNotes(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowFollowupModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!followupDate) return;
                    setSchedulingFollowup(true);

                    await new Promise(r => setTimeout(r, 800));
                    setSchedulingFollowup(false);
                    setShowFollowupModal(false);

                    const formattedDate = new Date(followupDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                    const newActivity = {
                      id: `follow-${Date.now()}`,
                      type: `Follow-up Scheduled (${followupType})`,
                      outcome: 'Scheduled',
                      date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      notes: `Scheduled touchpoint for: ${formattedDate}. Agenda: ${followupNotes || 'None'}`,
                      author: 'Sales Manager'
                    };

                    setSelectedLeadDetails(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        activities: [newActivity, ...prev.activities]
                      };
                    });

                    setFollowupNotes('');
                    setFollowupDate('');
                  }}
                  disabled={schedulingFollowup || !followupDate}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (schedulingFollowup || !followupDate) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Check size={16} /> {schedulingFollowup ? 'Scheduling...' : 'Schedule Follow-up'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inline CSS for spin animation ── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
