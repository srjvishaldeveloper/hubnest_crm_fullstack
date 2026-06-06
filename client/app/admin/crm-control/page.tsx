'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Megaphone, Ticket, DollarSign, Cpu, LineChart, Plug, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Search, Activity, Sparkles, Plus, AlertCircle,
  CheckCircle2, Play, Users, Clock, ExternalLink, Settings, Zap, BarChart3,
  TrendingUp, Lock, RefreshCw, PlusCircle, UserPlus, FileText, BarChart
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart as ReLineChart, Line
} from 'recharts';

const PIPELINE_COLUMNS = [
  { stage: 'New Leads', count: 142, value: '$12.4K', color: 'border-l-blue-500 bg-blue-50/10' },
  { stage: 'Qualified', count: 86, value: '$9.2K', color: 'border-l-violet-500 bg-violet-50/10' },
  { stage: 'Proposal', count: 48, value: '$14.8K', color: 'border-l-amber-500 bg-amber-50/10' },
  { stage: 'Closed Won', count: 95, value: '$24.5K', color: 'border-l-emerald-500 bg-emerald-50/10' },
];

const TEAM_PERFORMANCE = [
  { name: 'Arun Menon', leads: 142, converted: 48, rate: '33.8%', revenue: '$4,800' },
  { name: 'Deepa Krishnan', leads: 118, converted: 52, rate: '44.1%', revenue: '$6,200' },
  { name: 'Farhan Ali', leads: 95, converted: 30, rate: '31.5%', revenue: '$3,100' },
];

const CAMPAIGNS = [
  { name: 'Q2 Product Launch', status: 'Active', leads: 420, roi: '3.4x' },
  { name: 'LinkedIn Search Ad', status: 'Active', leads: 280, roi: '2.8x' },
  { name: 'Email Newsletter v4', status: 'Paused', leads: 150, roi: '1.9x' },
];

const AGENTS = [
  { name: 'Kavitha Pillai', tickets: 94, resolved: 88, avgTime: '2.1 hrs' },
  { name: 'Lakshmi Devi', tickets: 82, resolved: 78, avgTime: '1.8 hrs' },
];

