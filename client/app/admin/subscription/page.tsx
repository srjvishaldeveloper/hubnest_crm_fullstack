'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Zap, Gem, Users, Building2, Target, Contact2, Megaphone,
  GitBranch, ArrowUpRight, Check, Loader2, ShieldCheck, FileText,
  Globe, ClipboardList, BarChart3, TrendingUp,
} from 'lucide-react';
import { getPlans, getCurrentPlan, getUsageDashboard, upgradePlan } from '../../../services/subscriptionService';
import type { SubscriptionPlan, UsageItem, CurrentPlan } from '../../../services/subscriptionService';

const RESOURCE_META: Record<string, { label: string; icon: any; color: string }> = {
  departments: { label: 'Departments', icon: Building2, color: '#8B5CF6' },
  team_members: { label: 'Team Members', icon: Users, color: '#2563EB' },
  leads: { label: 'Leads', icon: Target, color: '#10B981' },
  contacts: { label: 'Contacts', icon: Contact2, color: '#0891B2' },
  campaigns: { label: 'Campaigns', icon: Megaphone, color: '#F59E0B' },
  pipelines: { label: 'Pipelines', icon: GitBranch, color: '#EC4899' },
  reports: { label: 'Reports', icon: BarChart3, color: '#6366F1' },
  white_label: { label: 'White Label', icon: Globe, color: '#14B8A6' },
  api_access: { label: 'API Access', icon: FileText, color: '#F97316' },
  audit_logs: { label: 'Audit Logs', icon: ClipboardList, color: '#64748B' },
};

const PLAN_ICONS: Record<string, any> = {
  starter: Zap,
  pro: Crown,
  enterprise: Gem,
};

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  starter: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  pro: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', gradient: 'from-violet-500 to-purple-600' },
  enterprise: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-500 to-orange-600' },
};

export default function SubscriptionUsagePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, c, u] = await Promise.all([getPlans(), getCurrentPlan(), getUsageDashboard()]);
      setPlans(p);
      setCurrent(c);
      setUsage(u);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planSlug: string) {
    if (upgrading) return;
    setUpgrading(planSlug);
    try {
      await upgradePlan(planSlug);
      await loadData();
      alert('Plan upgraded successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const currentSlug = current?.plan?.slug || 'starter';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Subscription & Usage</h2>
        <p className="text-xs text-slate-500 mt-1">Monitor your plan usage and manage your subscription.</p>
      </div>

      {/* Current Plan Card */}
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${PLAN_COLORS[currentSlug]?.gradient || 'from-blue-500 to-blue-600'} rounded-2xl p-6 text-white shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = PLAN_ICONS[currentSlug] || Zap;
                return <Icon className="w-8 h-8 text-white/80" />;
              })()}
              <div>
                <h3 className="text-lg font-extrabold">{current.plan.name} Plan</h3>
                <p className="text-sm text-white/70 mt-0.5">{current.plan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">
                ${current.subscription?.billing_cycle === 'yearly'
                  ? current.plan.price_yearly
                  : current.plan.price_monthly}
                <span className="text-sm font-medium text-white/60">
                  /{current.subscription?.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                </span>
              </p>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                {current.subscription?.status || 'Active'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Usage Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Resource Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {usage.map((item, idx) => {
            const meta = RESOURCE_META[item.resource] || { label: item.resource, icon: BarChart3, color: '#64748B' };
            const Icon = meta.icon;
            const pct = item.is_unlimited ? 0 : item.percentage;
            const isHigh = pct >= 80;
            const isAtLimit = pct >= 100;

            return (
              <motion.div
                key={item.resource}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-xl border transition ${
                  isAtLimit ? 'border-red-200 bg-red-50/50' : isHigh ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB]">{meta.label}</span>
                  </div>
                  {item.is_unlimited ? (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Unlimited</span>
                  ) : (
                    <span className={`text-[10px] font-bold ${isAtLimit ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-slate-500'}`}>
                      {pct}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">
                    {item.current_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    / {item.is_unlimited ? '∞' : item.max_allowed.toLocaleString()}
                  </span>
                </div>
                {!item.is_unlimited && (
                  <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAtLimit ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB] mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const slug = plan.slug;
            const colors = PLAN_COLORS[slug] || PLAN_COLORS.starter;
            const Icon = PLAN_ICONS[slug] || Zap;
            const isCurrent = slug === currentSlug;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative p-5 rounded-2xl border-2 transition ${
                  isCurrent ? `${colors.border} ${colors.bg}` : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    Current
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-base font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{plan.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{plan.description}</p>
                <p className="text-xl font-black text-[#0F172A] dark:text-[#F9FAFB] mt-3">
                  ${plan.price_monthly}
                  <span className="text-xs font-medium text-slate-400">/mo</span>
                </p>

                <div className="mt-4 space-y-2">
                  {Object.entries(plan.limits || {}).map(([resource, limit]) => {
                    const meta = RESOURCE_META[resource];
                    if (!meta) return null;
                    return (
                      <div key={resource} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-slate-600">
                          {limit === -1 ? 'Unlimited' : limit.toLocaleString()} {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleUpgrade(slug)}
                    disabled={!!upgrading}
                    className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                      upgrading === slug
                        ? 'opacity-50 cursor-wait'
                        : `bg-gradient-to-r ${colors.gradient} text-white hover:opacity-90`
                    }`}
                  >
                    {upgrading === slug ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Upgrade to {plan.name}
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
