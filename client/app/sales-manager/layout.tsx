'use client';

import { useState, useEffect } from 'react';
import SalesManagerSidebar from '../../components/sales-manager/SalesManagerSidebar';
import AdminHeader from '../../components/shared/AdminHeader';
import SessionTimer from '../../components/SessionTimer';
import AIChatbot from '../../components/AIChatbot';

export default function SalesManagerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) setSidebarCollapsed(v => !v);
    else setSidebarOpen(v => !v);
  }
  const sidebarW = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]';
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f0f] text-foreground transition-colors duration-200">
      <SessionTimer />
      <AIChatbot />
      <SalesManagerSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <AdminHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} role="Sales Manager" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 scrollbar-main"><div className="max-w-[1600px] mx-auto">{children}</div></main>
      </div>
    </div>
  );
}
