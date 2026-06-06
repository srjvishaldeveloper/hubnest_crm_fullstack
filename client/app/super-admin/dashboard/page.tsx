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
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#0F172A]">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

/* ── Dashboard page ────────────────────────────── */
export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Section title="CRM Overview" subtitle="Key performance indicators across all tenants" delay={0}>
        <KPICards />
      </Section>

      <Section title="Business Overview" subtitle="Sales performance & revenue snapshot" delay={0.05}>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
          <div className="xl:col-span-3"><SalesOverview /></div>
          <div className="xl:col-span-2"><FinanceSnapshot /></div>
        </div>
      </Section>

      <Section title="CRM Health" subtitle="Lead pipeline, support, campaigns & finance" delay={0.1}>
        <CRMHealth />
      </Section>

      <Section title="Analytics" subtitle="User activity, roles, usage & trends" delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4">
          <UserActivity />
          <RoleDistribution />
          <div className="lg:col-span-1" />
        </div>
        <AnalyticsGrid />
      </Section>

      <Section title="Activity & Insights" subtitle="Recent events and AI-powered recommendations" delay={0.2}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <RecentActivities />
          <AIInsights />
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
