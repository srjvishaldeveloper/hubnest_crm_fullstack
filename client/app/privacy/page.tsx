'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-xs text-slate-500 font-bold">Last Updated: June 2026</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="mx-auto w-[90%] max-w-[800px] px-4 prose prose-invert text-xs sm:text-sm text-slate-400 leading-relaxed space-y-6">
            <p>
              HubNest CRM ("we", "us", or "our") respects your privacy and is committed to protecting the personal data of our tenant users, administrators, and visitors.
            </p>
            
            <h2 className="text-lg font-bold text-white font-serif pt-4">1. Data Scoping & Isolation</h2>
            <p>
              We compile and maintain strict logical isolation of tenant databases. Any customer leads, invoice logs, or campaign files generated within a tenant workspace reside in scoped schemas and are not accessible by other tenants or unauthorized platform processes.
            </p>

            <h2 className="text-lg font-bold text-white font-serif pt-4">2. Information We Collect</h2>
            <p>
              To run the HubNest SaaS services, we collect profile parameters (such as names, verified email addresses, phone coordinates for Twilio SMS MFA logins) and billing transaction parameters (processed securely through Stripe).
            </p>

            <h2 className="text-lg font-bold text-white font-serif pt-4">3. Security Metrics</h2>
            <p>
              Session tokens are generated using cryptographically secure JSON Web Tokens. Access scopes are checked on every API transaction to prevent unauthorized cross-tenant data requests.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
