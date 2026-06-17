'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  financeGetPayments, financeCreatePayment, financeDeletePayment,
  financeGetInvoices
} from '../../../services/financeService';
import {
  CreditCard, Search, Plus, RefreshCw, X, IndianRupee,
  Banknote, Smartphone, Building2, AlertCircle, Trash2,
  TrendingUp, Clock, CheckCircle2, ArrowDownCircle, Receipt
} from 'lucide-react';

interface Payment {
  id: string;
  invoice_id: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  amount: number;
  method: string;
  reference: string | null;
  status: string;
  paid_at: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: string;
}

const METHODS = ['Bank Transfer','UPI','Credit Card','Debit Card','Cash','Cheque','NEFT','RTGS','IMPS','Other'];

function fmtINR(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function methodIcon(m: string) {
  if (m === 'Credit Card' || m === 'Debit Card') return <CreditCard className="w-3.5 h-3.5" />;
  if (m === 'UPI') return <Smartphone className="w-3.5 h-3.5" />;
  if (m === 'Cash') return <Banknote className="w-3.5 h-3.5" />;
  return <Building2 className="w-3.5 h-3.5" />;
}

// ─── RECORD PAYMENT MODAL ──────────────────────────────────────────────────────

function RecordPaymentModal({ invoices, onClose, onSaved }: {
  invoices: Invoice[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [amount, setAmount]       = useState('');
  const [method, setMethod]       = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [status, setStatus]       = useState('Completed');
  const [paidAt, setPaidAt]       = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSub]      = useState(false);

  // Auto-fill amount from invoice
  useEffect(() => {
    if (selectedInvoice) {
      const inv = invoices.find(i => i.id === selectedInvoice);
      if (inv) setAmount(String(parseFloat(String(inv.total))));
    }
  }, [selectedInvoice, invoices]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    try {
      setSub(true);
      await financeCreatePayment({
        invoice_id:  selectedInvoice || undefined,
        amount:      parseFloat(amount),
        method,
        reference:   reference || undefined,
        status,
        paid_at:     paidAt,
      });
      onSaved();
    } catch { /* handled by interceptor */ } finally { setSub(false); }
  }

  const inp = 'w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--foreground)] focus:outline-none focus:border-blue-500 bg-[var(--card)] transition';
  const lbl = 'text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1';
  const selInv = invoices.find(i => i.id === selectedInvoice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-white"/>
            </div>
            <h3 className="text-sm font-black text-[var(--foreground)]">Record Payment</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--accent)] rounded-xl text-[var(--muted-foreground)] transition"><X className="w-4 h-4"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Link to Invoice */}
          <div>
            <label className={lbl}>Link to Invoice (Optional)</label>
            <select value={selectedInvoice} onChange={e=>setSelectedInvoice(e.target.value)} className={inp}>
              <option value="">— No invoice (direct payment) —</option>
              {invoices.filter(i=>i.status!=='Paid').map(i=>(
                <option key={i.id} value={i.id}>
                  {i.invoice_number} — {i.customer_name} — {fmtINR(parseFloat(String(i.total)))}
                </option>
              ))}
            </select>
            {selInv && (
              <div className="mt-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30 text-[10px] text-blue-700 dark:text-blue-400">
                <span className="font-bold">{selInv.invoice_number}</span> · {selInv.customer_name} · {fmtINR(parseFloat(String(selInv.total)))} · <span className="uppercase font-bold">{selInv.status}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Amount (₹) *</label>
              <input type="number" required step="0.01" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Payment Date</label>
              <input type="date" value={paidAt} onChange={e=>setPaidAt(e.target.value)} className={inp}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Payment Method</label>
              <select value={method} onChange={e=>setMethod(e.target.value)} className={inp}>
                {METHODS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className={inp}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Reference / UTR / Cheque No.</label>
            <input type="text" value={reference} onChange={e=>setReference(e.target.value)} placeholder="e.g. NEFT2024001, UTR123..." className={inp}/>
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)] transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow transition disabled:opacity-60">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin inline"/> : null}
              {submitting ? ' Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── PAYMENTS PAGE ─────────────────────────────────────────────────────────────

function PaymentsContent() {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]               = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => { if (searchParams.get('action')==='add') setShowModal(true); }, [searchParams]);

  useEffect(() => {
    financeGetInvoices({ limit: 100 }).then(r => setInvoices(r.invoices || [])).catch(()=>{});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await financeGetPayments({ status:statusFilter||undefined, method:methodFilter||undefined, search:searchQuery||undefined, page, limit:20 });
      setPayments(res.payments); setTotal(res.total);
    } catch { setError('Failed to load payments.'); }
    finally { setLoading(false); }
  }, [statusFilter, methodFilter, searchQuery, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this payment record?')) return;
    try {
      setDeletingId(id);
      await financeDeletePayment(id);
      load();
    } catch { alert('Failed to delete payment.'); }
    finally { setDeletingId(null); }
  }

  const statusColor = (s: string) => ({
    Completed: 'bg-emerald-100 text-emerald-700',
    Failed:    'bg-red-100 text-red-700',
    Refunded:  'bg-violet-100 text-violet-700',
    Pending:   'bg-amber-100 text-amber-700',
  }[s] || 'bg-amber-100 text-amber-700');

  // Stats
  const totalReceived = payments.filter(p=>p.status==='Completed').reduce((s,p)=>s+parseFloat(String(p.amount)),0);
  const totalPending  = payments.filter(p=>p.status==='Pending').reduce((s,p)=>s+parseFloat(String(p.amount)),0);
  const completedCount = payments.filter(p=>p.status==='Completed').length;
  const failedCount    = payments.filter(p=>p.status==='Failed').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Payments</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Track incoming payments, link to invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 w-44 bg-[var(--card)] text-[var(--foreground)]"/>
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)]">
            <option value="">All Statuses</option>
            {['Pending','Completed','Failed','Refunded'].map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)]">
            <option value="">All Methods</option>
            {METHODS.map(m=><option key={m}>{m}</option>)}
          </select>
          <button onClick={()=>setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition active:scale-95">
            <Plus className="w-3.5 h-3.5"/> Record Payment
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Received', val:fmtINR(totalReceived), icon:TrendingUp,     color:'text-emerald-600', bg:'bg-emerald-50' },
          { label:'Pending',        val:fmtINR(totalPending),  icon:Clock,          color:'text-amber-600',   bg:'bg-amber-50'   },
          { label:'Completed',      val:completedCount,         icon:CheckCircle2,   color:'text-blue-600',    bg:'bg-blue-50'    },
          { label:'Failed',         val:failedCount,            icon:AlertCircle,    color:'text-red-600',     bg:'bg-red-50'     },
        ].map((s,i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`}/>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-base font-extrabold text-[var(--foreground)] mt-0.5">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.05}}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)]">
                {['Ref. ID','Invoice','Amount','Method','Reference','Paid On','Status',''].map((h,i)=>(
                  <th key={i} className={`p-4 font-semibold ${h==='Amount'?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto"/>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading payments...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto"/><p className="text-xs text-red-500 mt-2">{error}</p>
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <ArrowDownCircle className="w-10 h-10 text-slate-200 mx-auto mb-2"/>
                  <p className="text-xs text-[var(--muted-foreground)] font-semibold">No payments recorded yet.</p>
                  <button onClick={()=>setShowModal(true)} className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-800 underline">Record first payment</button>
                </td></tr>
              ) : payments.map(pay => (
                <tr key={pay.id} className="hover:bg-[var(--accent)] transition">
                  <td className="p-4 font-bold text-slate-500 font-mono text-[10px]">#{pay.id.slice(0,8).toUpperCase()}</td>
                  <td className="p-4">
                    {pay.invoice_number ? (
                      <div>
                        <p className="font-bold text-amber-600">{pay.invoice_number}</p>
                        {pay.customer_name && <p className="text-[10px] text-[var(--muted-foreground)]">{pay.customer_name}</p>}
                      </div>
                    ) : (
                      <span className="text-[var(--muted-foreground)] italic">Direct</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-extrabold text-emerald-600 text-sm">{fmtINR(parseFloat(String(pay.amount)))}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)] font-semibold">
                      {methodIcon(pay.method)} {pay.method}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--muted-foreground)] font-mono text-[10px]">{pay.reference || '—'}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">{new Date(pay.paid_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(pay.status)}`}>{pay.status}</span>
                  </td>
                  <td className="p-4">
                    <button onClick={()=>handleDelete(pay.id)} disabled={deletingId===pay.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition disabled:opacity-40" title="Delete">
                      {deletingId===pay.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {payments.length} of {total} payments</span>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={payments.length<20} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RecordPaymentModal
            invoices={invoices}
            onClose={()=>setShowModal(false)}
            onSaved={()=>{ setShowModal(false); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"/></div>}>
      <PaymentsContent/>
    </Suspense>
  );
}
