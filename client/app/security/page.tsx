'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Shield, Key, Lock, EyeOff } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Title Header */}
        <section className="relative pt-32 pb-12 overflow-hidden border-b border-[#161616]">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] max-w-[800px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Security
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Enterprise-Grade Protection
            </h1>
            <p className="mt-4 mx-auto max-w-xl text-sm text-slate-400 leading-relaxed">
              We implement industry-standard encryption, strict access controls, and validation protocols to keep business records secure.
            </p>
          </div>
        </section>

        {/* Security Cards */}
        <section className="py-12">
          <div className="mx-auto w-[90%] max-w-[800px] px-4 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Key className="w-8 h-8 text-orange-400 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">Twilio MFA & OTPs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dual-layer user validation prevents session hijackings. Includes automated secure email fallback dispatch loops.
                </p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Lock className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">Data Isolation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Logical datastores separation and isolated schemas per B2B customer prevent cross-tenant information leakage.
                </p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <EyeOff className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">JWT Encryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Session credentials are authenticated using cryptographically signed JSON Web Tokens (JWT) with automatic expirations.
                </p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Shield className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">System Auditing</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track user operations and administrative configuration edits in permanent, tamper-resistant system logs.
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
