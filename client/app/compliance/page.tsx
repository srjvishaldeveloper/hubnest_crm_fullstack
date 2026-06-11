'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { ShieldCheck, Award, FileSpreadsheet, Lock } from 'lucide-react';

export default function CompliancePage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Title Header */}
        <section className="relative pt-32 pb-12 overflow-hidden border-b border-[#161616]">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] max-w-[800px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Compliance
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Regulatory Standards
            </h1>
            <p className="mt-4 mx-auto max-w-xl text-sm text-slate-400 leading-relaxed">
              We ensure corporate compliance with top financial, regional, and data governance regulations.
            </p>
          </div>
        </section>

        {/* Compliance details */}
        <section className="py-12">
          <div className="mx-auto w-[90%] max-w-[800px] px-4 space-y-6">
            <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl flex items-start gap-4">
              <Award className="w-8 h-8 text-orange-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white text-base mb-1">SOC 2 Type II</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We audit security, availability, and confidentiality parameters annually to ensure compliance with AICPA standards.
                </p>
              </div>
            </div>
            <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl flex items-start gap-4">
              <Lock className="w-8 h-8 text-green-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white text-base mb-1">GDPR Compliance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tenants have full control over data residency, user right-to-be-forgotten queries, and isolated database migrations.
                </p>
              </div>
            </div>
            <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl flex items-start gap-4">
              <FileSpreadsheet className="w-8 h-8 text-indigo-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white text-base mb-1">PCI-DSS Compliant Gateway</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stripe handles card info processing directly, ensuring tenant billing conforms to industry payment security.
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
