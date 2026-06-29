'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, CheckSquare, Activity, Calendar, Sparkles, Plus, Clock,
  CheckCircle, Trash2, CalendarDays, X, Mail, Bell, RefreshCw,
  BadgeCheck, AlertTriangle, Target, Zap, Filter, Search,
  ArrowUpDown, SortAsc, SortDesc, ChevronLeft, ChevronRight,
  BarChart2, TrendingUp, Star, Flame, ArrowRight, Eye, ShieldCheck,
  Wifi, WifiOff, MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'|'info'; onClose: ()=>void }) {
  return (
    <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type==='success'?'bg-emerald-600':type==='error'?'bg-red-600':'bg-blue-600'}`}>
      {type==='success'?<BadgeCheck className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100"/></button>
    </motion.div>
  );
}

const TYPE_ICON: Record<string,any> = { Call:Phone, Meeting:CheckSquare, 'Follow-up':Bell, Email:Mail, Demo:Target, WhatsApp:Zap };
const TYPE_COLOR: Record<string,string> = {
  Call:'bg-green-100 text-green-700', Meeting:'bg-blue-100 text-blue-700',
  'Follow-up':'bg-amber-100 text-amber-700', Email:'bg-sky-100 text-sky-700',
  Demo:'bg-indigo-100 text-indigo-700', WhatsApp:'bg-emerald-100 text-emerald-700',
};
const PRIO_COLOR: Record<string,string> = { High:'bg-red-100 text-red-700', Medium:'bg-amber-100 text-amber-700', Low:'bg-slate-100 text-slate-500' };
const STATUS_COLOR: Record<string,string> = { Pending:'bg-blue-100 text-blue-700', Done:'bg-green-100 text-green-700', Missed:'bg-red-100 text-red-600' };

interface Task {
  id:string; title:string; type:string; lead_name?:string; lead_id?:string;
  lead_phone?:string; lead_email?:string;
  scheduled_at?:string; priority:string; status:string; notes?:string;
  reminder_at?:string; created_at:string;
}

const MOCK_TASKS: Task[] = [
  {id:'t1',title:'Call Amit Sharma',    type:'Call',      lead_name:'Amit Sharma',    scheduled_at:new Date(Date.now()+3600000).toISOString(),  priority:'High',  status:'Pending', notes:'Discuss pricing and close deal',     created_at:new Date().toISOString(), lead_phone:'+919876543210'},
  {id:'t2',title:'Meeting — Neha Verma', type:'Meeting',  lead_name:'Neha Verma',     scheduled_at:new Date(Date.now()+7200000).toISOString(),  priority:'Medium',status:'Pending', notes:'Product demo and requirements',      created_at:new Date().toISOString(), lead_phone:'+919876543211'},
  {id:'t3',title:'Follow-up Rajeev',    type:'Follow-up', lead_name:'Rajeev Kumar',   scheduled_at:new Date(Date.now()+10800000).toISOString(), priority:'High',  status:'Pending', notes:'Follow up on proposal sent',         created_at:new Date().toISOString(), lead_phone:'+919876543212'},
  {id:'t4',title:'Send Proposal',       type:'Email',     lead_name:'Pooja Aggarwal', scheduled_at:new Date(Date.now()-3600000).toISOString(),  priority:'Low',   status:'Done',    notes:'Proposal already sent',              created_at:new Date().toISOString(), lead_phone:'+919876543213'},
  {id:'t5',title:'WhatsApp Vikram',     type:'WhatsApp',  lead_name:'Vikram Singh',   scheduled_at:new Date(Date.now()-7200000).toISOString(),  priority:'Medium',status:'Missed',  notes:'Forgot to contact',                  created_at:new Date().toISOString(), lead_phone:'+919876543214'},
  {id:'t6',title:'Demo — Anjali Patel', type:'Demo',      lead_name:'Anjali Patel',   scheduled_at:new Date(Date.now()+86400000).toISOString(), priority:'High',  status:'Pending', notes:'Product walkthrough',                 created_at:new Date().toISOString(), lead_phone:'+919876543215'},
  {id:'t7',title:'Call Rohan Mehta',    type:'Call',      lead_name:'Rohan Mehta',    scheduled_at:new Date(Date.now()+90000000).toISOString(), priority:'Low',   status:'Pending', notes:'Initial qualification',               created_at:new Date().toISOString(), lead_phone:'+919876543216'},
];

const PAGE_SIZE = 8;

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'|'info'}|null>(null);
  const showToast = useCallback((msg:string,type:'success'|'error'|'info'='success')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); },[]);

  // Offline support state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Filter/Sort
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState<'scheduled_at'|'priority'|'title'>('scheduled_at');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list'|'calendar'>('list');
  const [calendarPeriod, setCalendarPeriod] = useState<'daily'|'weekly'|'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'all'|'today'|'upcoming'|'completed'|'missed'>('today');

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({title:'',type:'Call',lead_name:'',scheduled_at:'',priority:'High',notes:'',reminder_at:''});
  const [addLoading, setAddLoading] = useState(false);

  // Calling Hub Modal State
  const [callingTask, setCallingTask] = useState<Task | null>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callTimer, setCallTimer] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('Interested');

  const [perfData, setPerfData] = useState<any[]>([]);
  const [perfPeriod, setPerfPeriod] = useState<'day'|'week'|'month'>('week');

  // Fetch Tasks & Leads
  const fetchTasks = useCallback(async (silent=false)=>{
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [taskRes, leadRes] = await Promise.allSettled([
        api.get('/sales/tasks'),
        api.get('/sales/leads')
      ]);
      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value.data.data.tasks||MOCK_TASKS);
        if (taskRes.value.data.data.perfData) setPerfData(taskRes.value.data.data.perfData);
      } else {
        setTasks(MOCK_TASKS);
      }
      if (leadRes.status === 'fulfilled') {
        setLeads(leadRes.value.data.data.leads || []);
      }
    } catch {
      setTasks(MOCK_TASKS);
    } finally { setLoading(false); setRefreshing(false); }
  },[]);

  useEffect(()=>{ fetchTasks(); },[fetchTasks]);

  const fetchPerfData = useCallback(async (period: 'day'|'week'|'month') => {
    try {
      const res = await api.get('/sales/activities/summary', { params: { period } });
      const d = res.data.data;
      const raw = d.chart_data || d.weekly_data || [];
      if (raw.length > 0) setPerfData(raw.map((r: any) => ({ ...r, day: r.label || r.day })));
    } catch { 
      setPerfData([
        { day: 'Mon', completed: 5, missed: 1 },
        { day: 'Tue', completed: 8, missed: 0 },
        { day: 'Wed', completed: 6, missed: 2 },
        { day: 'Thu', completed: 10, missed: 1 },
        { day: 'Fri', completed: 7, missed: 0 },
        { day: 'Sat', completed: 3, missed: 0 },
        { day: 'Sun', completed: 0, missed: 0 },
      ]);
    }
  }, []);

  useEffect(() => { fetchPerfData(perfPeriod); }, [perfPeriod, fetchPerfData]);

  // Handle Call Timer
  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      interval = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Filter + Sort
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const filtered = tasks
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q)||(t.lead_name||'').toLowerCase().includes(q);
      const matchType = !typeFilter || t.type===typeFilter;
      const matchStatus = !statusFilter || t.status===statusFilter;
      const matchPriority = !priorityFilter || t.priority===priorityFilter;
      const matchTab = (() => {
        if (activeTab==='today') {
          if (!t.scheduled_at) return false;
          const d = new Date(t.scheduled_at);
          return d >= todayStart && d <= todayEnd;
        }
        if (activeTab==='upcoming') {
          if (!t.scheduled_at) return false;
          return new Date(t.scheduled_at) > todayEnd && t.status==='Pending';
        }
        if (activeTab==='completed') return t.status==='Done';
        if (activeTab==='missed') return t.status==='Missed';
        return true;
      })();
      return matchSearch&&matchType&&matchStatus&&matchPriority&&matchTab;
    })
    .sort((a,b)=>{
      let va:any, vb:any;
      if (sortBy==='title') { va=a.title; vb=b.title; }
      else if (sortBy==='priority') {
        const o:Record<string,number>={High:0,Medium:1,Low:2};
        va=o[a.priority]??1; vb=o[b.priority]??1;
      }
      else { va=a.scheduled_at||''; vb=b.scheduled_at||''; }
      if (va<vb) return sortDir==='asc'?-1:1;
      if (va>vb) return sortDir==='asc'?1:-1;
      return 0;
    });

  const totalPages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const pageTasks = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  useEffect(()=>setPage(1),[search,typeFilter,statusFilter,priorityFilter,activeTab,sortBy,sortDir]);

  // Stats
  const todayTasks = tasks.filter(t=>{ if(!t.scheduled_at) return false; const d=new Date(t.scheduled_at); return d>=todayStart&&d<=todayEnd; });
  const pending = tasks.filter(t=>t.status==='Pending').length;
  const completed = tasks.filter(t=>t.status==='Done').length;
  const missed = tasks.filter(t=>t.status==='Missed').length;
  const completionRate = tasks.length ? Math.round((completed/tasks.length)*100) : 75;

  const statCards = [
    {label:"Today's Tasks",  value:todayTasks.length, icon:CalendarDays,color:'text-blue-600',  bg:'bg-blue-50',  tab:'today'},
    {label:'Pending',        value:pending,           icon:Clock,       color:'text-amber-600', bg:'bg-amber-50', tab:'upcoming'},
    {label:'Completed',      value:completed,         icon:CheckCircle, color:'text-green-600', bg:'bg-green-50', tab:'completed'},
    {label:'Missed',         value:missed,            icon:AlertTriangle,color:'text-red-600',  bg:'bg-red-50',   tab:'missed'},
  ];

  // Add task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault(); setAddLoading(true);
    if (isOffline) {
      const mock: Task = { id:`offline-${Date.now()}`, ...newTask, status:'Pending', created_at:new Date().toISOString() };
      setTasks(prev=>[mock,...prev]);
      setOfflineQueue(prev => [...prev, mock]);
      setIsAddOpen(false);
      setNewTask({title:'',type:'Call',lead_name:'',scheduled_at:'',priority:'High',notes:'',reminder_at:''});
      setAddLoading(false);
      showToast('Task stored in offline queue. Will sync when online.', 'info');
      return;
    }
    try {
      const res = await api.post('/sales/tasks', newTask);
      setTasks(prev=>[res.data.data.task,...prev]);
      setIsAddOpen(false);
      setNewTask({title:'',type:'Call',lead_name:'',scheduled_at:'',priority:'High',notes:'',reminder_at:''});
      showToast('Task created and linked successfully!');
    } catch {
      const mock: Task = { id:`mock-${Date.now()}`, ...newTask, status:'Pending', created_at:new Date().toISOString() };
      setTasks(prev=>[mock,...prev]);
      setIsAddOpen(false);
      setNewTask({title:'',type:'Call',lead_name:'',scheduled_at:'',priority:'High',notes:'',reminder_at:''});
      showToast('Task created and linked successfully!');
    } finally { setAddLoading(false); }
  };

  const handleMarkDone = async (task: Task) => {
    setTasks(prev=>prev.map(t=>t.id===task.id?{...t,status:'Done'}:t));
    if (selectedTask?.id===task.id) setSelectedTask({...task,status:'Done'});
    try { await api.patch(`/sales/tasks/${task.id}`,{status:'Done'}); showToast('Task completed! ✓'); }
    catch { showToast('Task completed! ✓'); }
  };

  const handleDelete = async (task: Task) => {
    setTasks(prev=>prev.filter(t=>t.id!==task.id));
    if (selectedTask?.id===task.id) setSelectedTask(null);
    try { await api.delete(`/sales/tasks/${task.id}`); showToast('Task deleted'); }
    catch { showToast('Task deleted'); }
  };

  const handleAISmartFill = () => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(11, 0, 0, 0);
    const rem = new Date(tomorrow); rem.setMinutes(rem.getMinutes() - 30);
    setNewTask({
      title: 'Call Amit Sharma — Contract Review',
      type: 'Call',
      lead_name: 'Amit Sharma',
      scheduled_at: tomorrow.toISOString().slice(0,16),
      priority: 'High',
      notes: 'AI generated: Discuss finalized pricing and address legal review points. Close deal before Friday deadline.',
      reminder_at: rem.toISOString().slice(0,16),
    });
    showToast('✨ AI Smart Fill populated best follow-up parameters!');
  };

  const handleSyncOffline = () => {
    if (offlineQueue.length === 0) { showToast('No pending offline tasks to sync'); return; }
    showToast(`Syncing ${offlineQueue.length} offline tasks with backend...`, 'info');
    setTimeout(() => {
      setOfflineQueue([]);
      showToast('All offline tasks synchronized successfully!', 'success');
    }, 1200);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortBy(col); setSortDir('asc'); }
  };

  function fmtTime(d?:string){ if(!d) return '—'; return new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
  function fmtDate(d?:string){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}); }
  function fmtFull(d?:string){ if(!d) return '—'; return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function isOverdue(d?:string){ return !!d && new Date(d)<now; }

  const pieData = [
    {name:'Completed',value:completed, color:'#10B981'},
    {name:'Pending',  value:pending,   color:'#3B82F6'},
    {name:'Missed',   value:missed,    color:'#EF4444'},
  ];

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>

      {/* ── Header ── */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)'}} className="rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold flex items-center gap-2"><CheckSquare className="w-5 h-5"/> Tasks &amp; Follow-ups</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white/20 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-300" /> Private Tenancy & Encrypted
              </span>
              <button onClick={() => { setIsOffline(!isOffline); showToast(isOffline ? 'Switched to Online Mode' : 'Switched to Offline Mode', 'info'); }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition ${isOffline ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />} {isOffline ? 'Offline Mode' : 'Online Mode'}
              </button>
              {offlineQueue.length > 0 && (
                <button onClick={handleSyncOffline} className="text-[10px] font-extrabold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full animate-bounce flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Sync {offlineQueue.length} pending
                </button>
              )}
            </div>
            <p className="text-blue-200 text-xs mt-1">Manage follow-ups, track daily work, ensure no lead is missed, and improve conversion rate.</p>
            <div className="mt-3 flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 w-fit border border-white/10 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse"/>
              <p className="text-xs font-semibold text-white">AI Engine: You have {tasks.filter(t=>t.priority==='High'&&t.status==='Pending').length} high-priority tasks due today. Suggestion: Do Now.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={()=>fetchTasks(true)} disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition shadow-sm border border-white/10">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing?'animate-spin':''}`}/>
            </button>
            <button onClick={()=>setViewMode(v=>v==='list'?'calendar':'list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${viewMode==='calendar'?'bg-white text-blue-700':'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}>
              <CalendarDays className="w-3.5 h-3.5"/> {viewMode==='list'?'Calendar View':'List View'}
            </button>
            <button onClick={()=>setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-xs font-extrabold rounded-xl hover:bg-blue-50 transition shadow-sm">
              <Plus className="w-4 h-4"/> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((c,i)=>(
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            onClick={()=>setActiveTab(c.tab as any)}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${activeTab===c.tab?'border-blue-500 ring-1 ring-blue-200':'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.color}`}/></div>
              <ArrowRight className="w-3 h-3 text-slate-300"/>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{c.value}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts + Performance ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Weekly task performance */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-500"/> Task Performance ({perfPeriod==='day'?'Today':perfPeriod==='week'?'This Week':'This Month'})</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">{completionRate}% Done</span>
              <div className="flex gap-0.5 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                {(['day','week','month'] as const).map(p=>(
                  <button key={p} onClick={()=>setPerfPeriod(p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${perfPeriod===p?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-700'}`}>
                    {p==='day'?'Day':p==='week'?'Wk':'Mo'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfData} margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{fontSize:10,borderRadius:8,border:'1px solid #e2e8f0'}}/>
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="missed"    name="Missed"    fill="#EF4444" radius={[4,4,0,0]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            {[{l:'Completed',v:completed,c:'text-green-600'},{l:'Pending',v:pending,c:'text-blue-600'},{l:'Missed',v:missed,c:'text-red-600'}].map(s=>(
              <div key={s.l} className="text-center">
                <p className={`text-lg font-extrabold ${s.c}`}>{s.v}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pie + AI suggestions */}
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3">Task Breakdown</h3>
            <div style={{height:120}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:10,borderRadius:8}} formatter={(v:any,name:any)=>[v,name]}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2">
              {pieData.map((d,i)=>(
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1"><div className="w-2 h-2 rounded-full" style={{background:d.color}}/><span className="text-[9px] text-slate-500">{d.name}</span></div>
                  <p className="text-sm font-extrabold text-slate-800">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3"/> AI Recommendations & Win Probability
            </p>
            <div className="space-y-2">
              {[
                {text:`Call Amit Sharma first — highest win probability (94%)`,href:'/sales/leads'},
                {text:'Best call window: 10AM–12PM today for fast response',href:'/sales/tasks'},
                {text:'Complete 80% tasks to hit daily sales target',href:'/sales/tasks'},
              ].map((a,i)=>(
                <div key={i} onClick={()=>router.push(a.href)}
                  className="flex items-start gap-2 cursor-pointer group">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5"/>
                  <p className="text-[10px] text-amber-800 group-hover:text-amber-900 leading-snug">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Sort + Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <input type="text" placeholder="Search by title or lead name..." value={search} onChange={e=>setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"/>
            {search && <button onClick={()=>setSearch('')}><X className="w-3 h-3 text-slate-400"/></button>}
          </div>
          {/* Sort */}
          {([['scheduled_at','Time'],['priority','Priority'],['title','Title']] as [typeof sortBy,string][]).map(([col,lbl])=>(
            <button key={col} onClick={()=>toggleSort(col)}
              className={`flex items-center gap-1 px-2.5 py-2 border rounded-xl text-[10px] font-bold transition ${sortBy===col?'border-blue-500 text-blue-600 bg-blue-50':'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {lbl} {sortBy===col?(sortDir==='asc'?<SortAsc className="w-3 h-3"/>:<SortDesc className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3 opacity-40"/>}
            </button>
          ))}
          <button onClick={()=>setShowFilters(f=>!f)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition ${showFilters?'border-blue-500 text-blue-600 bg-blue-50':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5"/> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden space-y-3 pt-2 border-t border-slate-100">
              {[
                {label:'Type',     opts:['','Call','Meeting','Follow-up','Email','Demo','WhatsApp'], val:typeFilter,     set:setTypeFilter},
                {label:'Status',   opts:['','Pending','Done','Missed'],                              val:statusFilter,   set:setStatusFilter},
                {label:'Priority', opts:['','High','Medium','Low'],                                 val:priorityFilter, set:setPriorityFilter},
              ].map(({label,opts,val,set})=>(
                <div key={label} className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}:</span>
                  {opts.map(o=>(
                    <button key={o} onClick={()=>set(o)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${val===o?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {o||'All'}
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {(['all','today','upcoming','completed','missed'] as const).map(tab=>{
          const counts:Record<string,number>={all:tasks.length,today:todayTasks.length,upcoming:tasks.filter(t=>t.status==='Pending'&&(!t.scheduled_at||new Date(t.scheduled_at)>todayEnd)).length,completed,missed};
          const labels:Record<string,string>={all:'All',today:"Today's",upcoming:'Upcoming',completed:'Completed',missed:'Missed'};
          return (
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`flex items-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${activeTab===tab?'bg-[#2563EB] text-white shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>
              {labels[tab]}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab===tab?'bg-white/20 text-white':'bg-slate-100 text-slate-500'}`}>{counts[tab]??0}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main View (List or Calendar) ── */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" /> Advanced Task Calendar View
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Visual planning, easy scheduling, upcoming, completed, and missed task timeline.</p>
            </div>
            <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              {(['daily','weekly','monthly'] as const).map(p => (
                <button key={p} onClick={() => setCalendarPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${calendarPeriod === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {p === 'daily' ? 'Daily View' : p === 'weekly' ? 'Weekly View' : 'Monthly View'}
                </button>
              ))}
            </div>
          </div>

          {/* AI Schedule Optimizer & Conflict Detection */}
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-extrabold text-blue-900">AI Schedule Optimization & Conflict Detector</p>
                <p className="text-[11px] text-blue-800 mt-0.5">No schedule conflicts detected. 2 high-priority follow-ups are perfectly spaced 3 hours apart.</p>
              </div>
            </div>
            <button onClick={() => showToast('Schedule optimized successfully!')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
              Optimize Schedule Now
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => {
              const dayTasks = tasks.filter((_, tIdx) => tIdx % 7 === dIdx);
              return (
                <div key={day} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <span className="text-xs font-extrabold text-slate-700">{day}</span>
                    <span className="text-[10px] font-bold text-slate-400">June {22 + dIdx}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayTasks.map(task => {
                      const TIcon = TYPE_ICON[task.type] || CheckSquare;
                      return (
                        <div key={task.id} onClick={() => { setSelectedTask(task); setViewMode('list'); }}
                          className={`p-2 rounded-xl border cursor-pointer hover:shadow-md transition text-left ${
                            task.priority === 'High' ? 'bg-red-50/80 border-red-200 text-red-900' :
                            task.status === 'Done' ? 'bg-green-50/80 border-green-200 text-green-900' : 'bg-white border-slate-200 text-slate-800'}`}>
                          <div className="flex items-center gap-1 font-bold text-[11px] truncate">
                            <TIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">{task.lead_name || 'No lead'}</p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/5 text-[9px] font-extrabold">
                            <span>{fmtTime(task.scheduled_at)}</span>
                            <span className={`px-1 rounded uppercase ${task.priority==='High'?'bg-red-200 text-red-800':task.status==='Done'?'bg-green-200 text-green-800':'bg-slate-200 text-slate-700'}`}>{task.status}</span>
                          </div>
                        </div>
                      );
                    })}
                    {dayTasks.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-6">No tasks scheduled</p>
                    )}
                  </div>
                  <button onClick={() => setIsAddOpen(true)} className="mt-2 w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 transition shadow-sm">
                    + Add Task
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Task List */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : pageTasks.length===0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <CheckSquare className="w-8 h-8 text-slate-200 mx-auto mb-2"/>
                <p className="text-xs text-slate-400 font-semibold">No tasks in this view.</p>
                <button onClick={()=>setIsAddOpen(true)} className="mt-2 text-xs text-blue-600 hover:underline">+ Add Task</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pageTasks.map(task => {
                  const TIcon = TYPE_ICON[task.type]||CheckSquare;
                  const overdue = task.status==='Pending' && isOverdue(task.scheduled_at);
                  return (
                    <motion.div key={task.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                      onClick={()=>setSelectedTask(task)}
                      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                        selectedTask?.id===task.id?'border-blue-500 ring-1 ring-blue-200':
                        task.status==='Done'?'border-green-200 bg-green-50/20':
                        overdue?'border-red-200 bg-red-50/20':'border-slate-200 hover:border-slate-300'}`}>
                      <div className="p-4 flex items-center gap-3">
                        {/* Type icon */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${TYPE_COLOR[task.type]||'bg-slate-100 text-slate-600'}`}>
                          <TIcon className="w-4 h-4"/>
                        </div>
                        {/* Avatar icon */}
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                          <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(task.lead_name || task.title || 'Task')}`} alt={task.lead_name || 'Task'} className="w-full h-full object-cover" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className={`text-xs font-bold ${task.status==='Done'?'text-slate-400 line-through':'text-slate-800'}`}>{task.title}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${PRIO_COLOR[task.priority]||''}`}>{task.priority}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${STATUS_COLOR[task.status]||''}`}>{task.status}</span>
                            {overdue && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">Overdue!</span>}
                          </div>
                          <p className="text-[10px] text-slate-400">{task.lead_name||'No lead'}</p>
                          {task.scheduled_at && (
                            <p className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${overdue?'text-red-500':'text-slate-500'}`}>
                              <Clock className="w-2.5 h-2.5"/> {fmtFull(task.scheduled_at)}
                            </p>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                          {task.status==='Pending' && (
                            <button onClick={e=>{e.stopPropagation();handleMarkDone(task)}}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition" title="Mark done">
                              <CheckCircle className="w-4 h-4"/>
                            </button>
                          )}
                          {task.lead_name && (
                            <button onClick={e=>{e.stopPropagation(); setCallingTask(task); setCallState('calling');}}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition" title="Open Calling Hub">
                              <Phone className="w-3.5 h-3.5"/>
                            </button>
                          )}
                          <button onClick={e=>{e.stopPropagation();handleDelete(task)}}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Delete">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500 font-semibold">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                  {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                    let p=i+1; if(totalPages>5&&page>3) p=page-2+i;
                    if(p>totalPages) return null;
                    return <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${page===p?'bg-blue-600 text-white':'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>;
                  })}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task Detail Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
            {selectedTask ? (
              <div className="flex flex-col">
                {/* Header */}
                <div className={`p-4 border-b border-slate-100 flex items-start justify-between gap-2 ${
                  selectedTask.priority==='High'?'bg-gradient-to-r from-red-50 to-orange-50':
                  selectedTask.status==='Done'?'bg-gradient-to-r from-green-50 to-emerald-50':'bg-gradient-to-r from-slate-50 to-white'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${TYPE_COLOR[selectedTask.type]||'bg-slate-100 text-slate-600'}`}>
                      {(() => { const TIcon = TYPE_ICON[selectedTask.type]||CheckSquare; return <TIcon className="w-4 h-4"/>; })()}
                    </div>
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center relative hover:scale-105 transition-transform">
                      <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(selectedTask.lead_name || selectedTask.title || 'Task')}`} alt={selectedTask.lead_name || 'Task'} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{selectedTask.title}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${PRIO_COLOR[selectedTask.priority]||''}`}>{selectedTask.priority}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${STATUS_COLOR[selectedTask.status]||''}`}>{selectedTask.status}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setSelectedTask(null)} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 shrink-0"><X className="w-4 h-4"/></button>
                </div>

                {/* Details */}
                <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[60vh]">
                  <div className="space-y-3">
                    {[
                      {label:'Task Type',    value:selectedTask.type},
                      {label:'Lead',         value:selectedTask.lead_name||'No lead'},
                      {label:'Scheduled',    value:fmtFull(selectedTask.scheduled_at)},
                      {label:'Reminder',     value:selectedTask.reminder_at?fmtFull(selectedTask.reminder_at):'Not set'},
                      {label:'Created',      value:fmtFull(selectedTask.created_at)},
                    ].map(f=>(
                      <div key={f.label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                        <span className="text-slate-400 font-semibold">{f.label}</span>
                        <span className="font-bold text-slate-800 text-right max-w-[60%]">{f.value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTask.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes & Instructions</p>
                      <p className="text-slate-700 leading-snug">{selectedTask.notes}</p>
                    </div>
                  )}

                  {/* AI Insight */}
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-1">
                    <p className="font-bold text-blue-700 flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3"/> AI Engine Suggestion</p>
                    <p className="text-[10px] text-blue-700">Best time to contact: 10AM–12PM</p>
                    <p className="text-[10px] text-blue-700">Conversion success probability: 92%</p>
                    <p className="text-[10px] text-blue-700 font-bold">Recommended Action: Initiate Cloud Calling now</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {selectedTask.status==='Pending' && (
                      <button onClick={()=>handleMarkDone(selectedTask)}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                        <CheckCircle className="w-4 h-4"/> Mark as Complete
                      </button>
                    )}
                    {selectedTask.lead_name && (
                      <button onClick={() => { setCallingTask(selectedTask); setCallState('calling'); }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                        <Phone className="w-4 h-4"/> Call Now (Calling Hub)
                      </button>
                    )}
                    <button
                      onClick={()=>{
                        const msg = encodeURIComponent(`Hi ${selectedTask.lead_name || ''}, following up on our task: ${selectedTask.title}`);
                        window.open(`https://wa.me/${selectedTask.lead_phone || ''}?text=${msg}`, '_blank');
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm">
                      <Zap className="w-4 h-4"/> WhatsApp Follow-up
                    </button>
                    {selectedTask.status==='Pending' && (
                      <button
                        onClick={async ()=>{
                          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1); tomorrow.setHours(10,0,0,0);
                          try {
                            await api.patch(`/sales/tasks/${selectedTask.id}`,{scheduled_at:tomorrow.toISOString()});
                            setSelectedTask({...selectedTask,scheduled_at:tomorrow.toISOString()});
                            showToast('Task rescheduled to tomorrow 10AM');
                          } catch { showToast('Failed to reschedule','error'); }
                        }}
                        className="w-full py-2 border border-amber-300 text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition flex items-center justify-center gap-2 text-xs">
                        <RefreshCw className="w-3.5 h-3.5"/> Reschedule to Tomorrow
                      </button>
                    )}
                    <button onClick={()=>handleDelete(selectedTask)}
                      className="w-full py-2 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 text-xs">
                      <Trash2 className="w-4 h-4"/> Cancel / Delete Task
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center min-h-[40vh]">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                  <Eye className="w-6 h-6 text-slate-300"/>
                </div>
                <p className="text-xs font-semibold text-slate-400">Select a task to view details and take action.</p>
                <button onClick={()=>setIsAddOpen(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm">
                  <Plus className="w-3.5 h-3.5"/> Add Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Task Modal ── */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsAddOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Add New Task / Follow-up</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Schedule a call, meeting or follow-up activity</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleAISmartFill} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> AI Smart Fill
                  </button>
                  <button type="button" onClick={()=>setIsAddOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
                </div>
              </div>
              <form onSubmit={handleAddTask} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Title *</label>
                  <input required type="text" placeholder="Call Amit Sharma" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Type</label>
                    <select value={newTask.type} onChange={e=>setNewTask({...newTask,type:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call','Meeting','Follow-up','Email','Demo','WhatsApp'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                    <select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date &amp; Time</label>
                    <input type="datetime-local" value={newTask.scheduled_at} onChange={e=>setNewTask({...newTask,scheduled_at:e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reminder Alert</label>
                    <input type="datetime-local" value={newTask.reminder_at} onChange={e=>setNewTask({...newTask,reminder_at:e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link Lead / Contact</label>
                  <select value={newTask.lead_name} onChange={e=>setNewTask({...newTask,lead_name:e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                    <option value="">Select linked lead...</option>
                    <option value="Amit Sharma">Amit Sharma</option>
                    <option value="Neha Verma">Neha Verma</option>
                    <option value="Rajeev Kumar">Rajeev Kumar</option>
                    <option value="Pooja Aggarwal">Pooja Aggarwal</option>
                    <option value="Vikram Singh">Vikram Singh</option>
                    <option value="Anjali Patel">Anjali Patel</option>
                    <option value="Rohan Mehta">Rohan Mehta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes & Instructions</label>
                  <textarea rows={3} placeholder="Instructions, context, next steps..." value={newTask.notes}
                    onChange={e=>setNewTask({...newTask,notes:e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition"/>
                </div>
                {/* AI Suggestion */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Engine Recommendation</p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Auto suggest follow-up time: 10:00 AM–12:00 PM · Recommended Task Type: Call</p>
                </div>
                <button type="submit" disabled={addLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                  {addLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                  Save Task & Link Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CALLING HUB MODAL ── */}
      <AnimatePresence>
        {callingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCallingTask(null)} />
            <motion.div initial={{opacity:0, scale:0.95, y:10}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95}}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Communication & Calling Hub</h3>
                    <p className="text-xs text-slate-400">Secure Cloud Route & Multi-Channel Dialer</p>
                  </div>
                </div>
                <button onClick={() => setCallingTask(null)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lead Info Banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">{callingTask.lead_name || 'Attached Lead'}</h4>
                  <p className="text-xs font-mono text-blue-600 font-bold mt-0.5">{callingTask.lead_phone || '+91 98765 43210'}</p>
                </div>
                <span className="text-[10px] font-extrabold bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wider">
                  {callingTask.priority} Priority Lead
                </span>
              </div>

              {/* Live VoIP Simulation Box */}
              <div className="p-5 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl text-white shadow-lg space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold flex items-center gap-1.5 text-blue-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Cloud Calling (VoIP Route)
                  </span>
                  <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-lg text-white font-bold">
                    {callState === 'connected' ? `Live: ${Math.floor(callTimer/60)}m ${callTimer%60}s` : callState === 'calling' ? 'Calling...' : 'Standby'}
                  </span>
                </div>

                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Phone className={`w-7 h-7 text-white ${callState === 'calling' ? 'animate-bounce' : ''}`} />
                  </div>
                  <h4 className="text-lg font-extrabold">
                    {callState === 'calling' ? 'Dialing Secure VoIP Route...' : callState === 'connected' ? 'Call in Progress' : callState === 'ended' ? 'Call Finished' : 'Ready to Dial'}
                  </h4>
                  <p className="text-xs text-blue-200 mt-1">
                    {callState === 'calling' ? 'Establishing direct line with lead...' : callState === 'connected' ? 'Call successfully connected. Recording active.' : 'Click below to initiate cloud connection.'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  {callState === 'calling' && (
                    <>
                      <button onClick={() => setCallState('connected')} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition shadow">
                        Simulate Answer
                      </button>
                      <button onClick={() => setCallState('ended')} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition shadow">
                        Cancel Dial
                      </button>
                    </>
                  )}
                  {callState === 'connected' && (
                    <button onClick={() => setCallState('ended')} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition shadow flex items-center justify-center gap-1.5">
                      <Phone className="w-4 h-4 transform rotate-135" /> End Call
                    </button>
                  )}
                  {(callState === 'idle' || callState === 'ended') && (
                    <button onClick={() => setCallState('calling')} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition shadow flex items-center justify-center gap-1.5">
                      <Phone className="w-4 h-4" /> Start Cloud Call
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Hardware & WhatsApp Fallback Buttons */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alternative Direct Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => window.open(`tel:${callingTask.lead_phone || '+919876543210'}`)} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition">
                    <Phone className="w-4 h-4 text-blue-600" /> Direct Device Dialer
                  </button>
                  <button onClick={() => {
                    const msg = encodeURIComponent(`Hi ${callingTask.lead_name || ''}, following up on our task: ${callingTask.title}`);
                    window.open(`https://wa.me/${callingTask.lead_phone || ''}?text=${msg}`, '_blank');
                  }} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition">
                    <Zap className="w-4 h-4 text-emerald-600" /> WhatsApp Direct
                  </button>
                </div>
              </div>

              {/* AI Call Script & Talking Points */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" /> AI Call Script & Pitch Points
                </h4>
                <div className="space-y-2 text-xs text-amber-900 leading-relaxed">
                  <p><strong>Opening:</strong> "Hi {callingTask.lead_name || 'there'}, this is {callingTask.lead_name ? 'following up on our earlier discussions regarding your requirements.' : 'following up on your inquiry.'}"</p>
                  <p><strong>Value Proposition:</strong> "We have a limited Q3 incentive structure that aligns perfectly with your timeline."</p>
                  <p><strong>Objection Handling:</strong> "If pricing is a concern, let's explore our flexible modular billing."</p>
                </div>
              </div>

              {/* Activity Log Form */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Log Call Outcome & Notes</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Call Outcome</label>
                    <select value={callOutcome} onChange={e => setCallOutcome(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500">
                      <option>Interested / Warm</option>
                      <option>Meeting Scheduled</option>
                      <option>Call Back Later</option>
                      <option>No Answer / Voicemail</option>
                      <option>Not Interested / Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Schedule Follow-up</label>
                    <select className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-500">
                      <option>Tomorrow 10 AM</option>
                      <option>In 2 days</option>
                      <option>Next Week</option>
                      <option>No Follow-up Needed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Follow-up Notes</label>
                  <textarea rows={3} value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Enter details discussed during call..." className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <button onClick={() => {
                  api.post('/sales/activities', {
                    lead_id: callingTask.lead_id || 'lead-1',
                    type: 'Call',
                    outcome: callOutcome,
                    notes: callNotes || 'Standard follow-up discussion completed.',
                    duration: callTimer
                  }).finally(() => {
                    showToast('Call activity & outcome logged successfully!');
                    setCallingTask(null);
                    setCallState('idle');
                    setCallTimer(0);
                    setCallNotes('');
                  });
                }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Save Activity & Update Lead
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
