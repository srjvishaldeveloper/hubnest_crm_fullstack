'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';

const JOBS = [
  { title: 'Senior Fullstack Engineer', dept: 'Engineering', loc: 'Remote (Global)', type: 'Full-time' },
  { title: 'Product Manager (B2B SaaS)', dept: 'Product', loc: 'New York, US (Hybrid)', type: 'Full-time' },
  { title: 'Backend Systems Architect', dept: 'Engineering', loc: 'Remote (Europe/US)', type: 'Full-time' },
  { title: 'Customer Support Lead', dept: 'Operations', loc: 'Remote (Asia-Pacific)', type: 'Full-time' }
];

export default function CareersPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
              Careers
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              Work on What Matters
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              We are a distributed team of engineers, designers, and operators passionate about building state-of-the-art enterprise operational systems.
            </p>
          </div>
        </section>

        {/* Job Openings */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4">
            <h2 className="text-2xl font-bold font-serif mb-8 text-white">Open Opportunities</h2>
            <div className="space-y-4 max-w-4xl">
              {JOBS.map((job) => (
                <div key={job.title} className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl hover:border-orange-500/30 transition duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">{job.dept}</span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.loc}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.type}</span>
                    </div>
                  </div>
                  <div>
                    <a href="mailto:careers@jobnestcrm.com" className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition text-xs font-bold inline-flex items-center gap-1">
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
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
