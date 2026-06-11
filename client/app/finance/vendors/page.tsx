'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { financeGetVendors, financeCreateVendor, financeUpdateVendor } from '../../../services/financeService';
import {
  Building2, Search, Plus, RefreshCw, X, Mail, Phone,
  MapPin, CheckCircle2, XCircle
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string;
  status: string;
  created_at: string;
}

function VendorsContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [vName, setVName] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vCategory, setVCategory] = useState('General');

  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') {
      setShowCreateModal(true);
    }
  }, [action]);

  async function loadVendors() {
    try {
      setLoading(true);
      setError('');
      const res = await financeGetVendors({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20
      });
      setVendors(res.vendors);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load vendors', err);
      setError('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, [statusFilter, categoryFilter, page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!vName) return;
    try {
      setSubmitting(true);
      await financeCreateVendor({
        name: vName,
        email: vEmail || undefined,
        phone: vPhone || undefined,
        address: vAddress || undefined,
        category: vCategory
      });
      setShowCreateModal(false);
      setVName(''); setVEmail(''); setVPhone(''); setVAddress(''); setVCategory('General');
      loadVendors();
    } catch (err) {
      console.error('Failed to create vendor', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    try {
      await financeUpdateVendor(id, { status: currentStatus === 'Active' ? 'Inactive' : 'Active' });
      loadVendors();
    } catch (err) {
      console.error('Failed to update vendor', err);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Vendors</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Manage your vendor and supplier directory.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search vendors..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadVendors()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--primary)] w-52 bg-[var(--card)] text-[var(--foreground)]" />
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] focus:outline-none bg-[var(--card)]">
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Services">Services</option>
            <option value="Supplies">Supplies</option>
            <option value="Consulting">Consulting</option>
            <option value="General">General</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] px-4 py-2 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </button>
        </div>
      </motion.div>

      {/* Vendor Cards Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin" />
              <p className="text-xs text-[var(--muted-foreground)]">Loading vendors...</p>
            </div>
          </div>
        ) : error ? (
          <div className="min-h-[40vh] flex items-center justify-center text-[var(--destructive)] text-sm">{error}</div>
        ) : vendors.length === 0 ? (
          <div className="min-h-[40vh] flex items-center justify-center text-[var(--muted-foreground)] text-sm">No vendors found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-950/30 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--foreground)]">{v.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider mt-0.5
                        ${v.category === 'Technology' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' :
                          v.category === 'Consulting' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                          v.category === 'Supplies' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          'bg-slate-50 dark:bg-[#161616] text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}
                      >
                        {v.category}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase
                    ${v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[var(--muted-foreground)]">
                  {v.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{v.email}</span>
                    </div>
                  )}
                  {v.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{v.phone}</span>
                    </div>
                  )}
                  {v.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{v.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                    Added {new Date(v.created_at).toLocaleDateString()}
                  </span>
                  <button onClick={() => handleToggleStatus(v.id, v.status)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg transition
                      ${v.status === 'Active' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50' :
                        'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'}`}
                  >
                    {v.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {!loading && vendors.length > 0 && (
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {vendors.length} of {total} vendors</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={vendors.length < 20}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Add New Vendor</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs font-semibold text-[var(--muted-foreground)]">
              <div className="space-y-1">
                <label>Vendor Name *</label>
                <input type="text" required value={vName} onChange={e => setVName(e.target.value)} placeholder="Company Name"
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Email</label>
                  <input type="email" value={vEmail} onChange={e => setVEmail(e.target.value)} placeholder="vendor@company.com"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
                <div className="space-y-1">
                  <label>Phone</label>
                  <input type="text" value={vPhone} onChange={e => setVPhone(e.target.value)} placeholder="+91 98765 43210"
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
                </div>
              </div>
              <div className="space-y-1">
                <label>Address</label>
                <input type="text" value={vAddress} onChange={e => setVAddress(e.target.value)} placeholder="Full address"
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] text-xs bg-[var(--card)]" />
              </div>
              <div className="space-y-1">
                <label>Category</label>
                <select value={vCategory} onChange={e => setVCategory(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none bg-[var(--card)]">
                  <option value="General">General</option>
                  <option value="Technology">Technology</option>
                  <option value="Services">Services</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--accent)] text-[var(--foreground)]">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-bold rounded-xl shadow-md">
                  {submitting ? 'Adding...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-amber-500 border-t-transparent" />
      </div>
    }>
      <VendorsContent />
    </Suspense>
  );
}
