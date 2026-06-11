'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { BookOpen, UserCheck, Shield, Key, Search, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
  { title: 'Getting Started', desc: 'Onboarding guides, setting up company workspaces, and platform configurations.', icon: BookOpen, color: 'text-orange-400' },
  { title: 'Workspace Control', desc: 'Managing users, roles assignments, sidebar custom layouts, and department modules.', icon: UserCheck, color: 'text-green-400' },
  { title: 'Security & Auth', desc: 'Setting up Twilio MFA, handling email passcodes, and monitoring audit sessions.', icon: Shield, color: 'text-indigo-400' },
  { title: 'Developer Tools', desc: 'Managing API credentials, outbound webhooks parameters, and REST specs.', icon: Key, color: 'text-amber-400' }
];

const FAQS = [
  { q: 'How do I toggle the Two-Factor Twilio MFA?', a: 'Navigate to Security settings in your profile dashboard. If enabled, the system automatically sends SMS verification passcodes during login. Email backups are triggered automatically in case of SMS delays.' },
  { q: 'Can we manage multiple isolated databases?', a: 'Yes. HubNest is built as a multi-tenant scoped platform, ensuring full logical datastores separation and custom parameters configurations per registered business.' },
  { q: 'What happens to changes when the network goes offline?', a: 'The client application synchronizes state dynamically with the local browser IndexedDB using Dexie.js. Once connection is restored, logs compile and patch the Postgres databases.' }
];

export default function HelpCenterPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Search Header */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0c0c0c] border-b border-[#161616]">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Help Center
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              How Can We Help You?
            </h1>
            <div className="mt-8 mx-auto max-w-xl relative">
              <input
                type="text"
                placeholder="Search troubleshooting guides, API scopes..."
                className="w-full pl-11 pr-4 py-3 bg-[#111] border border-[#1f1f1f] rounded-2xl text-sm text-white focus:outline-none focus:border-orange-500 transition placeholder:text-slate-500 font-medium"
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CATEGORIES.map((cat) => (
                <div key={cat.title} className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl hover:border-orange-500/30 transition duration-300 flex flex-col justify-between cursor-pointer">
                  <div>
                    <div className={`p-3 bg-[#161616] border border-[#222] rounded-xl w-fit ${cat.color}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white mt-4 mb-2">{cat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] max-w-[750px] px-4">
            <h2 className="text-2xl font-bold font-serif mb-8 text-white text-center flex items-center justify-center gap-2">
              <HelpCircle className="text-orange-500" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="p-5 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-left font-bold text-sm text-white flex justify-between items-center outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xs text-orange-400">{activeFaq === idx ? 'Collapse' : 'Expand'}</span>
                  </button>
                  {activeFaq === idx && (
                    <p className="mt-4 text-xs text-slate-400 leading-relaxed border-t border-[#1a1a1a] pt-4">
                      {faq.a}
                    </p>
                  )}
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
