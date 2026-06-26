'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, ShieldCheck, Clock, Mail, UserPlus, Zap, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface Notification {
  id: string | number;
  title: string;
  text: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'security' | 'lead' | 'email' | 'automation';
  read: boolean;
}

function formatRelTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function mapServerNotif(n: any): Notification {
  const rawTime = n.sent_at || n.created_at || n.sentAt;
  return {
    id: n.id,
    title: n.title || 'Notification',
    text: n.message || n.text || '',
    time: rawTime ? formatRelTime(rawTime) : 'recently',
    type: (n.type as Notification['type']) || 'info',
    read: n.status === 'read' || !!n.read,
  };
}

export default function NotificationDropdown() {
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.role === 'Super Admin';

  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Correct endpoint per role
  const endpoint = isSuperAdmin ? '/super-admin/notifications' : '/notifications';

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(endpoint);
      // super-admin returns { data: { notifications: [...] } } or { data: [...] }
      const raw: any[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.notifications)
          ? res.data.data.notifications
          : Array.isArray(res.data?.notifications)
            ? res.data.notifications
            : [];
      if (raw.length > 0) {
        setNotifs(raw.map(mapServerNotif));
      } else if (!silent) {
        setNotifs([]);
      }
    } catch {
      // keep existing notifs on poll failure
    } finally {
      if (!silent) setLoading(false);
    }
  }, [endpoint]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Background poll every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchNotifications(true), 60000);
    // Initial silent fetch for badge count
    fetchNotifications(true);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    // persist to backend
    notifs.filter(n => !n.read).forEach(n => {
      api.put(`/notifications/${n.id}/read`).catch(() => {});
    });
  };

  const markRead = async (id: string | number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.put(`/notifications/${id}/read`).catch(() => {});
  };

  const dismiss = (id: string | number) => setNotifs(prev => prev.filter(n => n.id !== id));

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':       return <Info className="w-4 h-4" />;
      case 'success':    return <Check className="w-4 h-4" />;
      case 'warning':    return <AlertTriangle className="w-4 h-4" />;
      case 'security':   return <ShieldCheck className="w-4 h-4" />;
      case 'lead':       return <UserPlus className="w-4 h-4" />;
      case 'email':      return <Mail className="w-4 h-4" />;
      case 'automation': return <Zap className="w-4 h-4" />;
      default:           return <Info className="w-4 h-4" />;
    }
  };

  const getIconStyle = (type: Notification['type']) => {
    switch (type) {
      case 'info':       return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'success':    return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':    return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'security':   return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'lead':       return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'email':      return 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400';
      case 'automation': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      default:           return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(o => !o)}
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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                {loading && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Mark all read
                  </button>
                )}
                <button onClick={() => fetchNotifications()} className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white transition">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#333]">
              {loading && notifs.length === 0 ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : notifs.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No new notifications</div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`group relative flex items-start gap-3 p-4 border-b border-slate-50 dark:border-[#252525] hover:bg-slate-50 dark:hover:bg-[#222] transition cursor-pointer ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconStyle(n.type)}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={`text-sm font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.text}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {n.time}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 absolute right-4 top-4" />}
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                      className="absolute right-2 top-2 hidden group-hover:flex w-5 h-5 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#333] transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#1A1A1A] border-t border-slate-100 dark:border-[#2A2A2A] flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { fetchNotifications(); }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
