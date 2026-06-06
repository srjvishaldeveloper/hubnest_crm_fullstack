'use client';

import { useState } from 'react';
import MarketingSidebar from '../../components/marketing/MarketingSidebar';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import SessionTimer from '../../components/SessionTimer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  }

  const sidebarW = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SessionTimer />
      <MarketingSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <MarketingHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
