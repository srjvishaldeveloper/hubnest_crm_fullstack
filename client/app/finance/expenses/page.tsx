'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  financeGetExpenses, financeCreateExpense, financeUpdateExpense,
  financeDeleteExpense, financeGetVendors
} from '../../../services/financeService';
import {
  Receipt, Search, Plus, RefreshCw, X, CheckCircle2, XCircle,
  AlertCircle, Trash2, Pencil, TrendingDown, Clock, Tag,
  IndianRupee, Building2, Filter, ArrowUpDown, Download
} from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendor_id: string | null;
  vendor_name: string | null;
  approved_by: string | null;
  approver_name: string | null;
  status: string;
  expense_date: string;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string | null;
}

const CATEGORIES = ['Salaries','Rent','Utilities','Marketing','Travel','Software','Hardware','General','Maintenance','Office Supplies','Other'];

function fmtINR(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusColor(s: string) {
  return ({ Approved:'bg-emerald-100 text-emerald-700', Rejected:'bg-red-100 text-red-700', Reimbursed:'bg-blue-100 text-blue-700', Pending:'bg-amber-100 text-amber-700' }[s] || 'bg-amber-100 text-amber-700');
}

function categoryColor(c: string) {
  const map: Record<string,string> = { Salaries:'bg-blue-50 text-blue-700', Rent:'bg-violet-50 text-violet-700', Marketing:'bg-pink-50 text-pink-700', Software:'bg-cyan-50 text-cyan-700', Travel:'bg-indigo-50 text-indigo-700', Hardware:'bg-orange-50 text-orange-700', Utilities:'bg-teal-50 text-teal-700' };
  return map[c] || 'bg-slate-50 text-slate-700';
}

// ─── EXPENSE FORM MODAL ────────────────────────────────────────────────────────

function ExpenseModal({ initial, editId, vendors, onClose, onSaved }: {
  initial?: Partial<Expense>;
  editId?: string;
  vendors: Vendor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [category, setCategory]     = useState(initial?.category || 'General');
  const [description, setDescription] = useState(initial?.description || '');
  const [amount, setAmount]         = useState(initial?.amount ? String(initial.amount) : '');
  const [vendorId, setVendorId]     = useState(initial?.vendor_id || '');
  const [expDate, setExpDate]       = useState(initial?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [submitting, setSub]        = useState(false);
  const isEdit = !!editId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;
    try {
      setSub(true);
      const payload = { category, description, amount: parseFloat(amount), vendor_id: vendorId || undefined, expense_date: expDate };
      if (isEdit) await financeUpdateExpense(editId!, payload);
      else        await financeCreateExpense(payload);
      onSaved();
    } catch { /* handled */ } finally { setSub(false); }
  }

  const inp = 'w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--foreground)] focus:outline-none focus:border-rose-500 bg-[var(--card)] transition';
  const lbl = 'text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white"/>
            </div>
            <h3 className="text-sm font-black text-[var(--foreground)]">{isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--accent)] rounded-xl text-[var(--muted-foreground)] transition"><X className="w-4 h-4"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={lbl}>Description *</label>
            <textarea required rows={2} value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="What was this expense for?" className={inp+' resize-none'}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} className={inp}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Amount (₹) *</label>
              <input type="number" required min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className={inp}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Vendor</label>
              <select value={vendorId} onChange={e=>setVendorId(e.target.value)} className={inp}>
                <option value="">— No vendor —</option>
                {vendors.map(v=><option key={v.id} value={v.id}>{v.name}{v.category?` (${v.category})`:''}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Expense Date</label>
              <input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} className={inp}/>
            </div>
          </div>
          <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)] transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow transition disabled:opacity-60">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin inline mr-1"/> : null}
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── EXPENSES PAGE ─────────────────────────────────────────────────────────────

