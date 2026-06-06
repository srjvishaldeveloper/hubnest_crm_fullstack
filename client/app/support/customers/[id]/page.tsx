'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supportGetCustomer } from '../../../../services/supportService';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  History,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Trophy,
  Calendar,
  ChevronLeft,
  RefreshCw,
  Clock,
  ThumbsUp,
  Sliders,
  DollarSign
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

interface TimelineItem {
  type: string;
  desc: string;
  user: string;
  date: string;
}

interface CustomerDetail {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    status: string;
    created_at: string;
    total_tickets: string;
    open_tickets: string;
    avg_csat: string | null;
  };
  tickets: Ticket[];
  interactionTimeline: TimelineItem[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCustomer() {
    try {
      setLoading(true);
      const res = await supportGetCustomer(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load customer profile', err);
      router.push('/support/customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Retrieving customer history profile...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { customer, tickets, interactionTimeline } = data;
  const csat = customer.avg_csat ? parseFloat(parseFloat(customer.avg_csat).toFixed(1)) : 4.5;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <button
        onClick={() => router.push('/support/customers')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Customers
      </button>

      {/* Customer profile banner card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-[#2563EB] rounded-2xl flex items-center justify-center font-bold text-2xl">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A]">{customer.name}</h1>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide
                ${customer.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {customer.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Customer ID: #{customer.id.slice(0, 8)}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}</span>
              {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}</span>}
              {customer.company && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {customer.company}</span>}
            </div>
          </div>
        </div>

        {/* CSAT and quick metrics */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CSAT Score</p>
            <p className="text-2xl font-black text-slate-800 mt-1">⭐ {csat}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Open Tickets</p>
            <p className="text-2xl font-black text-red-500 mt-1">{customer.open_tickets}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Issues</p>
            <p className="text-2xl font-black text-slate-600 mt-1">{customer.total_tickets}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Details, engagement scores, tickets, history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Detailed metadata & Engagement profiles */}
        <div className="space-y-6">
          
          {/* Detailed Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-4">Profile Information</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Customer Since</span>
                <span className="font-bold text-slate-700">{new Date(customer.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Account Type</span>
                <span className="font-bold text-slate-700">Premium CRM Tenant</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-400 font-semibold">Preferred Channel</span>
                <span className="font-bold text-slate-700">Email & In-App Chat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Signup Source</span>
                <span className="font-bold text-slate-700">Website Landing</span>
              </div>
            </div>
          </div>

          {/* Customer Value Analysis */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-4">Customer Value</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Spend</p>
                <p className="text-base font-black text-slate-800 mt-1 flex items-center justify-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> 3,200
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lifetime Value (LTV)</p>
                <p className="text-base font-black text-[#2563EB] mt-1 flex items-center justify-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" /> 1,25,000
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Dials */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Engagement & Retention</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Product Engagement Score</span>
                  <span className="text-green-600 font-bold">85/100</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Health Score</span>
                  <span className="text-indigo-600 font-bold">92%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Churn Risk</span>
                <span className="text-xs font-bold text-green-600">Low Risk</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Activity level</span>
                <span className="text-xs font-bold text-slate-700">Very High</span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Ticket history and interaction logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tickets History List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F172A] text-sm">Issue Tickets History</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">All Tickets ({tickets.length})</span>
            </div>

            <div className="space-y-3.5">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-medium">No tickets history records found.</p>
              ) : (
                tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/support/tickets?id=${t.id}`)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#0F172A]">#{t.id.slice(0, 8)}: {t.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-450 font-semibold">
                        <span className="text-slate-450">{new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="bg-slate-200/60 px-1 rounded text-slate-500 uppercase">{t.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase
                        ${t.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {t.priority}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase
                        ${t.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interaction timeline logs */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0F172A] text-sm mb-4">Recent Interaction Timeline</h3>
            <div className="relative pl-6 border-l border-slate-100 space-y-6 text-xs">
              {interactionTimeline.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Circle indicator on timeline */}
                  <span className="absolute -left-[31px] top-1.5 p-1 bg-white border-2 border-blue-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0" />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800">{item.type} logs</p>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed font-semibold">{item.desc}</p>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">Triggered by: {item.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
