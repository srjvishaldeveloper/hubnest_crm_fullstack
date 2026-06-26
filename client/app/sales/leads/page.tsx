'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Search, Plus, Phone, MessageSquare, Eye, Mail, Calendar, X,
  Activity, Trash2, ArrowUpRight, Sparkles, Trophy, TrendingUp,
  Send, Users, CheckCircle2, AlertCircle, Clock, Filter,
  BarChart2, Zap, ChevronDown, RefreshCw,
  BadgeCheck, AlertTriangle, List, Target, Upload, Download,
  FileText, ChevronLeft, ChevronRight, ArrowUpDown, SortAsc, SortDesc,
  Flame, Star, GitBranch, PieChart as PieIcon, TrendingDown, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────────
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

interface Activity {
  id: string;
  type: string;
  outcome?: string;
  notes?: string;
  duration_seconds?: number;
  created_at: string;
}

interface Stats {
  total: number; hot: number; warm: number; cold: number;
  converted: number; lost: number; followupDue: number; winRate: number;
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type==='success'?'bg-emerald-600':type==='error'?'bg-red-600':'bg-blue-600'}`}>
      {type==='success'?<BadgeCheck className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100"/></button>
    </motion.div>
  );
}

const STATUS_COLORS: Record<string,string> = {
  New:'bg-blue-100 text-blue-700', Contacted:'bg-purple-100 text-purple-700',
  Interested:'bg-amber-100 text-amber-700', 'Not Interested':'bg-slate-100 text-slate-500',
  Converted:'bg-green-100 text-green-700', Lost:'bg-red-100 text-red-500',
};
const PRIORITY_COLORS: Record<string,string> = {
  Hot:'bg-red-100 text-red-700', Warm:'bg-orange-100 text-orange-700', Cold:'bg-sky-100 text-sky-700',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

const SOURCE_COLORS: Record<string,string> = {
  'Manual':'#3B82F6','Facebook':'#8B5CF6','Google':'#F59E0B','Website':'#10B981',
  'Referral':'#F97316','WhatsApp':'#22C55E','Instagram':'#EF4444','LinkedIn':'#2563EB','Meta Ads':'#6366F1',
};

const PAGE_SIZE = 10;

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const router = useRouter();
  const csvRef = useRef<HTMLInputElement>(null);

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats>({ total:0,hot:0,warm:0,cold:0,converted:0,lost:0,followupDue:0,winRate:0 });

  // UI
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailTab, setDetailTab] = useState<'details'|'history'|'actions'>('details');
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_at'|'name'|'conversion_probability'|'next_followup'>('created_at');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list'|'pipeline'>('list');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isSendMarketingOpen, setIsSendMarketingOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<Lead | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'|'info'}|null>(null);
  const showToast = useCallback((msg:string,type:'success'|'error'|'info'='success')=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),4000);
  },[]);

  // Forms
  const [newLead, setNewLead] = useState({name:'',phone:'',email:'',company:'',location:'',source:'Manual',priority:'Warm',notes:''});
  const [addLoading, setAddLoading] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editFollowup, setEditFollowup] = useState('');
  const [editProb, setEditProb] = useState(50);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actForm, setActForm] = useState({type:'Call',outcome:'Connected',notes:'',duration_seconds:0});
  const [actLoading, setActLoading] = useState(false);
  const [mktForm, setMktForm] = useState({listId:'',createNew:false,newListName:''});
  const [mktLoading, setMktLoading] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (silent=false)=>{
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('/sales/leads');
      const data: Lead[] = res.data.data.leads || [];
      setLeads(data);
      const hot=data.filter(l=>l.priority==='Hot').length;
      const warm=data.filter(l=>l.priority==='Warm').length;
      const cold=data.filter(l=>l.priority==='Cold').length;
      const converted=data.filter(l=>l.status==='Converted').length;
      const lost=data.filter(l=>l.status==='Lost').length;
      const followupDue=data.filter(l=>l.next_followup&&new Date(l.next_followup)<=new Date()).length;
      const winRate=data.length?Math.round((converted/data.length)*100):0;
      setStats({total:data.length,hot,warm,cold,converted,lost,followupDue,winRate});
    } catch {
      showToast('Using demo data — could not fetch leads','info');
    } finally { setLoading(false); setRefreshing(false); }
  },[showToast]);

  useEffect(()=>{ fetchLeads(); },[fetchLeads]);

  useEffect(()=>{
    if (!selectedLead) return;
    setEditNotes(selectedLead.notes||'');
    setEditStatus(selectedLead.status||'New');
    setEditPriority(selectedLead.priority||'Warm');
    setEditFollowup(selectedLead.next_followup?new Date(selectedLead.next_followup).toISOString().slice(0,16):'');
    setEditProb(selectedLead.conversion_probability||50);
    setDetailTab('details');
    setActivities([]);
    api.get(`/sales/leads/${selectedLead.id}/activity`)
      .then(r=>setActivities(r.data.data.activities||[]))
      .catch(()=>setActivities([]));
  },[selectedLead?.id]);

  // ── Filtering + Sorting ────────────────────────────────────────────────────────
  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.name.toLowerCase().includes(q)||(l.phone||'').includes(q)||
        (l.company||'').toLowerCase().includes(q)||(l.email||'').toLowerCase().includes(q);
      const matchPriority = !priorityFilter || l.priority===priorityFilter;
      const matchSource = !sourceFilter || l.source===sourceFilter || l.platform===sourceFilter;
      const matchStatus = !statusFilter || l.status===statusFilter;
      if (activeTab==='Hot') return matchSearch&&l.priority==='Hot';
      if (activeTab==='Follow-up') return matchSearch&&!!l.next_followup&&new Date(l.next_followup)<=new Date(Date.now()+24*3600*1000);
      if (activeTab==='Converted') return matchSearch&&l.status==='Converted';
      if (activeTab==='Lost') return matchSearch&&l.status==='Lost';
      return matchSearch&&matchPriority&&matchSource&&matchStatus;
    })
    .sort((a,b)=>{
      let va:any, vb:any;
      if (sortBy==='name') { va=a.name||''; vb=b.name||''; }
      else if (sortBy==='conversion_probability') { va=a.conversion_probability||0; vb=b.conversion_probability||0; }
      else if (sortBy==='next_followup') { va=a.next_followup||''; vb=b.next_followup||''; }
      else { va=a.created_at||''; vb=b.created_at||''; }
      if (va < vb) return sortDir==='asc'?-1:1;
      if (va > vb) return sortDir==='asc'?1:-1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageLeads = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // reset page when filter changes
  useEffect(()=>setPage(1),[search,priorityFilter,sourceFilter,statusFilter,activeTab,sortBy,sortDir]);

  // ── CSV Import ────────────────────────────────────────────────────────────────
  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_'));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: any = {};
        headers.forEach((h,i) => { obj[h] = vals[i]?.trim() || ''; });
        return obj;
      }).filter(r => r.name || r.full_name);
      setCsvRows(rows);
      setIsImportOpen(true);
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = '';
  }

  async function handleCSVImport() {
    setCsvImporting(true);
    let imported = 0;
    for (const row of csvRows.slice(0,50)) {
      try {
        await api.post('/sales/leads', {
          name: row.name || row.full_name || 'Unknown',
          phone: row.phone || row.mobile || '',
          email: row.email || '',
          company: row.company || row.company_name || '',
          source: row.source || 'CSV Import',
          priority: row.priority || 'Warm',
          notes: row.notes || row.note || '',
        });
        imported++;
      } catch { /* skip duplicates */ }
    }
    setCsvImporting(false);
    setIsImportOpen(false);
    setCsvRows([]);
    showToast(`${imported} leads imported from CSV!`);
    fetchLeads(true);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault(); setAddLoading(true);
    try {
      const res = await api.post('/sales/leads', newLead);
      const lead = res.data.data.lead;
      setLeads(prev=>[lead,...prev]);
      setStats(s=>({...s,total:s.total+1,hot:newLead.priority==='Hot'?s.hot+1:s.hot}));
      setIsAddOpen(false);
      setNewLead({name:'',phone:'',email:'',company:'',location:'',source:'Manual',priority:'Warm',notes:''});
      showToast('Lead created!');
    } catch (err:any) { showToast(err?.response?.data?.message||'Failed to create lead','error'); }
    finally { setAddLoading(false); }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return; setSaveLoading(true);
    try {
      const res = await api.patch(`/sales/leads/${selectedLead.id}`,
        {notes:editNotes,status:editStatus,priority:editPriority,next_followup:editFollowup||null,conversion_probability:editProb});
      const updated: Lead = res.data.data.lead;
      setLeads(prev=>prev.map(l=>l.id===updated.id?updated:l));
      setSelectedLead(updated);
      showToast('Lead updated!');
    } catch (err:any) { showToast(err?.response?.data?.message||'Failed to update','error'); }
    finally { setSaveLoading(false); }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedLead) return; setActLoading(true);
    try {
      await api.post('/sales/activities',{lead_id:selectedLead.id,...actForm});
      const r = await api.get(`/sales/leads/${selectedLead.id}/activity`);
      setActivities(r.data.data.activities||[]);
      setIsLogActivityOpen(false);
      setActForm({type:'Call',outcome:'Connected',notes:'',duration_seconds:0});
      showToast('Activity logged!');
    } catch (err:any) { showToast(err?.response?.data?.message||'Failed to log','error'); }
    finally { setActLoading(false); }
  };

  const handleDeleteLead = async () => {
    if (!isDeleteOpen) return;
    const {id,name} = isDeleteOpen; setIsDeleteOpen(null);
    setLeads(prev=>prev.filter(l=>l.id!==id));
    if (selectedLead?.id===id) setSelectedLead(null);
    try { await api.delete(`/sales/leads/${id}`); showToast(`"${name}" deleted`); }
    catch (err:any) { fetchLeads(true); showToast(err?.response?.data?.message||'Delete failed','error'); }
  };

  const handleSendToMarketing = async (e: React.FormEvent) => {
    e.preventDefault(); setMktLoading(true);
    const targets = bulkMode?Array.from(selectedForBulk):(selectedLead?[selectedLead.id]:[]);
    if (!targets.length) { showToast('No leads selected','error'); setMktLoading(false); return; }
    try {
      await api.post('/marketing/contacts/import',{
        listId:mktForm.createNew?undefined:mktForm.listId||undefined,
        createList:mktForm.createNew, listName:mktForm.createNew?mktForm.newListName:undefined,
        contacts:leads.filter(l=>targets.includes(l.id)).map(l=>({name:l.name,email:l.email,phone:l.phone,company:l.company,source:l.source}))
      });
      setIsSendMarketingOpen(false); setSelectedForBulk(new Set()); setBulkMode(false);
      setMktForm({listId:'',createNew:false,newListName:''}); showToast(`${targets.length} lead(s) sent to marketing!`);
    } catch (err:any) { showToast(err?.response?.data?.message||'Marketing failed','error'); }
    finally { setMktLoading(false); }
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy===col ? (sortDir==='asc'?<SortAsc className="w-3 h-3"/>:<SortDesc className="w-3 h-3"/>)
    : <ArrowUpDown className="w-3 h-3 opacity-40"/>;

  // ── Analytics data ─────────────────────────────────────────────────────────────
  const sourceData = Object.entries(
    leads.reduce((acc,l)=>{ const s=l.source||'Manual'; acc[s]=(acc[s]||0)+1; return acc; },{} as Record<string,number>)
  ).map(([name,value])=>({name,value,color:SOURCE_COLORS[name]||'#94A3B8'}));

  const statusData = ['New','Contacted','Interested','Converted','Lost'].map(s=>({
    name:s, value:leads.filter(l=>l.status===s).length, color:s==='Converted'?'#10B981':s==='Lost'?'#EF4444':s==='Interested'?'#F59E0B':s==='Contacted'?'#8B5CF6':'#3B82F6'
  }));

  const statCards = [
    {label:'Total Leads',   value:stats.total,        icon:Users,       color:'text-blue-600',   bg:'bg-blue-50',   href:''      },
    {label:'Hot Leads',     value:stats.hot,           icon:Flame,       color:'text-red-600',    bg:'bg-red-50',    href:'Hot'   },
    {label:'Follow-up Due', value:stats.followupDue,   icon:Clock,       color:'text-amber-600',  bg:'bg-amber-50',  href:'Follow-up'},
    {label:'Converted',     value:stats.converted,     icon:CheckCircle2,color:'text-green-600',  bg:'bg-green-50',  href:'Converted'},
    {label:'Win Rate',      value:`${stats.winRate}%`, icon:Target,      color:'text-purple-600', bg:'bg-purple-50', href:''      },
    {label:'Lost',          value:stats.lost,          icon:AlertCircle, color:'text-slate-400',  bg:'bg-slate-50',  href:'Lost'  },
  ];

  const sources = [...new Set(leads.map(l=>l.source||'Manual').filter(Boolean))];

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>

      {/* Hidden CSV input */}
      <input ref={csvRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleCSVFile}/>

      {/* ── Header ── */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)'}} className="rounded-2xl p-5 text-white">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2"><Users className="w-5 h-5"/> Leads Management</h2>
            <p className="text-blue-200 text-xs mt-0.5">{filtered.length} of {leads.length} leads · {stats.hot} hot · {stats.winRate}% win rate</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>fetchLeads(true)} disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing?'animate-spin':''}`}/>
            </button>
            <button onClick={()=>csvRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition">
              <Upload className="w-3.5 h-3.5"/> Import CSV
            </button>
            <button onClick={()=>setShowAnalytics(v=>!v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${showAnalytics?'bg-white text-blue-700':'bg-white/10 hover:bg-white/20 text-white'}`}>
              <BarChart2 className="w-3.5 h-3.5"/> Analytics
            </button>
            {bulkMode ? (
              <>
                <button onClick={()=>{setBulkMode(false);setSelectedForBulk(new Set())}}
                  className="px-3 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition">Cancel</button>
                <button onClick={()=>{if(selectedForBulk.size)setIsSendMarketingOpen(true)}} disabled={!selectedForBulk.size}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">
                  <Send className="w-3.5 h-3.5"/> Send ({selectedForBulk.size})
                </button>
              </>
            ) : (
              <button onClick={()=>setBulkMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition">
                <List className="w-3.5 h-3.5"/> Bulk
              </button>
            )}
            <button onClick={()=>setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-xs font-extrabold rounded-xl transition hover:bg-blue-50 shadow-sm">
              <Plus className="w-4 h-4"/> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* ── Analytics Panel ── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Source distribution */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><PieIcon className="w-3.5 h-3.5 text-violet-500"/> Lead Sources</p>
              <div style={{height:140}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" outerRadius={55} paddingAngle={3} dataKey="value">
                      {sourceData.map((e,i)=><Cell key={i} fill={e.color||'#3B82F6'}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:10,borderRadius:8}} formatter={(v:any,name:any)=>[v,name]}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-1">
                {sourceData.slice(0,4).map((s,i)=>(
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:s.color||'#3B82F6'}}/><span className="text-slate-600">{s.name}</span></div>
                    <span className="font-extrabold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Status bar */}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-blue-500"/> By Status</p>
              <div style={{height:180}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{top:4,right:4,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontSize:8,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:8,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
                    <Bar dataKey="value" radius={[4,4,0,0]}>
                      {statusData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Quick stats */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-500"/> Summary</p>
              {[
                {label:'Total Leads',    val:stats.total,          color:'text-blue-600'},
                {label:'Hot Leads',      val:stats.hot,            color:'text-red-600'},
                {label:'Converted',      val:stats.converted,      color:'text-green-600'},
                {label:'Lost',           val:stats.lost,           color:'text-slate-400'},
                {label:'Win Rate',       val:`${stats.winRate}%`,  color:'text-purple-600'},
                {label:'Follow-up Due',  val:stats.followupDue,    color:'text-amber-600'},
              ].map(r=>(
                <div key={r.label} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                  <span className="font-semibold text-slate-500">{r.label}</span>
                  <span className={`font-extrabold ${r.color}`}>{r.val}</span>
                </div>
              ))}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><Sparkles className="w-3 h-3"/>AI Insight</p>
                <p className="text-xs font-semibold text-blue-800 mt-0.5">
                  {stats.hot>0?`${stats.hot} hot leads ready to convert. Focus on follow-ups today!`:'Keep nurturing leads. Add more to grow your pipeline.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card=>(
          <div key={card.label} onClick={()=>card.href&&setActiveTab(card.href)}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`}/>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800 leading-none">{card.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Sort + Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <input type="text" placeholder="Search by name, phone, email, company..."
              value={search} onChange={e=>setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"/>
            {search && <button onClick={()=>setSearch('')}><X className="w-3 h-3 text-slate-400"/></button>}
          </div>
          {/* Sort */}
          <div className="flex gap-1.5">
            {([['name','Name'],['conversion_probability','Win%'],['created_at','Date'],['next_followup','Follow-up']] as [typeof sortBy,string][]).map(([col,lbl])=>(
              <button key={col} onClick={()=>toggleSort(col)}
                className={`flex items-center gap-1 px-2.5 py-2 border rounded-xl text-[10px] font-bold transition ${sortBy===col?'border-blue-500 text-blue-600 bg-blue-50':'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {lbl} <SortIcon col={col}/>
              </button>
            ))}
          </div>
          <button onClick={()=>setShowFilters(f=>!f)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition shrink-0 ${showFilters?'border-blue-500 text-blue-600 bg-blue-50':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5"/> Filters {(priorityFilter||sourceFilter||statusFilter)?'·':''}{priorityFilter||sourceFilter||statusFilter}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="overflow-hidden space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
                {['','Hot','Warm','Cold'].map(p=>(
                  <button key={p} onClick={()=>setPriorityFilter(p)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${priorityFilter===p?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {p||'All'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                {['','New','Contacted','Interested','Not Interested','Converted','Lost'].map(s=>(
                  <button key={s} onClick={()=>setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter===s?'bg-indigo-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s||'All'}
                  </button>
                ))}
              </div>
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source:</span>
                  {['', ...sources].map(s=>(
                    <button key={s} onClick={()=>setSourceFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${sourceFilter===s?'bg-violet-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {s||'All'}
                    </button>
                  ))}
                </div>
              )}
              {(priorityFilter||sourceFilter||statusFilter) && (
                <button onClick={()=>{setPriorityFilter('');setSourceFilter('');setStatusFilter('');}}
                  className="text-[10px] font-bold text-red-500 hover:underline">Clear all filters</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {(['All','Hot','Follow-up','Converted','Lost'] as const).map(tab=>{
          const counts:Record<string,number>={All:leads.length,'Hot':stats.hot,'Follow-up':stats.followupDue,Converted:stats.converted,Lost:stats.lost};
          return (
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`flex items-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${activeTab===tab?'bg-[#2563EB] text-white shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>
              {tab==='Hot'?'Hot 🔥':tab}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab===tab?'bg-white/20 text-white':'bg-slate-100 text-slate-500'}`}>
                {counts[tab]??0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : pageLeads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2"/>
              <p className="text-xs text-slate-400 font-semibold">No leads found.</p>
              {(search||priorityFilter||statusFilter) && (
                <button onClick={()=>{setSearch('');setPriorityFilter('');setStatusFilter('');}} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {pageLeads.map(lead => (
                <motion.div key={lead.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                  onClick={()=>!bulkMode&&setSelectedLead(lead)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md group ${
                    selectedLead?.id===lead.id&&!bulkMode?'border-blue-500 ring-1 ring-blue-200':'border-slate-200 hover:border-slate-300'}`}>
                  <div className="p-4 flex items-center gap-3">
                    {bulkMode && (
                      <input type="checkbox" checked={selectedForBulk.has(lead.id)}
                        onChange={e=>{e.stopPropagation();const n=new Set(selectedForBulk);n.has(lead.id)?n.delete(lead.id):n.add(lead.id);setSelectedForBulk(n);}}
                        onClick={e=>e.stopPropagation()} className="w-4 h-4 accent-blue-600 shrink-0"/>
                    )}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      lead.priority==='Hot'?'from-red-500 to-orange-500':lead.priority==='Warm'?'from-amber-500 to-yellow-400':'from-blue-400 to-indigo-500'}`}>
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{lead.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${PRIORITY_COLORS[lead.priority]||'bg-slate-100 text-slate-600'}`}>
                          {lead.priority==='Hot'?'Hot 🔥':lead.priority}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${STATUS_COLORS[lead.status]||'bg-slate-100 text-slate-600'}`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {lead.company||'Private'}{lead.phone?` · ${lead.phone}`:''}{lead.email?` · ${lead.email}`:''}
                      </p>
                      {lead.next_followup && (
                        <p className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${new Date(lead.next_followup)<new Date()?'text-red-500':'text-amber-600'}`}>
                          <Clock className="w-2.5 h-2.5"/> Follow-up: {fmtDateTime(lead.next_followup)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {lead.conversion_probability != null && (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                          <span className="text-[10px] font-bold text-slate-400">Win %</span>
                          <span className={`text-sm font-extrabold ${(lead.conversion_probability||0)>=70?'text-green-600':(lead.conversion_probability||0)>=40?'text-amber-600':'text-red-500'}`}>
                            {lead.conversion_probability}%
                          </span>
                        </div>
                      )}
                      <button onClick={e=>{e.stopPropagation();if(lead.phone)window.open(`tel:${lead.phone}`)}} disabled={!lead.phone}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-30">
                        <Phone className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={e=>{e.stopPropagation();if(lead.email)window.open(`mailto:${lead.email}`)}} disabled={!lead.email}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition disabled:opacity-30">
                        <Mail className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={e=>{e.stopPropagation();setSelectedLead(lead);setIsSendMarketingOpen(true)}}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition">
                        <Send className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={e=>{e.stopPropagation();setIsDeleteOpen(lead)}}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{lead.source||'Manual'}</span>
                    {lead.location && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5"/>{lead.location}</span>}
                    <span className="text-[9px] text-slate-400 ml-auto">Added {fmtDate(lead.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold">
                Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length} leads
              </p>
              <div className="flex items-center gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                  let p = i+1;
                  if (totalPages>5&&page>3) p = page-2+i;
                  if (p>totalPages) return null;
                  return (
                    <button key={p} onClick={()=>setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${page===p?'bg-blue-600 text-white':'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}

          {/* AI Bar */}
          {!loading && leads.length>0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0"/>
                <p className="text-[11px] font-semibold text-blue-900">
                  {stats.hot>0?`You have ${stats.hot} hot lead${stats.hot>1?'s':''} — prioritise follow-ups today.`
                    :stats.followupDue>0?`${stats.followupDue} follow-up${stats.followupDue>1?'s':''} overdue. Take action now.`
                    :'All caught up! Keep nurturing your pipeline.'}
                </p>
              </div>
              <button onClick={()=>router.push('/sales/tasks')} className="text-[10px] font-bold text-blue-600 hover:underline uppercase shrink-0">Tasks →</button>
            </div>
          )}
        </div>

        {/* ── Lead Detail Panel ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
          {selectedLead ? (
            <div className="flex flex-col">
              {/* Header */}
              <div className={`p-4 border-b border-slate-100 flex items-start justify-between gap-2 ${
                selectedLead.priority==='Hot'?'bg-gradient-to-r from-red-50 to-orange-50':'bg-gradient-to-r from-slate-50 to-white'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 ${
                    selectedLead.priority==='Hot'?'from-red-500 to-orange-500':selectedLead.priority==='Warm'?'from-amber-500 to-yellow-400':'from-blue-400 to-indigo-500'}`}>
                    {selectedLead.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{selectedLead.name}</h4>
                    <p className="text-[10px] text-slate-500">{selectedLead.phone||selectedLead.email||'No contact info'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[selectedLead.priority]||''}`}>{selectedLead.priority}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[selectedLead.status]||''}`}>{selectedLead.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={()=>setSelectedLead(null)} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 shrink-0">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* Quick action row */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                {[
                  {label:'Call',   color:'bg-blue-50 hover:bg-blue-100 text-blue-700',   icon:Phone,    action:()=>{if(selectedLead.phone)window.open(`tel:${selectedLead.phone}`)}},
                  {label:'Email',  color:'bg-green-50 hover:bg-green-100 text-green-700', icon:Mail,    action:()=>{if(selectedLead.email)window.open(`mailto:${selectedLead.email}`)}},
                  {label:'Log',    color:'bg-amber-50 hover:bg-amber-100 text-amber-700', icon:Activity,action:()=>setIsLogActivityOpen(true)},
                  {label:'Market', color:'bg-purple-50 hover:bg-purple-100 text-purple-700',icon:Send,   action:()=>setIsSendMarketingOpen(true)},
                ].map((b,i)=>(
                  <button key={i} onClick={b.action}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl ${b.color} text-xs font-bold transition`}>
                    <b.icon className="w-3.5 h-3.5"/> {b.label}
                  </button>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 text-xs">
                {(['details','history','actions'] as const).map(t=>(
                  <button key={t} onClick={()=>setDetailTab(t)}
                    className={`flex-1 py-2.5 font-bold capitalize border-b-2 transition ${detailTab===t?'border-blue-500 text-blue-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {t==='history'?'Timeline':t==='actions'?'More':'Details'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4 text-xs">
                {detailTab==='details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {label:'Phone',    value:selectedLead.phone||'—'},
                        {label:'Email',    value:selectedLead.email||'—'},
                        {label:'Company',  value:selectedLead.company||'—'},
                        {label:'Location', value:selectedLead.location||'—'},
                        {label:'Source',   value:selectedLead.source||'—'},
                        {label:'Created',  value:fmtDate(selectedLead.created_at)},
                      ].map(({label,value})=>(
                        <div key={label}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">{label}</span>
                          <span className="font-semibold text-slate-800 break-all text-[11px]">{value}</span>
                        </div>
                      ))}
                    </div>
                    {/* AI Insights */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                      <p className="font-bold text-blue-700 flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3"/>AI Insights</p>
                      <p className="text-[10px] text-blue-800 leading-snug">Win probability: <strong>{selectedLead.conversion_probability||editProb}%</strong></p>
                      <p className="text-[10px] text-blue-700 mt-1">Best time to call: Today 4:00 PM – 6:00 PM</p>
                      <p className="text-[10px] text-blue-700">Suggested: Schedule a follow-up call</p>
                    </div>
                    {/* Win probability slider */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex justify-between font-bold text-slate-500 mb-2">
                        <span>Win Probability (AI)</span>
                        <span className={`${editProb>=70?'text-green-600':editProb>=40?'text-amber-600':'text-red-500'}`}>{editProb}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={editProb} onChange={e=>setEditProb(Number(e.target.value))} className="w-full accent-blue-600"/>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${editProb>=70?'bg-green-500':editProb>=40?'bg-amber-500':'bg-red-500'}`} style={{width:`${editProb}%`}}/>
                      </div>
                    </div>
                    {/* Edit fields */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <p className="font-bold text-slate-700">Update Lead</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                          <select value={editStatus} onChange={e=>setEditStatus(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500">
                            {['New','Contacted','Interested','Not Interested','Converted','Lost'].map(st=><option key={st}>{st}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                          <select value={editPriority} onChange={e=>setEditPriority(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500">
                            {['Hot','Warm','Cold'].map(pr=><option key={pr}>{pr}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Next Follow-up</label>
                        <input type="datetime-local" value={editFollowup} onChange={e=>setEditFollowup(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white text-xs focus:border-blue-500"/>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                        <textarea rows={3} value={editNotes} onChange={e=>setEditNotes(e.target.value)}
                          placeholder="Log discussion notes..."
                          className="w-full p-2 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition"/>
                      </div>
                      <button onClick={handleUpdateLead} disabled={saveLoading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                        {saveLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<CheckCircle2 className="w-3.5 h-3.5"/>}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {detailTab==='history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-700">Activity Timeline</p>
                      <button onClick={()=>setIsLogActivityOpen(true)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3"/> Log
                      </button>
                    </div>
                    {activities.length===0?(
                      <div className="py-8 text-center">
                        <Activity className="w-6 h-6 text-slate-200 mx-auto mb-1"/>
                        <p className="text-[10px] text-slate-400">No activities yet. Log a call, email or meeting.</p>
                      </div>
                    ):(
                      <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                        {activities.map((act,i)=>(
                          <div key={i} className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100"/>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                              <span>{act.type}</span><span>{fmtDateTime(act.created_at)}</span>
                            </div>
                            {act.outcome&&<p className="font-bold text-slate-800">Outcome: {act.outcome}</p>}
                            {act.notes&&<p className="text-slate-500 mt-0.5 leading-snug">{act.notes}</p>}
                            {act.duration_seconds?<p className="text-slate-400 mt-0.5">{Math.round(act.duration_seconds/60)} min</p>:null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailTab==='actions' && (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-700">More Actions</p>
                    <div className="space-y-2">
                      {[
                        {label:'Log Activity',     desc:'Record a call, email or meeting', icon:Activity, bg:'bg-amber-50', color:'text-amber-600', action:()=>setIsLogActivityOpen(true)},
                        {label:'Send to Marketing',desc:'Add to email list & automation',   icon:Send,     bg:'bg-purple-50',color:'text-purple-600',action:()=>setIsSendMarketingOpen(true)},
                        {label:'Create Task',      desc:'Schedule a follow-up task',        icon:Calendar, bg:'bg-indigo-50',color:'text-indigo-600',action:()=>router.push('/sales/tasks')},
                        {label:'View Pipeline',    desc:'See in kanban pipeline view',      icon:GitBranch,bg:'bg-blue-50',  color:'text-blue-600',  action:()=>router.push('/sales/leads/pipeline')},
                        {label:'Delete Lead',      desc:'Permanently remove this lead',     icon:Trash2,   bg:'bg-red-50',  color:'text-red-500',   action:()=>setIsDeleteOpen(selectedLead),danger:true},
                      ].map((b,i)=>(
                        <button key={i} onClick={b.action}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${b.danger?'border-red-100 hover:bg-red-50':'border-slate-200 hover:bg-slate-50'}`}>
                          <div className={`w-8 h-8 ${b.bg} rounded-xl flex items-center justify-center shrink-0`}>
                            <b.icon className={`w-4 h-4 ${b.color}`}/>
                          </div>
                          <div>
                            <p className={`font-bold ${b.danger?'text-red-600':'text-slate-800'}`}>{b.label}</p>
                            <p className="text-[10px] text-slate-400">{b.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center min-h-[40vh]">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-slate-300"/>
              </div>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                Select a lead to view details, log activity, and take action.
              </p>
              <button onClick={()=>setIsAddOpen(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">
                <Plus className="w-3.5 h-3.5"/> Add New Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────── MODALS ─────────────────── */}

      {/* Add Lead */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsAddOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Create New Lead</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assigned to you automatically</p>
                </div>
                <button onClick={()=>setIsAddOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleAddLead} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:'Full Name *', key:'name', type:'text', placeholder:'Rahul Sharma', required:true},
                    {label:'Phone',       key:'phone', type:'text', placeholder:'+91 98765 43210'},
                    {label:'Email',       key:'email', type:'email',placeholder:'rahul@company.com'},
                    {label:'Company',     key:'company',type:'text',placeholder:'Company name'},
                    {label:'Location',    key:'location',type:'text',placeholder:'Delhi, India'},
                  ].map(f=>(
                    <div key={f.key} className={f.key==='name'?'col-span-2':''}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
                      <input required={f.required} type={f.type} placeholder={f.placeholder}
                        value={(newLead as any)[f.key]} onChange={e=>setNewLead({...newLead,[f.key]:e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Source</label>
                    <select value={newLead.source} onChange={e=>setNewLead({...newLead,source:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Manual','Facebook','Google','Instagram','LinkedIn','Website','Referral','WhatsApp'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <select value={newLead.priority} onChange={e=>setNewLead({...newLead,priority:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Hot','Warm','Cold'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                  <textarea rows={3} placeholder="Initial discussion, requirements, budget..."
                    value={newLead.notes} onChange={e=>setNewLead({...newLead,notes:e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition"/>
                </div>
                <button type="submit" disabled={addLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-blue-500/20">
                  {addLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                  Create Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Preview */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsImportOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl relative z-10 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500"/> Import from CSV</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{csvRows.length} leads detected (max 50 imported at once)</p>
                </div>
                <button onClick={()=>setIsImportOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {csvRows.slice(0,10).map((row,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{row.name||row.full_name||'—'}</p>
                      <p className="text-slate-400">{row.phone||row.mobile||'No phone'} · {row.email||'No email'}</p>
                    </div>
                    <span className="font-semibold text-slate-500">{row.source||'CSV Import'}</span>
                  </div>
                ))}
                {csvRows.length>10 && <p className="text-center text-[10px] text-slate-400">+{csvRows.length-10} more leads…</p>}
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                <p className="text-[10px] text-blue-700 font-semibold">CSV columns supported: name (or full_name), phone (or mobile), email, company, source, priority, notes, location</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setIsImportOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleCSVImport} disabled={csvImporting||csvRows.length===0}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 text-xs">
                  {csvImporting?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Upload className="w-4 h-4"/>}
                  Import {Math.min(csvRows.length,50)} Leads
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Activity */}
      <AnimatePresence>
        {isLogActivityOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsLogActivityOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div><h3 className="text-sm font-bold text-slate-800">Log Activity</h3><p className="text-[10px] text-slate-400 mt-0.5">For: {selectedLead.name}</p></div>
                <button onClick={()=>setIsLogActivityOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleLogActivity} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activity Type</label>
                    <select value={actForm.type} onChange={e=>setActForm({...actForm,type:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call','Email','Meeting','WhatsApp','Demo','Follow-up'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outcome</label>
                    <select value={actForm.outcome} onChange={e=>setActForm({...actForm,outcome:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Connected','No Answer','Interested','Not Interested','Callback Requested','Converted','Voicemail'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration (minutes)</label>
                  <input type="number" min={0} placeholder="0" value={actForm.duration_seconds?actForm.duration_seconds/60:''}
                    onChange={e=>setActForm({...actForm,duration_seconds:Number(e.target.value)*60})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:border-blue-500 transition"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                  <textarea rows={3} required placeholder="What was discussed?" value={actForm.notes}
                    onChange={e=>setActForm({...actForm,notes:e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition"/>
                </div>
                <button type="submit" disabled={actLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {actLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Activity className="w-4 h-4"/>}
                  Log Activity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send to Marketing */}
      <AnimatePresence>
        {isSendMarketingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsSendMarketingOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div><h3 className="text-sm font-bold text-slate-800">Send to Marketing</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{bulkMode?`${selectedForBulk.size} leads`:selectedLead?selectedLead.name:''}</p></div>
                <button onClick={()=>setIsSendMarketingOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleSendToMarketing} className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  {[{v:false,l:'Existing list'},{v:true,l:'New list'}].map(opt=>(
                    <label key={String(opt.v)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={mktForm.createNew===opt.v} onChange={()=>setMktForm({...mktForm,createNew:opt.v})} className="accent-purple-600"/>
                      <span className="font-semibold text-slate-700">{opt.l}</span>
                    </label>
                  ))}
                </div>
                {mktForm.createNew?(
                  <input type="text" required placeholder="New list name (e.g. Hot Leads June)" value={mktForm.newListName}
                    onChange={e=>setMktForm({...mktForm,newListName:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-purple-500 font-semibold text-slate-800 transition"/>
                ):(
                  <select required={!mktForm.createNew} value={mktForm.listId} onChange={e=>setMktForm({...mktForm,listId:e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-purple-500">
                    <option value="">— Select a list —</option>
                  </select>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setIsSendMarketingOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={mktLoading}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                    {mktLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Send className="w-4 h-4"/>}
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsDeleteOpen(null)}/>
            <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl relative z-10 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500"/>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Delete Lead?</h3>
              <p className="text-xs text-slate-500 mb-5">"{isDeleteOpen.name}" will be permanently deleted.</p>
              <div className="flex gap-2">
                <button onClick={()=>setIsDeleteOpen(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleDeleteLead} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
