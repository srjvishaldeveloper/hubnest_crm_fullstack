'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Calendar, User, Clock } from 'lucide-react';

const POSTS = [
  {
    title: 'Scaling B2B SaaS Multi-Tenancy: Logical vs Physical Isolation',
    excerpt: 'Explore the trade-offs of database routing, schema pools, and row-level scoping for secure enterprise workloads.',
    author: 'Alex Carter',
    date: 'June 4, 2026',
    readTime: '6 min read',
    cat: 'Engineering'
  },
  {
    title: 'Implementing Resilient Multi-Factor Auth Flow with Twilio API',
    excerpt: 'Step-by-step architecture for secure user tokens, SMS passcode dispatches, and email delivery fallbacks.',
    author: 'Sarah Lin',
    date: 'May 28, 2026',
    readTime: '8 min read',
    cat: 'Security'
  },
  {
    title: 'Offline-First Web Frameworks: Leveraging Dexie.js and IndexedDB',
    excerpt: 'How we synchronized complex sales workflows local-first in Next.js and React for un-interrupted executive usage.',
    author: 'Marcus Vance',
    date: 'May 12, 2026',
    readTime: '5 min read',
    cat: 'Productivity'
  }
];

export default function BlogPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <span className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Blog & Insights
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif">
              HubNest Engineering & Operations
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Technical designs, security guidelines, operational scaling patterns, and B2B SaaS strategies from our core team.
            </p>
          </div>
        </section>

        {/* Article Cards Grid */}
        <section className="py-12 border-t border-[#161616]">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {POSTS.map((post) => (
                <article key={post.title} className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl hover:border-orange-500/30 transition duration-300 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 font-bold uppercase tracking-wider">{post.cat}</span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2 hover:text-orange-400 cursor-pointer transition leading-snug">{post.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">{post.excerpt}</p>
                  </div>
                  <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.author}</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
