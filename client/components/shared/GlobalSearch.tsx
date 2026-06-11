'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, Settings, LayoutDashboard, ShieldCheck, Database, Building2 } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'super-admin' | 'tenant-admin' | 'user';
}

export default function GlobalSearch({ isOpen, onClose, role }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open the modal somehow? This component only controls rendering.
          // The parent should handle the shortcut to open it.
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const superAdminRoutes = [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: 'Tenants Overview', path: '/super-admin/tenants', icon: Building2 },
    { name: 'All Users', path: '/super-admin/users', icon: Users },
    { name: 'Platform Settings', path: '/super-admin/settings', icon: Settings },
    { name: 'Security & Auth', path: '/super-admin/security', icon: ShieldCheck },
    { name: 'Database Status', path: '/status', icon: Database },
  ];

  // Extend for other roles if needed later
  const routes = role === 'super-admin' ? superAdminRoutes : superAdminRoutes;

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#222] z-[101] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-[#222]">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything... (Pages, Settings, Users)"
                className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 text-base placeholder:text-slate-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-[#a3a3a3] bg-slate-100 dark:bg-[#161616] border border-slate-200 dark:border-[#1f1f1f] px-1.5 py-0.5 rounded-md shrink-0">
                ESC
              </kbd>
              <button onClick={onClose} className="p-1 sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Links
                  </div>
                  {filteredRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={route.path}
                        onClick={() => handleSelect(route.path)}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-[#1C2230] text-slate-700 dark:text-slate-300 hover:text-[#F59E0B] transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#161616] group-hover:bg-amber-100 dark:group-hover:bg-[#F59E0B]/20 text-slate-500 dark:text-slate-400 group-hover:text-[#F59E0B] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{route.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No results found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
