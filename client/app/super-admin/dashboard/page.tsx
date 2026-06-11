'use client';

import { motion } from 'framer-motion';
import KPICards from '../../../components/super-admin/KPICards';
import SalesOverview from '../../../components/super-admin/SalesOverview';
import FinanceSnapshot from '../../../components/super-admin/FinanceSnapshot';
import CRMHealth from '../../../components/super-admin/CRMHealth';
import UserActivity from '../../../components/super-admin/UserActivity';
import RoleDistribution from '../../../components/super-admin/RoleDistribution';
import AnalyticsGrid from '../../../components/super-admin/AnalyticsGrid';
import RecentActivities from '../../../components/super-admin/RecentActivities';
import AIInsights from '../../../components/super-admin/AIInsights';
import SecurityStatus from '../../../components/super-admin/SecurityStatus';
import IntegrationsPanel from '../../../components/super-admin/IntegrationsPanel';
import QuickActions from '../../../components/super-admin/QuickActions';
import TopPerformers from '../../../components/super-admin/TopPerformers';
import SystemStatus from '../../../components/super-admin/SystemStatus';
import { useDashboard } from './useDashboard';

/* ── Section wrapper with animation ───────────── */
function Section({
  children,
  title,
  subtitle,
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <div className="flex items-end justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F9FAFB]">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

/* ── Dashboard page ────────────────────────────── */
export default function SuperAdminDashboard() {
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
          <div className="xl:col-span-3 h-80 bg-slate-200 rounded-3xl"></div>
          <div className="xl:col-span-2 h-80 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-500 mb-4 font-medium">Failed to load dashboard data.</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-[#F59E0B] text-white rounded-xl hover:bg-amber-600 transition shadow-sm shadow-amber-500/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Section title="CRM Overview" subtitle="Key performance indicators across all tenants" delay={0}>
        <KPICards data={data} />
      </Section>

      <Section title="Business Overview" subtitle="Sales performance & revenue snapshot" delay={0.05}>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
          <div className="xl:col-span-3"><SalesOverview data={data.sales_performance} /></div>
          <div className="xl:col-span-2"><FinanceSnapshot data={data.revenue_snapshot} /></div>
        </div>
      </Section>

      <Section title="CRM Health" subtitle="Lead pipeline, support, campaigns & finance" delay={0.1}>
        <CRMHealth 
          leadPipeline={data.lead_pipeline}
          supportOverview={data.support_overview}
          campaignPerformance={data.campaign_performance}
          financeOverview={data.finance_overview}
        />
      </Section>

      <Section title="Analytics" subtitle="User activity, roles, usage & trends" delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4">
          <UserActivity />
          <RoleDistribution />
        </div>
        <AnalyticsGrid />
      </Section>

      <Section title="Activity & Insights" subtitle="Recent events and AI-powered recommendations" delay={0.2}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <RecentActivities data={data.recent_activities} />
          <AIInsights data={data.ai_insights} />
        </div>
      </Section>

      <Section title="Security" subtitle="Security metrics and recent security events" delay={0.25}>
        <SecurityStatus />
      </Section>

      <Section title="Integrations" subtitle="Third-party service connections and status" delay={0.3}>
        <IntegrationsPanel />
      </Section>

      <Section title="Quick Actions" subtitle="Frequently used administrative actions" delay={0.35}>
        <QuickActions />
      </Section>

      <Section title="Top Performers" subtitle="Best performing team members this month" delay={0.4}>
        <TopPerformers />
      </Section>

      <Section title="System Status" subtitle="Infrastructure health and service monitoring" delay={0.45}>
        <SystemStatus />
      </Section>
    </div>
  );
}
