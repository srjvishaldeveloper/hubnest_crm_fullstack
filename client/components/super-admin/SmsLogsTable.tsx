'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';

interface SmsLog {
  id: string;
  phone_number: string;
  message_type: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  provider: string;
  provider_sid: string | null;
  sent_at: string;
  delivered_at: string | null;
  error_message: string | null;
  user_name: string | null;
  user_email: string | null;
}

interface SmsStats {
  sent_today: number;
  delivered_today: number;
  failed_today: number;
  otp_today: number;
  delivery_rate: number;
}

const STATUS_CONFIG = {
  pending:   { icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20',   label: 'Pending' },
  sent:      { icon: CheckCircle,  color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',     label: 'Sent' },
  delivered: { icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Delivered' },
  failed:    { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',       label: 'Failed' },
};

const TYPE_LABELS: Record<string, string> = {
  otp_login:    'OTP Login',
  otp_reset:    'OTP Reset',
  credentials:  'Credentials',
  verification: 'Verification',
  custom:       'Custom',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function SmsLogsTable() {
  const [logs, setLogs]       = useState<SmsLog[]>([]);
  const [stats, setStats]     = useState<SmsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter) params.set('status', filter);
      if (typeFilter) params.set('message_type', typeFilter);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/sms/logs?${params.toString()}`),
        api.get('/sms/stats'),
      ]);
      setLogs(logsRes.data.data.logs);
      setStats(statsRes.data.data.stats);
    } catch {
      // silently handle error
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Sent Today',     value: stats.sent_today,      color: 'text-blue-500' },
            { label: 'Delivered',      value: stats.delivered_today, color: 'text-emerald-500' },
            { label: 'Failed',         value: stats.failed_today,    color: 'text-red-500' },
            { label: 'OTP Requests',   value: stats.otp_today,       color: 'text-amber-500' },
            { label: 'Delivery Rate',  value: `${stats.delivery_rate ?? 0}%`, color: 'text-purple-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-3.5 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF] mt-0.5 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Logs table */}
      <div className="rounded-2xl border border-slate-100 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
              SMS Delivery Logs
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">{logs.length} records</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-[#222] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#161616] text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-[#222] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#161616] text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="">All Types</option>
              <option value="otp_login">OTP Login</option>
              <option value="credentials">Credentials</option>
              <option value="verification">Verification</option>
            </select>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222] hover:bg-slate-50 dark:bg-[#161616] dark:hover:bg-[#1a1a1a] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No SMS logs found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">SMS delivery records will appear here once sent</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
                  {['Phone', 'User', 'Type', 'Status', 'Sent At', 'Error'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-50 dark:border-[#1a1a1a] last:border-0 hover:bg-slate-50 dark:bg-[#161616]/50 dark:hover:bg-[#1a1a1a]/50"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-[#0F172A] dark:text-[#E5E7EB]">{log.phone_number}</td>
                      <td className="py-3 px-4">
                        {log.user_name ? (
                          <div>
                            <p className="text-xs font-semibold text-[#0F172A] dark:text-[#E5E7EB]">{log.user_name}</p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#9CA3AF]">{log.user_email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#9CA3AF] bg-slate-100 dark:bg-[#1f1f1f] px-2 py-0.5 rounded-md">
                          {TYPE_LABELS[log.message_type] || log.message_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#64748B] dark:text-[#9CA3AF] whitespace-nowrap">
                        {formatDate(log.sent_at)}
                      </td>
                      <td className="py-3 px-4">
                        {log.error_message ? (
                          <div className="flex items-center gap-1 text-[11px] text-red-500">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]" title={log.error_message}>{log.error_message}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
