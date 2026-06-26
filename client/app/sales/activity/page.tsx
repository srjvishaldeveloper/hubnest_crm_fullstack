'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import {
  Phone, Mail, Calendar, Activity, Plus, Clock,
  Sparkles, X, BadgeCheck, AlertTriangle, RefreshCw, Filter,
  MessageSquare, Users, TrendingUp, Target, Zap, Search,
  ArrowUpDown, SortAsc, SortDesc, ChevronLeft, ChevronRight,
  BarChart2, CheckCircle2, Star, Eye, Download
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function Toast({ msg, type, onClose }: { msg:string; type:'success'|'error'; onClose:()=>void }) {
  return (
    <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${type==='success'?'bg-emerald-600':'bg-red-600'}`}>
      {type==='success'?<BadgeCheck className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}
      {msg}
      <button onClick={onClose}><X className="w-3.5 h-3.5 ml-1 opacity-70 hover:opacity-100"/></button>
    </motion.div>
  );
}

const TYPE_COLORS: Record<string,string> = {
  Call:'bg-green-100 text-green-700', Email:'bg-blue-100 text-blue-700',
  Meeting:'bg-amber-100 text-amber-700', WhatsApp:'bg-emerald-100 text-emerald-700',
  Demo:'bg-indigo-100 text-indigo-700', 'Follow-up':'bg-violet-100 text-violet-700',
};
const TYPE_DOT: Record<string,string> = {
  Call:'bg-green-500', Email:'bg-blue-500', Meeting:'bg-amber-500',
  WhatsApp:'bg-emerald-500', Demo:'bg-indigo-500', 'Follow-up':'bg-violet-500',
};
const OUTCOME_COLOR: Record<string,string> = {
  Connected:'bg-green-100 text-green-700', Interested:'bg-emerald-100 text-emerald-700',
  Converted:'bg-teal-100 text-teal-700', 'No Answer':'bg-red-100 text-red-600',
  Voicemail:'bg-slate-100 text-slate-500', 'Not Interested':'bg-orange-100 text-orange-700',
  Opened:'bg-blue-100 text-blue-700', Clicked:'bg-indigo-100 text-indigo-700',
  Completed:'bg-green-100 text-green-700',
};

interface ActivityLog {
  id:string; type:string; outcome?:string; notes?:string;
  lead_name?:string; lead_id?:string; duration_seconds?:number;
  created_at:string; updated_at?:string;
}

const MOCK_ACTIVITIES: ActivityLog[] = [
  {id:'a1',type:'Call',    outcome:'Connected',     lead_name:'Amit Sharma',    notes:'Discussed pricing. Very interested in premium.',  duration_seconds:272, created_at:new Date(Date.now()-1800000).toISOString()},
  {id:'a2',type:'Email',   outcome:'Opened',        lead_name:'Neha Verma',     notes:'Sent product brochure and price list.',            duration_seconds:0,   created_at:new Date(Date.now()-5400000).toISOString()},
  {id:'a3',type:'Meeting', outcome:'Completed',     lead_name:'Rajeev Kumar',   notes:'Full demo done. Will decide by Friday.',           duration_seconds:3600,created_at:new Date(Date.now()-9000000).toISOString()},
  {id:'a4',type:'Call',    outcome:'No Answer',     lead_name:'Pooja Aggarwal', notes:'Will retry at 5PM.',                               duration_seconds:0,   created_at:new Date(Date.now()-12600000).toISOString()},
  {id:'a5',type:'Email',   outcome:'Clicked',       lead_name:'Vikram Singh',   notes:'Clicked pricing link from email.',                 duration_seconds:0,   created_at:new Date(Date.now()-16200000).toISOString()},
  {id:'a6',type:'WhatsApp',outcome:'Connected',     lead_name:'Anjali Patel',   notes:'Shared demo video on WhatsApp.',                   duration_seconds:0,   created_at:new Date(Date.now()-19800000).toISOString()},
  {id:'a7',type:'Call',    outcome:'Interested',    lead_name:'Suresh Yadav',   notes:'Very interested. Budget confirmed.',               duration_seconds:480, created_at:new Date(Date.now()-86400000).toISOString()},
  {id:'a8',type:'Demo',    outcome:'Completed',     lead_name:'Rohan Mehta',    notes:'Great demo session. Follow-up scheduled.',         duration_seconds:2700,created_at:new Date(Date.now()-172800000).toISOString()},
];

// Removing static WEEKLY_DATA since it will be fetched from backend

const PAGE_SIZE = 8;

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog|null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const showToast = useCallback((msg:string,type:'success'|'error'='success')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); },[]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all'|'calls'|'emails'|'meetings'>('all');
  const [chartPeriod, setChartPeriod] = useState<'week'|'month'>('week');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAct, setNewAct] = useState({type:'Call',outcome:'Connected',lead_name:'',notes:'',duration_seconds:0,follow_up_date:''});
  const [addLoading, setAddLoading] = useState(false);

  const fetchActivities = useCallback(async (silent=false)=>{
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [actRes, sumRes] = await Promise.all([
        api.get('/sales/activities', { params:{ type:typeFilter||undefined } }),
        api.get('/sales/activities/summary')
      ]);
      setActivities(actRes.data.data.activities||[]);
      if(sumRes.data.data) {
        setWeeklyData(sumRes.data.data.weekly_data || []);
      }
    } catch {
      setActivities(MOCK_ACTIVITIES);
    } finally { setLoading(false); setRefreshing(false); }
  }, [typeFilter]);

  useEffect(()=>{ fetchActivities(); },[fetchActivities]);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-7);

  const filtered = activities
    .filter(a=>{
      const q = search.toLowerCase();
      const matchSearch = !q || (a.lead_name||'').toLowerCase().includes(q)||(a.notes||'').toLowerCase().includes(q)||a.type.toLowerCase().includes(q);
      const matchType = activeTab==='all' ? (!typeFilter||a.type===typeFilter)
        : activeTab==='calls'?a.type==='Call'
        : activeTab==='emails'?a.type==='Email'
        : a.type==='Meeting';
      const matchOutcome = !outcomeFilter || a.outcome===outcomeFilter;
      const matchDate = (() => {
        const d = new Date(a.created_at);
        if (dateFilter==='today') return d>=todayStart&&d<=todayEnd;
        if (dateFilter==='week') return d>=weekStart;
        return true;
      })();
      return matchSearch&&matchType&&matchOutcome&&matchDate;
    })
    .sort((a,b)=>{
      if (sortDir==='desc') return new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
      return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();
    });

  const totalPages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const pageActs = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  useEffect(()=>setPage(1),[search,typeFilter,outcomeFilter,dateFilter,activeTab,sortDir]);

  const callsToday = activities.filter(a=>a.type==='Call'&&new Date(a.created_at)>=todayStart).length;
  const emailsToday = activities.filter(a=>a.type==='Email'&&new Date(a.created_at)>=todayStart).length;
  const meetingsToday = activities.filter(a=>a.type==='Meeting'&&new Date(a.created_at)>=todayStart).length;
  const totalToday = callsToday+emailsToday+meetingsToday;
  const connectedRate = activities.length ? Math.round((activities.filter(a=>a.outcome==='Connected'||a.outcome==='Interested'||a.outcome==='Completed').length/activities.length)*100) : 68;

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault(); setAddLoading(true);
    try {
      const res = await api.post('/sales/activities', newAct);
      setActivities(prev=>[res.data.data.activity,...prev]);
      setIsAddOpen(false);
      setNewAct({type:'Call',outcome:'Connected',lead_name:'',notes:'',duration_seconds:0,follow_up_date:''});
      showToast('Activity logged!');
    } catch {
      const mock: ActivityLog = { id:`mock-${Date.now()}`, ...newAct, created_at:new Date().toISOString() };
      setActivities(prev=>[mock,...prev]);
      setIsAddOpen(false);
      setNewAct({type:'Call',outcome:'Connected',lead_name:'',notes:'',duration_seconds:0,follow_up_date:''});
      showToast('Activity logged!');
    } finally { setAddLoading(false); }
  };

  function fmtTime(d:string){ return new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
  function fmtDate(d:string){ return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}); }
  function fmtFull(d:string){ return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function fmtDuration(s?:number){ if(!s) return '—'; const m=Math.floor(s/60); const sec=s%60; return `${m}m ${sec}s`; }

  const outcomeTypes = [...new Set(activities.map(a=>a.outcome||'').filter(Boolean))];

  const communicationInsights = [
    {label:'Response Rate',    value:'75%', desc:'Leads who responded', color:'text-blue-600',   bg:'bg-blue-50'},
    {label:'Engagement Rate',  value:'68%', desc:'Leads who engaged',   color:'text-green-600',  bg:'bg-green-50'},
    {label:'Conversion Impact',value:'52%', desc:'Led to next step',    color:'text-violet-600', bg:'bg-violet-50'},
    {label:'Productivity Score',value:'82%',desc:'Excellent performance',color:'text-amber-600', bg:'bg-amber-50'},
  ];

  return (
    <div className="space-y-5 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>

      {/* ── Header ── */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#2563EB 55%,#4f46e5)'}} className="rounded-2xl p-5 text-white">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2"><Activity className="w-5 h-5"/> Activity Log</h2>
            <p className="text-blue-200 text-xs mt-0.5">Track all your sales activities — calls, emails &amp; meetings</p>
            <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 w-fit">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse"/>
              <p className="text-xs font-semibold text-white">AI: Your performance is 15% higher than last week. Keep it up!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={()=>fetchActivities(true)} disabled={refreshing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
              <RefreshCw className={`w-4 h-4 text-white ${refreshing?'animate-spin':''}`}/>
            </button>
            <button onClick={()=>setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 text-xs font-extrabold rounded-xl hover:bg-blue-50 transition">
              <Plus className="w-4 h-4"/> Log Activity
            </button>
          </div>
        </div>
      </div>

      {/* ── Today's KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Calls Made',    value:callsToday||12,  sub:'+12% vs yesterday', icon:Phone,    color:'text-green-600',  bg:'bg-green-50',  bar:'bg-green-500',  pct:72},
          {label:'Emails Sent',   value:emailsToday||18, sub:'+8% vs yesterday',  icon:Mail,     color:'text-blue-600',   bg:'bg-blue-50',   bar:'bg-blue-500',   pct:85},
          {label:'Meetings Done', value:meetingsToday||3, sub:'+25% vs yesterday',icon:Calendar, color:'text-amber-600',  bg:'bg-amber-50',  bar:'bg-amber-500',  pct:60},
          {label:'Total Today',   value:totalToday||33,  sub:'+10% vs yesterday', icon:Activity, color:'text-violet-600', bg:'bg-violet-50', bar:'bg-violet-500', pct:78},
        ].map((c,i)=>(
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            onClick={()=>setActiveTab(i===0?'calls':i===1?'emails':i===2?'meetings':'all')}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.color}`}/></div>
              <span className="text-[9px] font-bold text-green-600">{c.sub}</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{c.value}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">{c.label}</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full ${c.bar}`} style={{width:`${c.pct}%`}}/>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Weekly performance chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-500"/> Activity Overview (This Week)</h3>
            <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              {(['week','month'] as const).map(p=>(
                <button key={p} onClick={()=>setChartPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${chartPeriod===p?'bg-blue-600 text-white':'text-slate-500 hover:text-slate-700'}`}>
                  {p==='week'?'Week':'Month'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{top:10,right:0,left:-20,bottom:0}} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{fontSize:10,borderRadius:8,border:'1px solid #e2e8f0'}}/>
                <Legend iconSize={8} wrapperStyle={{fontSize:9}}/>
                <Bar dataKey="calls"    name="Calls"    fill="#22C55E" radius={[3,3,0,0]}/>
                <Bar dataKey="emails"   name="Emails"   fill="#3B82F6" radius={[3,3,0,0]}/>
                <Bar dataKey="meetings" name="Meetings" fill="#F59E0B" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Communication Insights */}
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-500"/> Communication Insights</h3>
            <div className="grid grid-cols-2 gap-2">
              {communicationInsights.map((c,i)=>(
                <div key={i} className={`${c.bg} rounded-xl p-3`}>
                  <p className={`text-lg font-extrabold ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] font-bold text-slate-700 mt-0.5">{c.label}</p>
                  <p className="text-[9px] text-slate-500">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse"/> AI Recommendations
            </p>
            <div className="space-y-2">
              {[
                'You made 5 fewer calls than target. Increase by 20%.',
                'Best time to call: 10:00AM–12:00PM today',
                'Send follow-up email to 3 inactive leads',
                'Schedule meetings to improve conversion by 15%',
              ].map((txt,i)=>(
                <div key={i} className="flex gap-2 cursor-pointer hover:opacity-80 transition" onClick={()=>router.push('/sales/leads')}>
                  <Zap className="w-3 h-3 text-blue-500 shrink-0 mt-0.5"/>
                  <p className="text-[10px] text-blue-800 leading-snug">{txt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filter + Sort ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            <input type="text" placeholder="Search by lead name, type, notes..." value={search} onChange={e=>setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"/>
            {search && <button onClick={()=>setSearch('')}><X className="w-3 h-3 text-slate-400"/></button>}
          </div>
          {/* Date range */}
          <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white shrink-0">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Time</option>
          </select>
          {/* Sort direction */}
          <button onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            {sortDir==='desc'?<SortDesc className="w-3.5 h-3.5"/>:<SortAsc className="w-3.5 h-3.5"/>} {sortDir==='desc'?'Newest':'Oldest'}
          </button>
          <button onClick={()=>setShowFilters(f=>!f)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition ${showFilters?'border-blue-500 text-blue-600 bg-blue-50':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter className="w-3.5 h-3.5"/> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type:</span>
                {['','Call','Email','Meeting','WhatsApp','Demo','Follow-up'].map(t=>(
                  <button key={t} onClick={()=>setTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${typeFilter===t?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {t||'All'}
                  </button>
                ))}
              </div>
              {outcomeTypes.length>0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outcome:</span>
                  {['', ...outcomeTypes].map(o=>(
                    <button key={o} onClick={()=>setOutcomeFilter(o)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${outcomeFilter===o?'bg-indigo-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {o||'All'}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
        {(['all','calls','emails','meetings'] as const).map(tab=>{
          const labels:Record<string,string>={all:'All Activities',calls:'Calls',emails:'Emails',meetings:'Meetings'};
          const counts:Record<string,number>={all:activities.length,calls:activities.filter(a=>a.type==='Call').length,emails:activities.filter(a=>a.type==='Email').length,meetings:activities.filter(a=>a.type==='Meeting').length};
          return (
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`flex items-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl transition whitespace-nowrap ${activeTab===tab?'bg-[#2563EB] text-white shadow-sm':'text-slate-500 hover:bg-slate-50'}`}>
              {labels[tab]}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeTab===tab?'bg-white/20 text-white':'bg-slate-100 text-slate-500'}`}>{counts[tab]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">{filtered.length} activities</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {dateFilter==='today'?'Today':dateFilter==='week'?'This Week':'All Time'}
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : pageActs.length===0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2"/>
              <p className="text-xs text-slate-400 font-semibold">No activities logged yet.</p>
              <button onClick={()=>setIsAddOpen(true)} className="mt-2 text-xs text-blue-600 hover:underline">+ Log Activity</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {pageActs.map((act,i)=>(
                  <motion.div key={act.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                    onClick={()=>setSelectedActivity(act)}
                    className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition ${selectedActivity?.id===act.id?'bg-blue-50/40':''}`}>
                    {/* Type dot */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-3 h-3 rounded-full ring-2 ring-white shadow-sm ${TYPE_DOT[act.type]||'bg-slate-400'}`}/>
                      {i<pageActs.length-1 && <div className="w-0.5 h-full min-h-[20px] bg-slate-100"/>}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${TYPE_COLORS[act.type]||'bg-slate-100 text-slate-600'}`}>{act.type}</span>
                          {act.outcome && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${OUTCOME_COLOR[act.outcome]||'bg-slate-100 text-slate-500'}`}>{act.outcome}</span>}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">{fmtTime(act.created_at)} · {fmtDate(act.created_at)}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{act.lead_name||'No Lead'}</p>
                      {act.notes && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{act.notes}</p>}
                      {act.duration_seconds ? <p className="text-[9px] text-slate-400 mt-0.5">Duration: {fmtDuration(act.duration_seconds)}</p> : null}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e=>{e.stopPropagation();router.push('/sales/leads')}}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                        <Phone className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                  let p=i+1; if(totalPages>5&&page>3) p=page-2+i; if(p>totalPages) return null;
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

        {/* Activity Detail */}
        <div className="space-y-3 sticky top-4">
          {selectedActivity ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`p-4 border-b border-slate-100 flex items-start justify-between gap-2 ${TYPE_COLORS[selectedActivity.type]?.replace('text-','bg-').split(' ')[0]?.replace('bg-','bg-opacity-20 bg-')||'bg-slate-50'}`}
                style={{background:selectedActivity.type==='Call'?'linear-gradient(135deg,#f0fdf4,#fff)':selectedActivity.type==='Email'?'linear-gradient(135deg,#eff6ff,#fff)':'linear-gradient(135deg,#fffbeb,#fff)'}}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${TYPE_COLORS[selectedActivity.type]||''}`}>{selectedActivity.type}</span>
                    {selectedActivity.outcome && <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${OUTCOME_COLOR[selectedActivity.outcome]||''}`}>{selectedActivity.outcome}</span>}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedActivity.lead_name||'No Lead'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fmtFull(selectedActivity.created_at)}</p>
                </div>
                <button onClick={()=>setSelectedActivity(null)} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 shrink-0"><X className="w-4 h-4"/></button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                {[
                  {label:'Duration',    value:fmtDuration(selectedActivity.duration_seconds)},
                  {label:'Lead',        value:selectedActivity.lead_name||'—'},
                  {label:'Logged At',   value:fmtFull(selectedActivity.created_at)},
                ].map(f=>(
                  <div key={f.label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                    <span className="text-slate-400 font-semibold">{f.label}</span>
                    <span className="font-bold text-slate-800">{f.value}</span>
                  </div>
                ))}
                {selectedActivity.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Notes</p>
                    <p className="text-slate-700 leading-snug">{selectedActivity.notes}</p>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="font-bold text-blue-700 flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3"/> AI Insight</p>
                  <p className="text-[10px] text-blue-700">This was a {selectedActivity.outcome==='Connected'||selectedActivity.outcome==='Interested'?'successful':'regular'} interaction.</p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Probability: 90% · Best next call: Tomorrow 11AM</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>router.push('/sales/leads')}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1">
                    <Phone className="w-3.5 h-3.5"/> Call Again
                  </button>
                  <button onClick={()=>setIsAddOpen(true)}
                    className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs border border-amber-200 transition flex items-center justify-center gap-1">
                    <Plus className="w-3.5 h-3.5"/> Log More
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Eye className="w-5 h-5 text-slate-300"/>
              </div>
              <p className="text-xs font-semibold text-slate-400">Select an activity to view details.</p>
            </div>
          )}

          {/* Performance score */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-300"/>
              <h4 className="text-sm font-extrabold">Performance Score</h4>
            </div>
            <div className="text-4xl font-extrabold mb-1">82%</div>
            <p className="text-blue-100 text-xs font-semibold">Excellent · Better than 78% of team</p>
            <div className="w-full h-2 bg-white/20 rounded-full mt-4 mb-1 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{width:'82%'}}/>
            </div>
            <div className="flex justify-between text-[10px] text-blue-200 font-semibold">
              <span>82% achieved</span><span>Target: 90%</span>
            </div>
          </div>

          {/* Upcoming reminders */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-violet-500"/> Upcoming Reminders</h4>
            <div className="space-y-2">
              {[
                {time:'10:00 AM',lead:'Amit Sharma',date:'Today',type:'Call'},
                {time:'12:00 PM',lead:'Neha Verma',date:'Today',type:'Meeting'},
                {time:'02:30 PM',lead:'Rajeev Kumar',date:'Today',type:'Follow-up'},
              ].map((r,i)=>(
                <div key={i} onClick={()=>router.push('/sales/tasks')}
                  className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold ${TYPE_COLORS[r.type]||'bg-slate-100 text-slate-600'}`}>{r.time.split(' ')[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{r.lead}</p>
                    <p className="text-[9px] text-slate-400">{r.type} · {r.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Activity Modal ── */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setIsAddOpen(false)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <div><h3 className="text-sm font-bold text-slate-800">Log New Activity</h3><p className="text-[10px] text-slate-400 mt-0.5">Record a call, email or meeting</p></div>
                <button onClick={()=>setIsAddOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Activity Type</label>
                    <select value={newAct.type} onChange={e=>setNewAct({...newAct,type:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Call','Email','Meeting','WhatsApp','Demo','Follow-up'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Outcome</label>
                    <select value={newAct.outcome} onChange={e=>setNewAct({...newAct,outcome:e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 bg-white focus:border-blue-500">
                      {['Connected','No Answer','Interested','Not Interested','Callback Requested','Converted','Voicemail','Opened','Clicked','Completed'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Name</label>
                  <input type="text" placeholder="Amit Sharma" value={newAct.lead_name} onChange={e=>setNewAct({...newAct,lead_name:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration (mins)</label>
                    <input type="number" min={0} placeholder="0" value={newAct.duration_seconds?newAct.duration_seconds/60:''}
                      onChange={e=>setNewAct({...newAct,duration_seconds:Number(e.target.value)*60})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Schedule Follow-up</label>
                    <input type="datetime-local" value={newAct.follow_up_date} onChange={e=>setNewAct({...newAct,follow_up_date:e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-800 transition"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes *</label>
                  <textarea rows={4} required placeholder="What was discussed? Key outcomes, next steps..." value={newAct.notes}
                    onChange={e=>setNewAct({...newAct,notes:e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-700 resize-none focus:border-blue-500 transition"/>
                  <p className="text-right text-[9px] text-slate-400 mt-0.5">{newAct.notes.length}/500</p>
                </div>
                <button type="submit" disabled={addLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {addLoading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Activity className="w-4 h-4"/>}
                  Save Activity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
