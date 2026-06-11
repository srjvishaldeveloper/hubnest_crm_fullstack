'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import AdminHeader from '../../components/shared/AdminHeader';
import SessionTimer from '../../components/SessionTimer';
import AIChatbot from '../../components/AIChatbot';
import { useAuthStore } from '../../store/authStore';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = (user?.role as string) || 'Finance Manager';

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

  const sidebarW = sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[240px]';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <SessionTimer />
      <AIChatbot />
      <AdminSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} role={role} />
      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <AdminHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} role={role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 scrollbar-main">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
