'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supportGetCustomers } from '../../../services/supportService';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Star,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  total_tickets: string;
  last_interaction: string | null;
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await supportGetCustomers({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setCustomers(res.customers);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [statusFilter, page]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB] tracking-tight">Customers CRM Directory</h1>
          <p className="text-xs text-slate-500">Track and manage customer platform activity, tickets, and retention metrics.</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadCustomers()}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 w-56 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={loadCustomers}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Customers List Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-[#161616] border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All CRM Users ({total})</span>
          <button
            onClick={loadCustomers}
            className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1f1f1f] text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-[#161616]/50">
                <th className="p-4 font-semibold">Customer Name</th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold text-center">Total Tickets</th>
                <th className="p-4 font-semibold">Last Activity</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium text-[#0F172A] dark:text-[#F9FAFB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Retrieving customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No customers found matching search filters.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/support/customers/${c.id}`)}
                    className="hover:bg-slate-50 dark:bg-[#161616]/60 cursor-pointer transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-[#2563EB] rounded-full flex items-center justify-center font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <span className="text-[10px] text-slate-400">ID: #{c.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-600">{c.email}</p>
                      <p className="text-[10px] text-slate-400">{c.phone || 'No phone number'}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-500 font-semibold">{c.company || 'Personal Account'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg min-w-8">
                        {c.total_tickets}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {c.last_interaction ? new Date(c.last_interaction).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide
                        ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-[#161616]/50">
          <span>Showing {customers.length} of {total} customers</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-white bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={customers.length < 20}
              className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-white bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
