'use client';

import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';
import { Target, Users, Shield, Zap, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="px-3 py-1 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20"
            >
              Our Story
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-[#fff] to-[#888] bg-clip-text text-transparent font-serif"
            >
              Reimagining CRM for Modern Enterprise
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed"
            >
              HubNest CRM started with a simple observation: mid-market enterprises are forced to stitch together separate tools for sales, marketing, support, and billing. We built HubNest to orchestrate everything in one premium workspace.
            </motion.p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 border-t border-[#161616] bg-[#0c0c0c]">
          <div className="mx-auto w-[90%] xl:max-w-[85%] 2xl:max-w-[1400px] px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-6 text-white flex items-center gap-3">
                <Target className="text-orange-500 w-8 h-8" /> Our Mission
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                To equip scaling businesses with enterprise-grade operational software, advanced artificial intelligence, and unified data views—without the complexity of legacy configurations.
              </p>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                We believe security, high performance, offline synchronization, and modular control should be defaults, not paid upgrade add-ons.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Users className="text-green-400 w-8 h-8 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">10K+ Users</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Active business teams executing operations daily.</p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Shield className="text-orange-400 w-8 h-8 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">GDPR Ready</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Full role scopes and isolated datastores per tenant.</p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Zap className="text-amber-400 w-8 h-8 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">99.99% Uptime</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Multi-region API servers and load balanced pools.</p>
              </div>
              <div className="p-6 bg-[#111] border border-[#1f1f1f] rounded-2xl">
                <Heart className="text-red-400 w-8 h-8 mb-4" />
                <h3 className="font-bold text-white text-base mb-2">Customer Driven</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Features crafted side-by-side with industry heads.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
