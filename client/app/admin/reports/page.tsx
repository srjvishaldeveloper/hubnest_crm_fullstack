'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Target, Megaphone, Ticket, DollarSign, Users, Award, Download,
  Filter, Search, Calendar, Sparkles, PlusCircle, CheckCircle, RefreshCw,
  FileText, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronDown, Check, Copy
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart as ReBarChart, Bar,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

const TOP_PERFORMERS_COLS = [
  { name: 'Varun Malhotra', sales: '34 Deals ($45K)', marketing: '142 Leads (3.4x ROI)', support: '92 Resolves (1.8h avg)' },
  { name: 'Sneha Gupta', sales: '28 Deals ($28K)', marketing: '280 Leads (2.8x ROI)', support: '78 Resolves (2.0h avg)' },
  { name: 'Amit Patel', sales: 'N/A', marketing: '110 Leads (1.9x ROI)', support: '118 Resolves (1.5h avg)' },
  { name: 'Priya Sharma', sales: '12 Deals ($9K)', marketing: '420 Leads (4.2x ROI)', support: 'N/A' },
  { name: 'Rohan Mehta', sales: 'N/A', marketing: 'N/A', support: '65 Resolves (2.8h avg)' }
];

const USER_PERFORMANCE_OVERVIEW = [
  { rank: 1, name: 'Varun Malhotra', role: 'Sales Manager', count: '142 Leads • 92 Tickets', score: '94%', bar: 94 },
  { rank: 2, name: 'Sneha Gupta', role: 'Sales Executive', count: '98 Leads • 78 Tickets', score: '88%', bar: 88 },
  { rank: 3, name: 'Amit Patel', role: 'Support Manager', count: '0 Leads • 118 Tickets', score: '85%', bar: 85 },
  { rank: 4, name: 'Priya Sharma', role: 'Marketing Exec', count: '45 Leads • 0 Tickets', score: '72%', bar: 72 },
  { rank: 5, name: 'Rohan Mehta', role: 'Finance Exec', count: '0 Leads • 65 Tickets', score: '68%', bar: 68 }
];

