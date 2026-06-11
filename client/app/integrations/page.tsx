'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Mail, MessageSquare, CreditCard, Calendar, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const INTEGRATIONS = [
  { name: 'Twilio SMS', cat: 'Communication', desc: 'Secure SMS OTP verification and customer text notifications.', icon: MessageSquare, color: 'text-red-400', active: true },
  { name: 'Stripe Payments', cat: 'Finance', desc: 'Process tenant subscriptions, invoices, and refunds seamlessly.', icon: CreditCard, color: 'text-indigo-400', active: true },
  { name: 'Resend Email', cat: 'Marketing', desc: 'High-deliverability transactional logs and campaign broadcasts.', icon: Mail, color: 'text-amber-400', active: true },
  { name: 'Slack Alerts', cat: 'Communication', desc: 'Post instant leads updates and system notifications to your channels.', icon: Share2, color: 'text-purple-400', active: false },
  { name: 'Google Calendar', cat: 'Productivity', desc: 'Sync lead meetings and events with executive dashboards.', icon: Calendar, color: 'text-blue-400', active: false },
];

export default function IntegrationsPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
              Integrations
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Extend Your CRM Ecosystem
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Connect HubNest CRM with the industry-standard services you already use to sync databases, trigger triggers, and collect client payments.
            </p>
          </div>
        </section>

        {/* Directory Grid */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INTEGRATIONS.map((app) => (
                <div key={app.name} className="relative p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl hover:border-orange-500/30 transition duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 bg-[#161616] border border-[#222] rounded-xl ${app.color}`}>
                        <app.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        app.active 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-slate-50 dark:bg-[#161616]0/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {app.active ? 'Native' : 'Beta'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{app.cat}</span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">{app.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{app.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
                    <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold transition">
                      Configure Integration <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
