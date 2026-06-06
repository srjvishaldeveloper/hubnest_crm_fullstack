'use client';

import { useState } from 'react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import AdminHeader from '../../components/shared/AdminHeader';
import SessionTimer from '../../components/SessionTimer';

export default function SalesManagerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarCollapsed(v => !v);
    else setSidebarOpen(v => !v);
  }
  const sidebarW = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]';
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SessionTimer />
      <AdminSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} role="Sales Manager" />
      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <AdminHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} role="Sales Manager" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 scrollbar-main"><div className="max-w-[1600px] mx-auto">{children}</div></main>
      </div>
    </div>
  );
}