function ExpensesContent() {
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [vendors, setVendors]         = useState<Vendor[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]               = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  // Aggregated stats across all pages (not just current page)
  const [kpiStats, setKpiStats] = useState({ totalAmount: 0, pendingAmount: 0, approvedCount: 0, rejectedCount: 0 });
  const searchParams = useSearchParams();

  useEffect(() => { if (searchParams.get('action')==='add') setShowModal(true); }, [searchParams]);

  useEffect(() => {
    financeGetVendors({ limit: 200 }).then(r => setVendors(r.vendors || [])).catch(()=>{});
  }, []);

  // Load aggregated KPI stats from all statuses
  const loadStats = useCallback(async () => {
    try {
      const [allRes, pendRes, appRes, rejRes] = await Promise.all([
        financeGetExpenses({ limit: 1 }),
        financeGetExpenses({ status: 'Pending', limit: 500 }),
        financeGetExpenses({ status: 'Approved', limit: 500 }),
        financeGetExpenses({ status: 'Rejected', limit: 500 }),
      ]);
      const pendingAmount  = (pendRes.expenses || []).reduce((s: number, e: Expense) => s + parseFloat(String(e.amount)), 0);
      const totalAmount    = pendingAmount +
        (appRes.expenses || []).reduce((s: number, e: Expense) => s + parseFloat(String(e.amount)), 0) +
        (rejRes.expenses || []).reduce((s: number, e: Expense) => s + parseFloat(String(e.amount)), 0);
      setKpiStats({
        totalAmount,
        pendingAmount,
        approvedCount: appRes.total || 0,
        rejectedCount: rejRes.total || 0,
      });
    } catch { /* keep last stats */ }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await financeGetExpenses({ status:statusFilter||undefined, category:categoryFilter||undefined, search:searchQuery||undefined, page, limit:20 });
      setExpenses(res.expenses); setTotal(res.total);
    } catch { setError('Failed to load expenses.'); }
    finally { setLoading(false); }
  }, [statusFilter, categoryFilter, searchQuery, page]);

  useEffect(() => { load(); loadStats(); }, [load, loadStats]);

  async function handleStatusUpdate(id: string, newStatus: string) {
    try { await financeUpdateExpense(id, { status: newStatus }); load(); loadStats(); } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      setDeletingId(id);
      await financeDeleteExpense(id);
      load(); loadStats();
    } catch { alert('Failed to delete expense.'); }
    finally { setDeletingId(null); }
  }

  const { totalAmount, pendingAmount, approvedCount, rejectedCount } = kpiStats;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Expenses <span className="ml-2 text-sm font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{total}</span></h1>
          <p className="text-xs text-[var(--muted-foreground)]">Track, approve and manage company expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500 w-44 bg-[var(--card)] text-[var(--foreground)]"/>
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)]">
            <option value="">All Statuses</option>
            {['Pending','Approved','Rejected','Reimbursed'].map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)]">
            <option value="">All Categories</option>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
          <button className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">
            <Filter className="w-4 h-4"/> Filter
          </button>
          <button className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">
            <ArrowUpDown className="w-4 h-4"/> Sort
          </button>
          <button onClick={() => {
              const headers = ['Description','Category','Amount','Vendor','Date','Status'];
              const rows = expenses.map(e => [e.description,e.category,e.amount,e.vendor_name||'',new Date(e.expense_date).toLocaleDateString('en-IN'),e.status]);
              const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
              const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='expenses.csv';a.click();
            }}
            className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">
            <Download className="w-4 h-4"/> Export
          </button>
          <button onClick={()=>{ setEditExpense(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition active:scale-95">
            <Plus className="w-3.5 h-3.5"/> Add Expense
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Expenses',  val:fmtINR(totalAmount),   icon:TrendingDown,  color:'text-rose-600',    bg:'bg-rose-50'    },
          { label:'Pending Approval',val:fmtINR(pendingAmount), icon:Clock,         color:'text-amber-600',   bg:'bg-amber-50'   },
          { label:'Approved',        val:approvedCount,          icon:CheckCircle2,  color:'text-emerald-600', bg:'bg-emerald-50' },
          { label:'Rejected',        val:rejectedCount,          icon:XCircle,       color:'text-red-600',     bg:'bg-red-50'     },
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
                {['Description','Category','Amount','Vendor','Date','Status','Actions'].map((h,i)=>(
                  <th key={i} className={`p-4 font-semibold ${h==='Amount'?'text-right':h==='Actions'?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-rose-500 animate-spin mx-auto"/>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading expenses...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto"/><p className="text-xs text-red-500 mt-2">{error}</p>
                </td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-2"/>
                  <p className="text-xs text-[var(--muted-foreground)] font-semibold">No expenses found.</p>
                  <button onClick={()=>setShowModal(true)} className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 underline">Add first expense</button>
                </td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-[var(--accent)] transition">
                  <td className="p-4">
                    <p className="font-bold text-[var(--foreground)] truncate max-w-[220px]">{exp.description}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${categoryColor(exp.category)}`}>
                      <Tag className="w-2.5 h-2.5"/> {exp.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-extrabold text-rose-600">{fmtINR(parseFloat(String(exp.amount)))}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">
                    {exp.vendor_name ? (
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400"/>{exp.vendor_name}</span>
                    ) : '—'}
                  </td>
                  <td className="p-4 text-[var(--muted-foreground)]">{new Date(exp.expense_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(exp.status)}`}>{exp.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit always visible */}
                      <button onClick={()=>{ setEditExpense(exp); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition" title="Edit">
                        <Pencil className="w-4 h-4"/>
                      </button>
                      {/* Approve/Reject only for Pending */}
                      {exp.status === 'Pending' && (
                        <>
                          <button onClick={()=>handleStatusUpdate(exp.id,'Approved')} title="Approve"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition"><CheckCircle2 className="w-4 h-4"/></button>
                          <button onClick={()=>handleStatusUpdate(exp.id,'Rejected')} title="Reject"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><XCircle className="w-4 h-4"/></button>
                        </>
                      )}
                      {/* Mark Reimbursed if Approved */}
                      {exp.status === 'Approved' && (
                        <button onClick={()=>handleStatusUpdate(exp.id,'Reimbursed')} title="Mark Reimbursed"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition text-[9px] font-bold px-2">
                          Reimburse
                        </button>
                      )}
                      {/* Delete */}
                      <button onClick={()=>handleDelete(exp.id)} disabled={deletingId===exp.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition disabled:opacity-40" title="Delete">
                        {deletingId===exp.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {expenses.length} of {total} expenses</span>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={expenses.length<20} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ExpenseModal
            key={editExpense?.id || 'new'}
            editId={editExpense?.id}
            initial={editExpense || undefined}
            vendors={vendors}
            onClose={()=>{ setShowModal(false); setEditExpense(null); }}
            onSaved={()=>{ setShowModal(false); setEditExpense(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"/></div>}>
      <ExpensesContent/>
    </Suspense>
  );
}
