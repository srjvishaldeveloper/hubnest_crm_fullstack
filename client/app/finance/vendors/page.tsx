'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { financeGetVendors, financeCreateVendor, financeUpdateVendor } from '../../../services/financeService';
import {
  Building2, Search, Plus, RefreshCw, X, Mail, Phone,
  MapPin, Star, Check, AlertCircle, Globe, Hash,
  CreditCard, User, FileText, Landmark, ChevronDown, ChevronUp,
  Download, Upload, Tag
} from 'lucide-react';

/* ── Vendor data type ── */
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

/* ── Parse extra fields stored in address as JSON ── */
interface VendorExtras {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  website?: string;
  contactPerson?: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  paymentTerms?: string;
  notes?: string;
}

function parseAddress(raw: string | null): { street: string; extras: VendorExtras } {
  if (!raw) return { street: '', extras: {} };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const { street = '', ...extras } = parsed;
      return { street, extras };
    }
  } catch {}
  return { street: raw, extras: {} };
}

function buildAddress(street: string, extras: VendorExtras): string {
  return JSON.stringify({ street, ...extras });
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Technology:  { bg:'bg-cyan-50 dark:bg-cyan-950/30',    text:'text-cyan-700 dark:text-cyan-400',    dot:'bg-cyan-500' },
  Consulting:  { bg:'bg-indigo-50 dark:bg-indigo-950/30',text:'text-indigo-700 dark:text-indigo-400', dot:'bg-indigo-500' },
  Supplies:    { bg:'bg-amber-50 dark:bg-amber-950/30',   text:'text-amber-700 dark:text-amber-400',  dot:'bg-amber-500' },
  Services:    { bg:'bg-emerald-50 dark:bg-emerald-950/30',text:'text-emerald-700 dark:text-emerald-400',dot:'bg-emerald-500' },
  General:     { bg:'bg-slate-100 dark:bg-slate-800/30',  text:'text-slate-600 dark:text-slate-400',  dot:'bg-slate-400' },
  Other:       { bg:'bg-slate-100 dark:bg-slate-800/30',  text:'text-slate-600 dark:text-slate-400',  dot:'bg-slate-400' },
};
function catStyle(cat: string) { return CATEGORY_STYLE[cat] || CATEGORY_STYLE.Other; }

/* ── Empty form state ── */
function emptyForm() {
  return {
    name: '', email: '', phone: '', category: 'General',
    street: '', city: '', state: '', pincode: '',
    gstin: '', pan: '', website: '', contactPerson: '',
    bankName: '', accountNo: '', ifsc: '', paymentTerms: 'Net 30', notes: '',
  };
}

type FormState = ReturnType<typeof emptyForm>;

