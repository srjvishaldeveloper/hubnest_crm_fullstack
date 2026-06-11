'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import SessionTimer from '../../components/SessionTimer';
import ThemeToggle from '../../components/shared/ThemeToggle';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-200">
      <SessionTimer />
      {/* Top Navigation */}
      <header className="bg-white dark:bg-[#111111] border-b border-slate-200 dark:border-[#1f1f1f] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg">HubNest CRM</span>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.role}</span>
              </div>
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-blue-100 text-sm">You are logged in as <span className="font-semibold text-white">{user.role}</span></p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Jobs', value: '—', icon: '💼' },
            { label: 'Active Users', value: '—', icon: '👥' },
            { label: 'Tenants', value: '—', icon: '🏢' },
            { label: 'Reports', value: '—', icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-[#161616] rounded-xl border border-slate-200 dark:border-[#1f1f1f] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-[#161616] rounded-xl border border-slate-200 dark:border-[#1f1f1f] shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Admin ID', value: user.adminId || '—' },
              { label: 'Role', value: user.role },
              { label: 'Tenant ID', value: user.tenantId },
              { label: 'Status', value: 'Active' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{item.label}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase note */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <p className="text-amber-800 dark:text-amber-400 text-sm font-medium">
            Phase 1 Complete — Auth + RBAC + Multi-tenancy foundation is active.
            Phase 2 will add job management, candidate pipeline, and tenant admin modules.
          </p>
        </div>
      </main>
    </div>
  );
}