export default function CRMControlPage() {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Sales' | 'Marketing' | 'Support' | 'Finance' | 'Automation' | 'Analytics' | 'Integrations'>('Overview');
  const [subMenuItem, setSubMenuItem] = useState('Sales Control');
  const [searchQuery, setSearchQuery] = useState('');

  const [automations, setAutomations] = useState({
    autoLead: true,
    autoTicket: true,
    campaignTrigger: true,
    followUps: true
  });

  const subMenuOptions = [
    'Sales Control',
    'Marketing Control',
    'Support Control',
    'Finance Control',
    'Workflow & Automation',
    'Performance Monitor',
    'Analytics & Reports'
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar Sub-Menu */}
      <div className="w-full lg:w-56 shrink-0 space-y-2">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">CRM CONTROL SECTIONS</p>
          <nav className="space-y-1">
            {subMenuOptions.map((item) => (
              <button
                key={item}
                onClick={() => setSubMenuItem(item)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
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

      {/* Main Control Area */}
      <div className="flex-1 space-y-6 min-w-0">

        {/* Header with AI Focus Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-[22px] font-bold text-[#0F172A]">CRM Modules & Control</h2>
            <p className="text-[13px] text-slate-500 mt-1">Configure global workflow parameters, pipeline stages, and analytics triggers.</p>
          </div>
          <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl max-w-sm">
            <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#2563EB]">AI Focus: Improve Sales Conversion</p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">System identified 14% drop in Qualified to Proposal stage. Adjust assignment SLA.</p>
            </div>
          </div>
        </div>

        {/* Top KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Leads', value: '12,450', trend: '↑ 12.4%', up: true },
            { label: 'Open Tickets', value: '184', trend: '↓ 8.2%', up: false },
            { label: 'Active Campaigns', value: '12', trend: '↑ 4.1%', up: true },
            { label: 'SLA Compliance', value: '98.4%', trend: '↑ 0.5%', up: true },
            { label: 'Automation Rules', value: '24', trend: '→ 0.0%', up: true },
            { label: 'Total Revenue', value: '$48,250', trend: '↑ 15.2%', up: true }
          ].map((k, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{k.label}</span>
                <span className={`text-[10px] font-extrabold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                  k.trend.includes('→') ? 'text-slate-500 bg-slate-100' : k.up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                }`}>
                  {k.trend.includes('↑') ? <ArrowUpRight className="w-2.5 h-2.5" /> : k.trend.includes('↓') ? <ArrowDownRight className="w-2.5 h-2.5" /> : null}
                  {k.trend}
                </span>
              </div>
              <p className="text-[28px] font-extrabold text-[#0F172A] mt-2 leading-none">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-2 shadow-sm flex gap-1.5 overflow-x-auto scrollbar-none">
          {(['Overview', 'Sales', 'Marketing', 'Support', 'Finance', 'Automation', 'Analytics', 'Integrations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab} Control
            </button>
          ))}
        </div>

        {/* Row 1: 4 Module Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Panel 1: Sales Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-[400px] overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Sales Control</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Leads overview, pipeline stages & conversion rate</p>
              </div>
              <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">Pipeline Stage</span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1.5 scrollbar-thin">
              <div className="grid grid-cols-2 gap-3.5">
                {PIPELINE_COLUMNS.map((col, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{col.stage}</span>
                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className="text-lg font-bold text-[#0F172A]">{col.count}</span>
                      <span className="text-sm font-semibold text-slate-500">{col.value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Performers</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                        <th className="px-3 py-2">Agent</th>
                        <th className="px-3 py-2">Conversion</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEAM_PERFORMANCE.map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="px-3 py-2.5 text-[#0F172A] font-semibold">{p.name}</td>
                          <td className="px-3 py-2.5 text-emerald-600 font-bold">{p.rate}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-bold">{p.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Marketing Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-[400px] overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Marketing Control</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Campaign metrics, ROI track & lead distribution</p>
              </div>
              <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">ROAS Focus</span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1.5 scrollbar-thin">
              <div className="flex items-center gap-4 bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl">
                <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Google Ads', value: 45 },
                          { name: 'LinkedIn', value: 35 },
                          { name: 'Organic Search', value: 20 }
                        ]}
                        innerRadius={28}
                        outerRadius={42}
                        dataKey="value"
                      >
                        <Cell fill="#2563EB" />
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#10B981" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-[10px] font-bold text-slate-500">Donut</div>
                </div>
                <div className="space-y-1.5 text-sm flex-1">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" />Google</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />LinkedIn</span>
                    <span className="font-bold">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Organic</span>
                    <span className="font-bold">20%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campaign Performance</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                        <th className="px-3 py-2">Campaign</th>
                        <th className="px-3 py-2">Leads</th>
                        <th className="px-3 py-2 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CAMPAIGNS.map((c, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="px-3 py-2.5 text-[#0F172A] font-semibold">{c.name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{c.leads}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">{c.roi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Support Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-[400px] overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Support Control</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Tickets list, SLA adherence & compliance check</p>
              </div>
              <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full">SLA Warning</span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1.5 scrollbar-thin">
              <div className="p-3.5 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">First Response SLA Adherence</span>
                  <span className="font-extrabold text-[#16A34A]">98.4%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.4%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Agent Load (Open Tickets)</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                        <th className="px-3 py-2">Agent</th>
                        <th className="px-3 py-2">Assigned</th>
                        <th className="px-3 py-2 text-right">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENTS.map((a, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="px-3 py-2.5 text-[#0F172A] font-semibold">{a.name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{a.tickets}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-bold">{a.avgTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 4: Finance Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-[400px] overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Finance Control</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Revenue flow, invoice tracking & billing cycle</p>
              </div>
              <span className="text-[11px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">On Target</span>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1.5 scrollbar-thin">
              <div className="h-28 bg-slate-50 rounded-xl border border-slate-100 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ m: 'Jan', val: 8.2 }, { m: 'Feb', val: 12.4 }, { m: 'Mar', val: 18.6 }, { m: 'Apr', val: 24.5 }]}>
                    <defs>
                      <linearGradient id="financeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="m" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#10B981" fillOpacity={1} fill="url(#financeArea)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-semibold">Invoices Cleared</span>
                  <span className="font-extrabold text-[#16A34A]">$32,450 (18 Invoices)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-semibold">Pending Gateway Disputes</span>
                  <span className="font-extrabold text-[#DC2626]">2 Disputes ($1,400)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-semibold">Subscription Next Run</span>
                  <span className="font-bold text-[#0F172A]">08 Jun 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Workflow & Automation + Performance Monitoring + Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Workflow & Automation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Workflow & Automation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Toggle live triggers and queue routers</p>
            </div>
            <div className="space-y-3.5">
              {[
                { key: 'autoLead', label: 'Auto Lead Assignment', status: automations.autoLead },
                { key: 'autoTicket', label: 'Auto Ticket Routing', status: automations.autoTicket },
                { key: 'campaignTrigger', label: 'Campaign Automation', status: automations.campaignTrigger },
                { key: 'followUps', label: 'Follow-up Reminders', status: automations.followUps }
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      item.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.status ? 'Active' : 'Paused'}
                    </span>
                    <input
                      type="checkbox"
                      checked={item.status}
                      onChange={() => setAutomations(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className="w-8 h-4 bg-slate-200 rounded-full appearance-none relative checked:bg-[#2563EB] cursor-pointer transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Monitoring */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Performance Monitoring</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Department-wise performance rates</p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Sales Performance', value: '78%', width: '78%', color: 'bg-blue-600' },
                { label: 'Marketing Performance', value: '84%', width: '84%', color: 'bg-purple-500' },
                { label: 'Support Performance', value: '92%', width: '92%', color: 'bg-emerald-500' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-semibold">{item.label}</span>
                    <span className="font-bold text-[#0F172A]">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Analytics Overview</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Lead, ROI & ticket mini trendlines</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Lead Trend', data: [{ m: '1', v: 40 }, { m: '2', v: 52 }, { m: '3', v: 78 }, { m: '4', v: 95 }], color: '#2563EB' },
                { label: 'Campaign ROI', data: [{ m: '1', v: 1.8 }, { m: '2', v: 2.4 }, { m: '3', v: 3.1 }, { m: '4', v: 3.4 }], color: '#8B5CF6' },
                { label: 'Ticket Trend', data: [{ m: '1', v: 32 }, { m: '2', v: 20 }, { m: '3', v: 25 }, { m: '4', v: 18 }], color: '#DC2626' },
              ].map((chart, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 w-24 shrink-0">{chart.label}</span>
                  <div className="flex-1 h-9">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={chart.data}>
                        <Line type="monotone" dataKey="v" stroke={chart.color} strokeWidth={2} dot={false} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Integration Status + Permission Check + Activity Logs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Integration Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Integration Status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">API connection validations</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Email System', active: true },
                { name: 'WhatsApp API', active: true },
                { name: 'Calling API', active: true },
                { name: 'Payment Gateway', active: true }
              ].map((ig, idx) => (
                <div key={idx} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between bg-slate-50/50">
                  <span className="text-sm text-slate-600 font-semibold truncate pr-1">{ig.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${ig.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={`text-[10px] font-bold ${ig.active ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {ig.active ? 'Connected' : 'Off'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission & Access Check */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Permission & Access</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">User security role boundaries</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <span className="text-[22px] font-extrabold text-emerald-600">12</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Full Access</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <span className="text-[22px] font-extrabold text-amber-500">45</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Limited</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <span className="text-[22px] font-extrabold text-rose-500">3</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">No Access</p>
              </div>
            </div>
          </div>

          {/* Audit & Activity Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Audit & Activity Logs</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Last 5 system actions</p>
            </div>
            <div className="space-y-3 border-l border-slate-100 pl-3.5 ml-1">
              {[
                { actor: 'System', action: 'Auto lead assignment rule activated', time: '5m ago' },
                { actor: 'Amit Patel', action: 'Modified Support SLA compliance margin', time: '32m ago' },
                { actor: 'System', action: 'Campaign Automation triggered for Q2 Launch', time: '1h ago' },
                { actor: 'Sneha Gupta', action: 'Bulk reassignment of 18 leads completed', time: '2h ago' },
                { actor: 'System Admin', action: 'Payment Gateway integration re-verified', time: '3h ago' },
              ].map((log, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <span className="absolute -left-[18.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                  <span className="text-[10px] text-slate-400 font-bold block">{log.time} • {log.actor}</span>
                  <p className="text-[13px] text-slate-700 font-semibold">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Search Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div>
            <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Global Search</h3>
            <p className="text-[13px] text-slate-500 mt-0.5">Search across leads, campaigns, tickets, payments and users</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
            />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['High Value Leads', 'Open Tickets', 'Active Campaigns', 'Overdue Payments', 'Top Performers'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-[#2563EB] text-slate-600 text-sm font-medium rounded-full transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column Sticky Panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">

        {/* Quick Actions Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: 'Add Lead', icon: PlusCircle },
              { label: 'Assign Lead', icon: RefreshCw },
              { label: 'Launch Camp', icon: Zap },
              { label: 'Assign Ticket', icon: Clock },
              { label: 'Create User', icon: UserPlus },
              { label: 'Gen Report', icon: FileText },
              { label: 'View Analytics', icon: BarChart },
              { label: 'Automation', icon: Settings }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => alert(`Quick Action Triggered: ${act.label}`)}
                className="p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 rounded-xl transition flex flex-col items-center justify-center gap-1.5 bg-slate-50/50"
              >
                <act.icon className="w-4 h-4 text-[#2563EB]" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts & Incidents */}
        <div className="bg-white p-5 rounded-2xl border border-[#DC2626]/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">Alerts & Incidents</h3>
          </div>
          <div className="space-y-3">
            {[
              { text: 'High open ticket count in support queue', color: 'bg-[#DC2626]' },
              { text: 'SLA breach pending in 4 premium accounts', color: 'bg-[#D97706]' },
              { text: 'SMTP email server response latency high', color: 'bg-blue-600' }
            ].map((al, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-sm leading-relaxed text-slate-600 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${al.color}`} />
                <span>{al.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">AI Suggestions</h3>
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 font-medium">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/60">
              <p className="font-bold text-[#2563EB] mb-0.5">Assignment SLA Warning</p>
              <p className="text-slate-600">Reassign 8 qualified leads from underperforming queue to Sneha Gupta.</p>
            </div>
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/60">
              <p className="font-bold text-[#2563EB] mb-0.5">Campaign Budget Run</p>
              <p className="text-slate-600">Google Ads campaign budget is exhausted. ROAS is at 3.4x — suggest increase.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