export default function ReportsPage() {
  const [subMenuItem, setSubMenuItem] = useState('Reports Dashboard');
  const [activeTab, setActiveTab] = useState<'Sales' | 'Marketing' | 'Support' | 'Finance' | 'UserPerformance' | 'Custom'>('Sales');
  
  // Custom builder states
  const [builderStep, setBuilderStep] = useState(1);
  const [builderModule, setBuilderModule] = useState('Sales');
  const [builderFields, setBuilderFields] = useState<string[]>([]);
  const [builderFilter, setBuilderFilter] = useState('All Status');

  const subMenuOptions = [
    'Reports Dashboard',
    'Sales Reports',
    'Marketing Reports',
    'Support Reports',
    'Finance Reports',
    'User Performance',
    'Custom Reports',
    'Scheduled Reports',
    'Comparison Reports',
    'Trend Analysis',
    'Alert Reports'
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar Sub-Menu */}
      <div className="w-full lg:w-52 shrink-0 space-y-2">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2">REPORTS SECTIONS</p>
          <nav className="space-y-1">
            {subMenuOptions.map((item) => (
              <button
                key={item}
                onClick={() => setSubMenuItem(item)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  subMenuItem === item 
                    ? 'bg-[#2563EB]/10 text-[#2563EB]' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Reports Area */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Header with Date Range Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">Real-Time Reports</h2>
            <p className="text-xs text-slate-500 mt-1">Cross-examine user workflows, pipeline growth, and compliance parameters.</p>
          </div>
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition shrink-0">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span>01 Jun 2026 - 30 Jun 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>

        {/* 6 KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Leads Created', value: '3,450', trend: '↑ 14.2%', up: true },
            { label: 'Deals Won', value: '412', trend: '↑ 8.5%', up: true },
            { label: 'Campaign Spent', value: '$8,240', trend: '↓ 2.1%', up: false },
            { label: 'Tickets Solved', value: '984', trend: '↑ 12.0%', up: true },
            { label: 'SLA Breach Rate', value: '1.6%', trend: '↓ 0.4%', up: false },
            { label: 'Gross Margin', value: '$45,800', trend: '↑ 18.6%', up: true }
          ].map((k, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[96px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{k.label}</span>
                <span className={`text-[9px] font-extrabold flex items-center gap-0.5 px-1 py-0.5 rounded ${
                  k.up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {k.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {k.trend}
                </span>
              </div>
              <p className="text-xl font-extrabold text-[#0F172A] mt-2">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-2 shadow-sm flex gap-1.5 overflow-x-auto scrollbar-none">
          {(['Sales', 'Marketing', 'Support', 'Finance', 'UserPerformance', 'Custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#2563EB] text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'UserPerformance' ? 'User Performance' : tab === 'Custom' ? 'Custom Builder' : `${tab} Reports`}
            </button>
          ))}
        </div>

        {/* Overview Panels with Mini Charts based on activeTab */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Tab Panel: Col span 2 */}
          <div className="xl:col-span-2 space-y-6">
            
            {activeTab === 'Sales' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Leads Trend line chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Leads Conversion Trend</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { day: '1 Jun', leads: 120, conversion: 22 },
                        { day: '10 Jun', leads: 240, conversion: 54 },
                        { day: '20 Jun', leads: 180, conversion: 48 },
                        { day: '30 Jun', leads: 310, conversion: 82 }
                      ]}>
                        <defs>
                          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={3} fill="url(#leadsGrad)" />
                        <Area type="monotone" dataKey="conversion" stroke="#10B981" strokeWidth={3} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut and ROI Trend grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Leads by source */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider self-start mb-4">Leads by Source</h3>
                    <div className="w-28 h-28 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Google Ads', value: 45 },
                              { name: 'LinkedIn Ads', value: 35 },
                              { name: 'Organic Search', value: 20 }
                            ]}
                            innerRadius={32}
                            outerRadius={46}
                            dataKey="value"
                          >
                            <Cell fill="#2563EB" />
                            <Cell fill="#8B5CF6" />
                            <Cell fill="#10B981" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <span className="absolute text-[10px] font-bold text-slate-400 uppercase">100%</span>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Google</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />LinkedIn</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Organic</span>
                    </div>
                  </div>

                  {/* ROI Trend */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">ROI Pipeline Trend</h3>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={[
                          { month: 'Apr', roi: 2.8 },
                          { month: 'May', roi: 3.4 },
                          { month: 'Jun', roi: 4.2 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                          <Tooltip formatter={(value) => `${value}x`} />
                          <Bar dataKey="roi" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Marketing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Campaign Click Conversion</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={[
                        { name: 'Launch Ad', spend: 1200, return: 4500 },
                        { name: 'Social Ad', spend: 800, return: 2400 },
                        { name: 'Email Ad', spend: 300, return: 1200 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="spend" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="return" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Support' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider self-start mb-4">Ticket Status</h3>
                  <div className="w-32 h-32 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Resolved', value: 78 },
                            { name: 'Pending', value: 16 },
                            { name: 'Breached', value: 6 }
                          ]}
                          innerRadius={36}
                          outerRadius={50}
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#EF4444" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <span className="absolute text-xs font-black text-slate-700">78% SLA</span>
                  </div>
                  <div className="flex gap-3 mt-3 text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Resolved</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Pending</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Breached</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Tickets Inflow Trend</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={[
                        { day: 'Mon', tickets: 12 },
                        { day: 'Wed', tickets: 28 },
                        { day: 'Fri', tickets: 18 }
                      ]}>
                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="tickets" stroke="#DC2626" strokeWidth={2.5} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Finance' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[{ l: 'ARR Growth', v: '$48,250' }, { l: 'Gateway Charges', v: '$1,240' }, { l: 'Net Margin', v: '97.2%' }].map(s => (
                    <div key={s.l} className="bg-slate-50 p-3.5 border border-slate-100 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">{s.l}</span>
                      <span className="text-base font-extrabold text-[#0F172A] mt-1 block">{s.v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-5 border border-slate-200/60 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Revenue Trend (Gross ARR)</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { m: 'Jan', value: 12 },
                        { m: 'Mar', value: 28 },
                        { m: 'May', value: 45 }
                      ]}>
                        <XAxis dataKey="m" stroke="#94A3B8" fontSize={9} />
                        <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.05} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'UserPerformance' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100"><h3 className="text-xs font-extrabold text-[#0F172A] uppercase">User Performance List</h3></div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Load metrics</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5 w-24">Graph</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USER_PERFORMANCE_OVERVIEW.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">#{item.rank}</td>
                        <td className="px-4 py-3 text-[#0F172A] font-semibold">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{item.role}</td>
                        <td className="px-4 py-3 text-slate-500">{item.count}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">{item.score}</td>
                        <td className="px-4 py-3">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.bar}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'Custom' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-5 border border-slate-200/60 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Custom Report Builder</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">3-Step Custom Generation wizard</p>
                </div>
                
                {/* Steps Navigator */}
                <div className="flex gap-2 text-center text-xs font-bold border-b border-slate-50 pb-3">
                  {['1. Select Module', '2. Fields configuration', '3. Filters'].map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBuilderStep(idx + 1)}
                      className={`flex-1 py-1.5 rounded-lg border transition ${
                        builderStep === idx + 1 
                          ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]' 
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>

                {builderStep === 1 && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">CRM Data Module</label>
                    <select
                      value={builderModule}
                      onChange={e => setBuilderModule(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#2563EB] transition font-semibold"
                    >
                      <option value="Sales">Sales Leads & Pipeline</option>
                      <option value="Marketing">Marketing Campaigns</option>
                      <option value="Support">Support Tickets</option>
                      <option value="Finance">Billing & Invoices</option>
                    </select>
                  </div>
                )}

                {builderStep === 2 && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Columns to export</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Employee ID', 'Name', 'Metric conversion', 'Last login state', 'Contact phone'].map(f => (
                        <label key={f} className="flex items-center gap-2 p-2.5 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                          <input 
                            type="checkbox"
                            checked={builderFields.includes(f)}
                            onChange={e => {
                              if (e.target.checked) setBuilderFields(prev => [...prev, f]);
                              else setBuilderFields(prev => prev.filter(x => x !== f));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                          />
                          <span className="text-xs text-slate-600 font-semibold">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {builderStep === 3 && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">State Filters</label>
                    <select
                      value={builderFilter}
                      onChange={e => setBuilderFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#2563EB] transition font-semibold"
                    >
                      <option>All Status</option>
                      <option>Active only</option>
                      <option>Suspended only</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 border-t border-slate-50 pt-4">
                  <button 
                    onClick={() => {
                      if (builderStep > 1) setBuilderStep(prev => prev - 1);
                    }}
                    disabled={builderStep === 1}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      if (builderStep < 3) setBuilderStep(prev => prev + 1);
                      else alert(`Report compiled!\nModule: ${builderModule}\nFields: ${builderFields.join(', ') || 'Default'}\nFilters: ${builderFilter}`);
                    }}
                    className="flex-1 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    {builderStep === 3 ? 'Compile Report' : 'Next Step'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Top Performers Grid panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Top Performers matrix</h3>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Sales</th>
                      <th className="px-4 py-2.5">Marketing</th>
                      <th className="px-4 py-2.5 text-right">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_PERFORMERS_COLS.map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/30">
                        <td className="px-4 py-3 font-semibold text-[#0F172A]">{t.name}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{t.sales}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{t.marketing}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">{t.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right side analytics column */}
          <div className="space-y-6">
            
            {/* Action buttons */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Export Actions</h3>
              <button onClick={() => alert('PDF report export started.')} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition">
                <FileText className="w-3.5 h-3.5 text-red-500" /> Export as PDF
              </button>
              <button onClick={() => alert('Excel report export started.')} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition">
                <FileText className="w-3.5 h-3.5 text-emerald-500" /> Export as Excel
              </button>
              <button onClick={() => alert('CSV report export started.')} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Export as CSV
              </button>
            </div>

            {/* AI Insights Card */}
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">AI Insights</h3>
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="space-y-3">
                {[
                  { title: 'SLA Breach Mitigation', text: 'Support queue breached 1.6% SLA threshold, assign ticket escalation rules.' },
                  { title: 'Campaign ROAS Alert', text: 'Spend efficiency down 2.1%. Suggest shifting $2K budget to Google search ads.' }
                ].map((ins, idx) => (
                  <div key={idx} className="p-3 bg-blue-50/50 border border-blue-100/60 rounded-xl">
                    <p className="text-xs font-bold text-[#2563EB] mb-0.5">{ins.title}</p>
                    <p className="text-[10px] text-slate-600 leading-normal">{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Reports list */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Recommended reports</h3>
              {[
                { name: 'Monthly Executive Close', type: 'AI Suggested' },
                { name: 'Ticket Resolution Speed Index', type: 'System Audit' }
              ].map((rec, idx) => (
                <div key={idx} className="p-2.5 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition cursor-pointer">
                  <span className="text-xs text-[#0F172A] font-semibold truncate pr-1">{rec.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-50 text-blue-600 shrink-0">{rec.type}</span>
                </div>
              ))}
            </div>

            {/* Scheduled reports */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Scheduled reports</h3>
              {[
                { name: 'Daily Sales Snapshot', time: '9:00 AM Daily' },
                { name: 'Weekly Marketing ROI', time: 'Mon 8:00 AM' }
              ].map((sch, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div>
                    <span className="text-xs text-[#0F172A] font-semibold block">{sch.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{sch.time}</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-8 h-4 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4" />
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom Row: Trend Analysis, Custom Report Builder, Alerts Based Reports list, Data Quality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trend Analysis mini charts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">System Trend analysis</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Miniature activity line charts</p>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={[{ x: 1, y: 10 }, { x: 2, y: 25 }, { x: 3, y: 18 }, { x: 4, y: 34 }]}>
                  <Line type="monotone" dataKey="y" stroke="#2563EB" strokeWidth={2} dot={false} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts Based Reports list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Alerts reports</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Incidents triggers and queue warning log</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'SLA Compliancy Breach Report', date: '3 hours ago' },
                { label: 'Unassigned Leads Overload Alert', date: '1 day ago' }
              ].map((al, idx) => (
                <div key={idx} className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[11px] text-slate-600 font-semibold truncate pr-1">{al.label}</span>
                  <span className="text-[9px] text-slate-400 font-bold shrink-0">{al.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Quality gauge */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[180px]">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Data quality index</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Sync validation check across records</p>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center font-bold text-xs text-emerald-600">
                98%
              </div>
              <div>
                <span className="text-xs font-bold text-[#0F172A]">Sync score is excellent</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Database records are fully validated and mapped against schema parameters.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
