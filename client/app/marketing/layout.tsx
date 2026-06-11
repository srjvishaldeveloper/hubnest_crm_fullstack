'use client';

import { useState, useEffect } from 'react';
import MarketingSidebar from '../../components/marketing/MarketingSidebar';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import { MarketingErrorBoundary } from '../../components/marketing/MarketingErrorBoundary';
import SessionTimer from '../../components/SessionTimer';
import AIChatbot from '../../components/AIChatbot';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
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
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarCollapsed((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  }

  const sidebarW = sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[240px]';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <SessionTimer />
      <AIChatbot />
      <MarketingSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className={`transition-all duration-300 ${sidebarW} flex flex-col min-h-screen`}>
        <MarketingHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-[1600px] mx-auto">
            <MarketingErrorBoundary>{children}</MarketingErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