/* ── Full Vendor Form Modal ── */
function VendorFormModal({
  title, gradientClass, icon: Icon,
  onClose, onSubmit, submitting, initialValues,
}: {
  title: string; gradientClass: string; icon: React.ElementType;
  onClose: () => void; onSubmit: (f: FormState) => void;
  submitting: boolean; initialValues?: Partial<FormState>;
}) {
  const [form, setForm] = useState<FormState>({ ...emptyForm(), ...initialValues });
  const [section, setSection] = useState<'basic' | 'address' | 'tax' | 'bank'>('basic');

  const sf = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const sections = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'address', label: 'Address' },
    { key: 'tax', label: 'Tax & Legal' },
    { key: 'bank', label: 'Bank & Terms' },
  ] as const;

  const inp = 'w-full p-2.5 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] focus:outline-none focus:border-violet-500 text-xs bg-[var(--card)] transition';
  const lbl = 'block font-bold uppercase tracking-wider text-[10px] text-[var(--muted-foreground)] mb-1';

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{scale:0.93,y:20}} animate={{scale:1,y:0}} exit={{scale:0.93,y:20}}
        onClick={e=>e.stopPropagation()}
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`p-5 border-b border-[var(--border)] bg-gradient-to-r ${gradientClass} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-white/70 text-xs mt-0.5">Fill in vendor details across all sections</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white transition"><X className="w-4 h-4" /></button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-[var(--border)] shrink-0 bg-[var(--card)]">
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${section === s.key ? 'border-violet-500 text-violet-600 dark:text-violet-400' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* BASIC INFO */}
          {section === 'basic' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={lbl}>Vendor / Company Name *</label>
                  <input value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="Acme Pvt Ltd" required className={inp} />
                </div>
                <div>
                  <label className={lbl}>Email Address</label>
                  <input type="email" value={form.email} onChange={e=>sf('email',e.target.value)} placeholder="contact@vendor.com" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Phone Number</label>
                  <input value={form.phone} onChange={e=>sf('phone',e.target.value)} placeholder="+91 98765 43210" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Contact Person</label>
                  <input value={form.contactPerson} onChange={e=>sf('contactPerson',e.target.value)} placeholder="Rahul Sharma" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Website</label>
                  <input value={form.website} onChange={e=>sf('website',e.target.value)} placeholder="https://vendor.com" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select value={form.category} onChange={e=>sf('category',e.target.value)} className={inp}>
                    <option value="General">General</option>
                    <option value="Technology">Technology</option>
                    <option value="Services">Services</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Notes / Description</label>
                  <textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} rows={2} placeholder="Additional details about this vendor…" className={`${inp} resize-none`} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setSection('address')} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition">
                  Next: Address <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                </button>
              </div>
            </>
          )}

          {/* ADDRESS */}
          {section === 'address' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={lbl}>Street Address</label>
                  <textarea value={form.street} onChange={e=>sf('street',e.target.value)} rows={2} placeholder="Plot No. 12, Industrial Area, Phase 2…" className={`${inp} resize-none`} />
                </div>
                <div>
                  <label className={lbl}>City</label>
                  <input value={form.city} onChange={e=>sf('city',e.target.value)} placeholder="Mumbai" className={inp} />
                </div>
                <div>
                  <label className={lbl}>State</label>
                  <input value={form.state} onChange={e=>sf('state',e.target.value)} placeholder="Maharashtra" className={inp} />
                </div>
                <div>
                  <label className={lbl}>PIN Code</label>
                  <input value={form.pincode} onChange={e=>sf('pincode',e.target.value)} placeholder="400001" maxLength={6} className={inp} />
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setSection('basic')} className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] text-xs font-bold rounded-xl hover:bg-[var(--accent)] transition">
                  Back
                </button>
                <button type="button" onClick={() => setSection('tax')} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition">
                  Next: Tax Info <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                </button>
              </div>
            </>
          )}

          {/* TAX & LEGAL */}
          {section === 'tax' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>GSTIN</label>
                  <input value={form.gstin} onChange={e=>sf('gstin',e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} className={`${inp} font-mono`} />
                  <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">15-digit GST Identification Number</p>
                </div>
                <div>
                  <label className={lbl}>PAN Number</label>
                  <input value={form.pan} onChange={e=>sf('pan',e.target.value.toUpperCase())} placeholder="AAAAA0000A" maxLength={10} className={`${inp} font-mono`} />
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setSection('address')} className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] text-xs font-bold rounded-xl hover:bg-[var(--accent)] transition">
                  Back
                </button>
                <button type="button" onClick={() => setSection('bank')} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition">
                  Next: Bank & Terms <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                </button>
              </div>
            </>
          )}

          {/* BANK & TERMS */}
          {section === 'bank' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Bank Name</label>
                  <input value={form.bankName} onChange={e=>sf('bankName',e.target.value)} placeholder="HDFC Bank" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Account Number</label>
                  <input value={form.accountNo} onChange={e=>sf('accountNo',e.target.value)} placeholder="00001234567890" className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>IFSC Code</label>
                  <input value={form.ifsc} onChange={e=>sf('ifsc',e.target.value.toUpperCase())} placeholder="HDFC0001234" maxLength={11} className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>Payment Terms</label>
                  <select value={form.paymentTerms} onChange={e=>sf('paymentTerms',e.target.value)} className={inp}>
                    <option value="Immediate">Immediate</option>
                    <option value="Net 7">Net 7 days</option>
                    <option value="Net 15">Net 15 days</option>
                    <option value="Net 30">Net 30 days</option>
                    <option value="Net 45">Net 45 days</option>
                    <option value="Net 60">Net 60 days</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setSection('tax')} className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] text-xs font-bold rounded-xl hover:bg-[var(--accent)] transition">
                  Back
                </button>
                <button type="button" disabled={!form.name || submitting}
                  onClick={() => onSubmit(form)}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/20 transition disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" />
                  {submitting ? 'Saving…' : 'Save Vendor'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-3 border-t border-[var(--border)] shrink-0">
          {sections.map(s => (
            <div key={s.key} className={`h-1.5 rounded-full transition-all duration-300 ${section === s.key ? 'w-6 bg-violet-500' : 'w-1.5 bg-[var(--border)]'}`} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
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
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markSubmitting, setMarkSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'add') setShowCreateModal(true);
  }, [action]);

  async function loadVendors() {
    try {
      setLoading(true); setError('');
      const res = await financeGetVendors({ status: statusFilter || undefined, category: categoryFilter || undefined, search: searchQuery || undefined, page, limit: 20 });
      setVendors(res.vendors);
      setTotal(res.total);
    } catch { setError('Failed to load vendors.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadVendors(); }, [statusFilter, categoryFilter, page]);

  async function handleCreate(f: FormState) {
    try {
      setSubmitting(true);
      const addressStr = buildAddress(f.street, { city:f.city, state:f.state, pincode:f.pincode, gstin:f.gstin, pan:f.pan, website:f.website, contactPerson:f.contactPerson, bankName:f.bankName, accountNo:f.accountNo, ifsc:f.ifsc, paymentTerms:f.paymentTerms, notes:f.notes });
      await financeCreateVendor({ name:f.name, email:f.email||undefined, phone:f.phone||undefined, address:addressStr, category:f.category });
      setShowCreateModal(false);
      setSuccessMsg(`Vendor "${f.name}" added successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadVendors();
    } catch { console.error('Failed to create vendor'); }
    finally { setSubmitting(false); }
  }

  async function handleMarkAsVendor(f: FormState) {
    try {
      setMarkSubmitting(true);
      const addressStr = buildAddress(f.street, { city:f.city, state:f.state, pincode:f.pincode, gstin:f.gstin, pan:f.pan, website:f.website, contactPerson:f.contactPerson, bankName:f.bankName, accountNo:f.accountNo, ifsc:f.ifsc, paymentTerms:f.paymentTerms, notes:f.notes });
      await financeCreateVendor({ name:f.name, email:f.email||undefined, phone:f.phone||undefined, address:addressStr, category:f.category });
      setShowMarkModal(false);
      setSuccessMsg(`"${f.name}" marked as vendor successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadVendors();
    } catch { console.error('Failed to mark as vendor'); }
    finally { setMarkSubmitting(false); }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    try {
      await financeUpdateVendor(id, { status: currentStatus === 'Active' ? 'Inactive' : 'Active' });
      loadVendors();
    } catch { console.error('Failed to update vendor'); }
  }

  /* ── Export as CSV ── */
  function exportCSV() {
    const headers = ['Name','Email','Phone','Category','Status','GSTIN','PAN','City','State','Pincode','Website','Bank','IFSC','Payment Terms','Added'];
    const rows = vendors.map(v => {
      const { street, extras } = parseAddress(v.address);
      return [v.name, v.email||'', v.phone||'', v.category, v.status, extras.gstin||'', extras.pan||'', extras.city||'', extras.state||'', extras.pincode||'', extras.website||'', extras.bankName||'', extras.ifsc||'', extras.paymentTerms||'', new Date(v.created_at).toLocaleDateString()];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vendors.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 sm:p-8">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-7 h-7" /> Vendor Directory
            </h1>
            <p className="text-white/70 mt-1 text-sm">{total} vendor{total!==1?'s':''} · suppliers, partners & client-vendors</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-xl font-bold text-xs transition backdrop-blur-sm">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={() => setShowMarkModal(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-xl font-bold text-xs transition backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 text-yellow-300" /> Mark as Vendor
            </button>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-xl font-bold text-xs transition shadow-lg">
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── SUCCESS TOAST ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTERS ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
            <input type="text" placeholder="Search vendors by name…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && loadVendors()}
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-violet-500 bg-[var(--card)] text-[var(--foreground)] transition" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-[var(--muted-foreground)]"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] focus:outline-none bg-[var(--card)] focus:border-violet-500 transition">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] focus:outline-none bg-[var(--card)] focus:border-violet-500 transition">
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Services">Services</option>
            <option value="Supplies">Supplies</option>
            <option value="Consulting">Consulting</option>
            <option value="General">General</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={loadVendors} className="p-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] text-[var(--muted-foreground)] transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── VENDOR GRID ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-900" />
              <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
            <button onClick={loadVendors} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold">Retry</button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-950/30 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--foreground)]">No vendors found</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Add your first vendor or adjust filters</p>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg shadow-violet-500/20">
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vendors.map((v, i) => {
              const cs = catStyle(v.category);
              const { street, extras } = parseAddress(v.address);
              const isExpanded = expandedId === v.id;
              const fullAddress = [street, extras.city, extras.state, extras.pincode].filter(Boolean).join(', ');

              return (
                <motion.div key={v.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  className="group bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700/50 transition-all duration-200 overflow-hidden">

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-violet-500/20 group-hover:scale-110 transition-transform duration-200">
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--foreground)]">{v.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${cs.bg} ${cs.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />{v.category}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${v.status==='Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${v.status==='Active'?'bg-emerald-500':'bg-slate-400'}`} />{v.status}
                      </span>
                    </div>

                    {/* Basic contacts */}
                    <div className="mt-4 space-y-1.5 text-xs text-[var(--muted-foreground)]">
                      {v.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{v.email}</span></div>}
                      {v.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{v.phone}</span></div>}
                      {extras.contactPerson && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 shrink-0" /><span>{extras.contactPerson}</span></div>}
                      {fullAddress && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{fullAddress}</span></div>}
                      {extras.website && <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 shrink-0" /><a href={extras.website} target="_blank" rel="noopener noreferrer" className="truncate text-violet-500 hover:underline">{extras.website}</a></div>}
                    </div>

                    {/* Expandable details */}
                    {(extras.gstin || extras.pan || extras.bankName) && (
                      <button onClick={() => setExpandedId(isExpanded ? null : v.id)}
                        className="mt-3 flex items-center gap-1 text-[10px] font-bold text-violet-500 hover:text-violet-600 transition">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'Hide details' : 'Show GST & Bank details'}
                      </button>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                          <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
                            {extras.gstin && <div><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">GSTIN</p><p className="font-mono font-semibold text-[var(--foreground)]">{extras.gstin}</p></div>}
                            {extras.pan && <div><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">PAN</p><p className="font-mono font-semibold text-[var(--foreground)]">{extras.pan}</p></div>}
                            {extras.bankName && <div><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">Bank</p><p className="font-semibold text-[var(--foreground)]">{extras.bankName}</p></div>}
                            {extras.ifsc && <div><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">IFSC</p><p className="font-mono font-semibold text-[var(--foreground)]">{extras.ifsc}</p></div>}
                            {extras.paymentTerms && <div><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">Payment Terms</p><p className="font-semibold text-[var(--foreground)]">{extras.paymentTerms}</p></div>}
                            {extras.notes && <div className="col-span-2"><p className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase">Notes</p><p className="text-[var(--foreground)]">{extras.notes}</p></div>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--accent)]/30 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                      Added {new Date(v.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                    <button onClick={() => handleToggleStatus(v.id, v.status)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${v.status==='Active' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100'}`}>
                      {v.status==='Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── PAGINATION ── */}
      {!loading && vendors.length > 0 && (
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {vendors.length} of {total} vendors</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50 transition">Previous</button>
            <button onClick={() => setPage(p=>p+1)} disabled={vendors.length<20} className="px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50 transition">Next</button>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showCreateModal && (
          <VendorFormModal
            title="Add New Vendor" gradientClass="from-violet-600 to-indigo-600" icon={Building2}
            onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} submitting={submitting}
          />
        )}
        {showMarkModal && (
          <VendorFormModal
            title="Mark Company as Vendor" gradientClass="from-amber-500 to-yellow-500" icon={Star}
            onClose={() => setShowMarkModal(false)} onSubmit={handleMarkAsVendor} submitting={markSubmitting}
            initialValues={{ category:'General' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-900" />
          <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
        </div>
      </div>
    }>
      <VendorsContent />
    </Suspense>
  );
}
