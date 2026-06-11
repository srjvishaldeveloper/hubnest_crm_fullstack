'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Download, FileText, Mail, ArrowUpRight } from 'lucide-react';

const RELEASES = [
  { title: 'HubNest CRM Launches Version 1.2.0 with Native AI Insights Engine', date: 'June 8, 2026' },
  { title: 'HubNest CRM Announces Partnership with SRJ Global Tech for Enterprise Distribution', date: 'May 14, 2026' }
];

export default function PressPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Press kit
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Newsroom & Media Assets
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Find brand guidelines, logo assets, company stats, and recent press releases for media usage.
            </p>
          </div>
        </section>

        {/* Assets & News */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left: Kits download */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-bold font-serif text-white">Brand Assets</h2>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl hover:border-orange-500/30 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Logo Pack (.zip)</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Vector SVG & PNG formats</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl hover:border-orange-500/30 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Brand Guidelines</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Color palettes & typographies</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="p-6 bg-[#111]/50 border border-[#1f1f1f] rounded-2xl flex items-center gap-4">
                <Mail className="w-8 h-8 text-slate-500" />
                <div>
                  <h4 className="text-xs font-bold text-white">Press Contact</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">press@jobnestcrm.com</p>
                </div>
              </div>
            </div>

            {/* Right: Releases list */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold font-serif text-white">Recent Releases</h2>
              <div className="space-y-4">
                {RELEASES.map((rel, idx) => (
                  <div key={idx} className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl hover:border-orange-500/20 transition flex justify-between items-start gap-4 cursor-pointer group">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">{rel.date}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition mt-1">{rel.title}</h3>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
