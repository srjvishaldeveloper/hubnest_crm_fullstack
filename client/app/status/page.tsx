'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

const SYSTEMS = [
  { name: 'Core API Servers', status: 'Operational', uptime: '99.99%' },
  { name: 'PostgreSQL Relational Databases', status: 'Operational', uptime: '100.00%' },
  { name: 'Redis Cache & Session Pools', status: 'Operational', uptime: '99.95%' },
  { name: 'Twilio SMS & Messaging Gateway', status: 'Operational', uptime: '100.00%' },
  { name: 'AI Insights Analysis Workers', status: 'Operational', uptime: '99.90%' }
];

export default function StatusPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Status Header */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
              System Status
            </span>
            <div className="mt-8 mx-auto p-6 bg-green-500/10 border border-green-500/20 rounded-2xl max-w-xl flex items-center justify-center gap-4">
              <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-green-400">All Systems Fully Operational</span>
            </div>
            <h1 className="mt-6 text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Infrastructure & Services Metrics
            </h1>
          </div>
        </section>

        {/* Systems Grid */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] max-w-[800px] px-4 space-y-4">
            <h2 className="text-xl font-bold font-serif text-white mb-6">Service Health</h2>
            <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl divide-y divide-[#1a1a1a]">
              {SYSTEMS.map((sys) => (
                <div key={sys.name} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-white">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-bold">
                    <span className="text-slate-500">Uptime: {sys.uptime}</span>
                    <span className="text-green-400 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                      {sys.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Past Incidents */}
            <div className="mt-12">
              <h2 className="text-xl font-bold font-serif text-white mb-6">Incident History</h2>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold">June 8, 22:00 UTC</span>
                <h3 className="text-sm font-bold text-white mt-1 mb-2">Completed API Cache Maintenance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We performed a scheduled cache cleanup on our Redis pools. Total maintenance time was 4 minutes with zero downtime observed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
