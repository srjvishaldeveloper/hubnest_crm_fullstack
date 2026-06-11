'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Title Header */}
        <section className="relative pt-32 pb-12 overflow-hidden border-b border-[#161616]">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] max-w-[800px] px-4">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-3">Legal</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Terms of Service
            </h1>
            <p className="mt-4 text-xs text-slate-500 font-bold">Last Updated: June 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="mx-auto w-[90%] max-w-[800px] px-4 prose prose-invert text-xs sm:text-sm text-slate-400 leading-relaxed space-y-6">
            <p>
              By accessing or using the HubNest CRM platform, you agree to comply with and be bound by these Terms of Service.
            </p>
            
            <h2 className="text-lg font-bold text-white font-serif pt-4">1. License & Subscription</h2>
            <p>
              We grant you a non-exclusive, non-transferable, revocable subscription license to use HubNest CRM features based on your selected plan tiers (Starter, Pro, Enterprise, or Custom). Custom usage limits are monitored by platform administrators.
            </p>

            <h2 className="text-lg font-bold text-white font-serif pt-4">2. Acceptable Use Policies</h2>
            <p>
              You agree not to bypass security scopes, attempt SQL injections, intercept cross-tenant endpoints, or misuse Twilio SMS MFA tokens. Platform admins reserve rights to suspend any tenant violating these guidelines.
            </p>

            <h2 className="text-lg font-bold text-white font-serif pt-4">3. Billing & Payments</h2>
            <p>
              Fees are billed in advance on a recurring monthly or annual basis. Refunds are governed by our refund management system and must be submitted to our support queue for administrator audit.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
