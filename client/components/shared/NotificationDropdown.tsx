'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_NOTIFS = [
  { id: 1, title: 'System Update', text: 'v2.4 deployed successfully.', time: '2m ago', type: 'info', read: false },
  { id: 2, title: 'New Lead Assigned', text: 'Acme Corp just signed up.', time: '1h ago', type: 'success', read: false },
  { id: 3, title: 'Server Alert', text: 'High CPU load detected on node 4.', time: '3h ago', type: 'warning', read: true },
  { id: 4, title: 'Security Scan', text: 'No vulnerabilities found.', time: '1d ago', type: 'security', read: true },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, read: true })));

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2A2A2A] transition group"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-[8px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#1A1A1A]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white dark:ring-[#1A1A1A]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#333] rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#2A2A2A] bg-slate-50 dark:bg-[#1A1A1A]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#333]">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No new notifications</div>
              ) : (
                notifs.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 p-4 border-b border-slate-50 dark:border-[#252525] hover:bg-slate-50 dark:hover:bg-[#222] transition ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      n.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      n.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {n.type === 'info' && <Info className="w-4 h-4" />}
                      {n.type === 'success' && <Check className="w-4 h-4" />}
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {n.type === 'security' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.text}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
            
            <div className="p-2 bg-slate-50 dark:bg-[#1A1A1A] border-t border-slate-100 dark:border-[#2A2A2A] text-center">
              <button className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">View All</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
