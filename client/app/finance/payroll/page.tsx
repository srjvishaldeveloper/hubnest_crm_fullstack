'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, IndianRupee, Clock, ShieldCheck, Sparkles, Search,
  Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, Download,
  Play, FileText, FileSpreadsheet, Gift, ChevronRight, Check,
  TrendingUp, TrendingDown, Building2, Wallet,
  CircleDollarSign, Landmark, CalendarDays, Loader2, Ban,
  CreditCard, Smartphone, Banknote, QrCode, PiggyBank, Upload,
  RefreshCw, AlertCircle, CheckCircle2, Send, FileDown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import {
  financeGetPayrollDashboard,
  financeGetPayroll
} from '@/services/financeService';

/* ─────────────── CHART COLORS ─────────────── */
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const DEPT_COLORS: Record<string, string> = {
  Engineering: '#6366f1',
  Marketing:   '#f59e0b',
  Sales:       '#10b981',
  Finance:     '#06b6d4',
  HR:          '#ec4899',
};

/* ─────────────── TYPES ─────────────── */
interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  basicSalary: number;
  hra: number;
  bonuses: number;
  pf: number;
  tds: number;
  esi: number;
  professionalTax: number;
  loanDeduction: number;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  status: 'Paid' | 'Pending' | 'On Hold';
  bankAccount: string;
  panNumber: string;
  joiningDate: string;
}

interface DashboardKPIs {
  totalEmployeesPaid: number;
  totalPayrollCost: number;
  pendingPayroll: number;
  totalDeductions: number;
}

interface MonthlyTrend {
  month: string;
  payroll: number;
  deductions: number;
}

/* ─────────────── STATIC FALLBACK DATA ─────────────── */
const FALLBACK_EMPLOYEES: Employee[] = [
  { id:'e1', name:'Arjun Mehta',   employeeId:'EMP001', department:'Engineering', designation:'Senior Developer',  basicSalary:85000, hra:34000, bonuses:5000,  pf:10200, tds:8500, esi:0,    professionalTax:200, loanDeduction:0,    grossSalary:124000, totalDeductions:18900, netSalary:105100, status:'Paid',    bankAccount:'HDFC xxxx4521', panNumber:'ARJPM1234A', joiningDate:'2022-01-15' },
  { id:'e2', name:'Priya Sharma',  employeeId:'EMP002', department:'Marketing',   designation:'Campaign Manager',  basicSalary:65000, hra:26000, bonuses:4000,  pf:7800,  tds:6500, esi:1950, professionalTax:200, loanDeduction:5000, grossSalary:95000,  totalDeductions:21450, netSalary:73550,  status:'Paid',    bankAccount:'ICICI xxxx7832', panNumber:'PRISM5678B', joiningDate:'2021-06-01' },
  { id:'e3', name:'Rahul Verma',   employeeId:'EMP003', department:'Sales',       designation:'Sales Executive',   basicSalary:45000, hra:18000, bonuses:8000,  pf:5400,  tds:4500, esi:1350, professionalTax:200, loanDeduction:0,    grossSalary:71000,  totalDeductions:11450, netSalary:59550,  status:'Pending', bankAccount:'SBI xxxx1234',  panNumber:'RAHVM2345C', joiningDate:'2023-03-10' },
  { id:'e4', name:'Sneha Patil',   employeeId:'EMP004', department:'Finance',     designation:'Finance Analyst',   basicSalary:72000, hra:28800, bonuses:3000,  pf:8640,  tds:7200, esi:0,    professionalTax:200, loanDeduction:0,    grossSalary:103800, totalDeductions:16040, netSalary:87760,  status:'Paid',    bankAccount:'AXIS xxxx9876',  panNumber:'SNEPA3456D', joiningDate:'2020-11-20' },
  { id:'e5', name:'Vikram Nair',   employeeId:'EMP005', department:'HR',          designation:'HR Manager',        basicSalary:58000, hra:23200, bonuses:2500,  pf:6960,  tds:5800, esi:1740, professionalTax:200, loanDeduction:3000, grossSalary:83700,  totalDeductions:17700, netSalary:66000,  status:'Paid',    bankAccount:'KOTAK xxxx3344', panNumber:'VIKNA4567E', joiningDate:'2019-08-05' },
  { id:'e6', name:'Ananya Singh',  employeeId:'EMP006', department:'Engineering', designation:'Frontend Developer', basicSalary:60000, hra:24000, bonuses:3000,  pf:7200,  tds:6000, esi:0,    professionalTax:200, loanDeduction:0,    grossSalary:87000,  totalDeductions:13400, netSalary:73600,  status:'On Hold', bankAccount:'PNB xxxx5566',   panNumber:'ANANS5678F', joiningDate:'2022-09-12' },
];

const FALLBACK_TREND: MonthlyTrend[] = [
  { month:'Jan', payroll:485000, deductions:92000 },
  { month:'Feb', payroll:492000, deductions:94000 },
  { month:'Mar', payroll:498000, deductions:95500 },
  { month:'Apr', payroll:510000, deductions:97000 },
  { month:'May', payroll:525000, deductions:99000 },
  { month:'Jun', payroll:538000, deductions:102000 },
];

const PAYMENT_METHODS = [
  { id:'bank',   label:'Bank Transfer',  icon: Banknote,   desc:'NEFT / RTGS / IMPS' },
  { id:'upi',    label:'UPI',            icon: QrCode,     desc:'GPay / PhonePe / Paytm' },
  { id:'card',   label:'Debit Card',     icon: CreditCard, desc:'Visa / Mastercard / RuPay' },
  { id:'cash',   label:'Cash',           icon: PiggyBank,  desc:'Physical cash payment' },
  { id:'cheque', label:'Cheque',         icon: FileText,   desc:'Crossed account payee cheque' },
  { id:'wallet', label:'Digital Wallet', icon: Smartphone, desc:'Paytm / MobiKwik wallet' },
];

const departments = ['All','Engineering','Marketing','Sales','Finance','HR'];
const statuses    = ['All','Paid','Pending','On Hold'];
const sortOptions = ['Name','Salary','Department'];

/* ─────────────── HELPERS ─────────────── */
function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }
function fmtC(n: number) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
}

const STATUS_COLOR: Record<string,string> = {
  Paid:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'On Hold':'bg-red-500/15 text-red-400 border-red-500/30',
};
const STATUS_ICON: Record<string,React.ReactNode> = {
  Paid:     <Check className="w-3 h-3" />,
  Pending:  <Clock className="w-3 h-3" />,
  'On Hold':<Ban className="w-3 h-3" />,
};

/* ─────────────── PAY METHOD MODAL ─────────────── */
function PayMethodModal({ employee, onClose, onPaid }: {
  employee: Employee;
  onClose: () => void;
  onPaid: (method: string, ref: string) => void;
}) {
  const [selected, setSelected] = useState('bank');
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onPaid(PAYMENT_METHODS.find(m=>m.id===selected)?.label||selected, ref);
    setLoading(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92,y:20}}
        onClick={e=>e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
          <div>
            <h3 className="text-base font-bold text-white">Mark as Paid</h3>
            <p className="text-white/70 text-xs mt-0.5">{employee.name} · {employee.employeeId} · {fmt(employee.netSalary)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Select Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={()=>setSelected(m.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  selected === m.id
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                    : 'border-[var(--border)] hover:border-indigo-300 hover:bg-[var(--accent)]'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected===m.id?'bg-indigo-500 text-white':'bg-[var(--accent)] text-[var(--muted-foreground)]'}`}>
                  <m.icon className="w-4 h-4"/>
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${selected===m.id?'text-indigo-500':''}`}>{m.label}</p>
                  <p className="text-[9px] text-[var(--muted-foreground)] truncate">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
              Reference / Transaction ID <span className="text-[var(--muted-foreground)] normal-case font-normal">(optional)</span>
            </label>
            <input type="text" value={ref} onChange={e=>setRef(e.target.value)}
              placeholder={selected==='upi'?'UPI Ref: 1234567890':selected==='cheque'?'Cheque No: 001234':'Transaction ID'}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--foreground)] bg-[var(--card)] focus:outline-none focus:border-indigo-500 transition"/>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Net Salary to be paid</span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400">{fmt(employee.netSalary)}</span>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)] transition">Cancel</button>
            <button onClick={handleConfirm} disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── ADD BONUS MODAL ─────────────── */
function AddBonusModal({ employees, onClose, onSave }: {
  employees: Employee[];
  onClose: () => void;
  onSave: (empId: string, amount: number, reason: string) => void;
}) {
  const [empId, setEmpId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!empId) { setError('Select an employee'); return; }
    if (!amt || amt <= 0) { setError('Enter a valid bonus amount'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    onSave(empId, amt, reason);
    setLoading(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.92,y:20}}
        onClick={e=>e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Gift className="w-4 h-4"/> Add Bonus</h3>
            <p className="text-white/70 text-xs mt-0.5">Assign a bonus or incentive to an employee</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"><X className="w-4 h-4"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">Employee</label>
            <select value={empId} onChange={e=>setEmpId(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] bg-[var(--card)] focus:outline-none focus:border-amber-500 transition">
              {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">Bonus Amount (₹)</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="e.g. 5000"
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] bg-[var(--card)] focus:outline-none focus:border-amber-500 transition"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">Reason <span className="font-normal normal-case">(optional)</span></label>
            <input type="text" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Performance bonus, Festival bonus..."
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-[var(--foreground)] bg-[var(--card)] focus:outline-none focus:border-amber-500 transition"/>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0"/><span>{error}</span>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-xs font-bold hover:bg-[var(--accent)] transition">Cancel</button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Gift className="w-3.5 h-3.5"/>}
              {loading ? 'Saving...' : 'Add Bonus'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>(FALLBACK_TREND);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch]       = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy]       = useState('Name');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee|null>(null);
  const [payEmployee, setPayEmployee] = useState<Employee|null>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('2026-06');
  const [workflowStep, setWorkflowStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'>('success');
  const csvRef = useRef<HTMLInputElement>(null);

  /* ── Fetch dashboard data from backend ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dash = await financeGetPayrollDashboard();
      if (dash?.employees && dash.employees.length > 0) {
        const mapped: Employee[] = dash.employees.map((e: any, idx: number) => ({
          id:              e.id || `e${idx}`,
          name:            e.name || e.employee_name || 'Unknown',
          employeeId:      e.employeeId || e.employee_id || `EMP-${idx+1}`,
          department:      e.department || 'General',
          designation:     e.designation || e.role || 'Employee',
          basicSalary:     parseFloat(e.basicSalary || e.salary || 0),
          hra:             parseFloat(e.hra || 0),
          bonuses:         parseFloat(e.bonuses || e.bonus || 0),
          pf:              parseFloat(e.pf || 0),
          tds:             parseFloat(e.tds || 0),
          esi:             parseFloat(e.esi || 0),
          professionalTax: parseFloat(e.professionalTax || 0),
          loanDeduction:   parseFloat(e.loanDeduction || 0),
          grossSalary:     parseFloat(e.grossSalary || e.salary || 0),
          totalDeductions: parseFloat(e.totalDeductions || e.deductions || 0),
          netSalary:       parseFloat(e.netSalary || e.net_pay || 0),
          status:          (['Paid','Pending','On Hold'].includes(e.status) ? e.status : 'Pending') as Employee['status'],
          bankAccount:     e.bankAccount || '—',
          panNumber:       e.panNumber || '—',
          joiningDate:     e.joiningDate || e.created_at?.slice(0,10) || '—',
        }));
        setEmployees(mapped);
      } else {
        setEmployees(FALLBACK_EMPLOYEES);
      }
      if (dash?.monthlyTrend && dash.monthlyTrend.length > 0) {
        setMonthlyTrend(dash.monthlyTrend);
      }
    } catch {
      setEmployees(FALLBACK_EMPLOYEES);
      setMonthlyTrend(FALLBACK_TREND);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Toast helper ── */
  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 4000);
  }

  /* ── Export Payroll CSV ── */
  function exportCSV() {
    const headers = ['Employee ID','Name','Department','Designation','Basic Salary','HRA','Bonuses','PF','TDS','ESI','Prof Tax','Loan Deduction','Gross Salary','Total Deductions','Net Salary','Status','Bank Account','PAN'];
    const rows = employees.map(e => [e.employeeId,e.name,e.department,e.designation,e.basicSalary,e.hra,e.bonuses,e.pf,e.tds,e.esi,e.professionalTax,e.loanDeduction,e.grossSalary,e.totalDeductions,e.netSalary,e.status,e.bankAccount,e.panNumber]);
    const csv = [headers,...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`payroll_${payrollMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Payroll report exported successfully!');
  }

  /* ── Import CSV ── */
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n').slice(1);
      showToast(`✅ Parsed ${lines.length} employee record(s) from CSV. Review below.`);
    };
    reader.readAsText(file);
    if(csvRef.current) csvRef.current.value = '';
  }

  /* ── Derived KPIs ── */
  const totalPaid       = employees.filter(e=>e.status==='Paid').reduce((s,e)=>s+e.netSalary,0);
  const totalPending    = employees.filter(e=>e.status==='Pending').reduce((s,e)=>s+e.netSalary,0);
  const totalDeductions = employees.reduce((s,e)=>s+e.totalDeductions,0);
  const paidCount       = employees.filter(e=>e.status==='Paid').length;
  const pendingCount    = employees.filter(e=>e.status==='Pending').length;
  const onHoldCount     = employees.filter(e=>e.status==='On Hold').length;

  /* ── Department breakdown ── */
  const deptData = useMemo(() => {
    const map: Record<string,{dept:string,total:number,count:number,paid:number}> = {};
    employees.forEach(e => {
      if (!map[e.department]) map[e.department] = {dept:e.department,total:0,count:0,paid:0};
      map[e.department].total += e.netSalary;
      map[e.department].count++;
      if (e.status==='Paid') map[e.department].paid++;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  }, [employees]);

  /* ── Deduction breakdown ── */
  const deductData = useMemo(() => [
    { name:'Provident Fund', value: employees.reduce((s,e)=>s+e.pf,0) },
    { name:'TDS',            value: employees.reduce((s,e)=>s+e.tds,0) },
    { name:'ESI',            value: employees.reduce((s,e)=>s+e.esi,0) },
    { name:'Prof. Tax',      value: employees.reduce((s,e)=>s+e.professionalTax,0) },
    { name:'Loan Recovery',  value: employees.reduce((s,e)=>s+e.loanDeduction,0) },
  ], [employees]);

  /* ── Filter & sort ── */
  const filtered = useMemo(() => {
    let list = [...employees];
    if (search) { const q=search.toLowerCase(); list=list.filter(e=>e.name.toLowerCase().includes(q)||e.employeeId.toLowerCase().includes(q)||e.department.toLowerCase().includes(q)); }
    if (deptFilter!=='All') list=list.filter(e=>e.department===deptFilter);
    if (statusFilter!=='All') list=list.filter(e=>e.status===statusFilter);
    list.sort((a,b)=>{
      let cmp=0;
      if (sortBy==='Name') cmp=a.name.localeCompare(b.name);
      else if (sortBy==='Salary') cmp=a.netSalary-b.netSalary;
      else if (sortBy==='Department') cmp=a.department.localeCompare(b.department);
      return sortOrder==='asc'?cmp:-cmp;
    });
    return list;
  }, [employees,search,deptFilter,statusFilter,sortBy,sortOrder]);

  /* ── Run Payroll (workflow simulation) ── */
  function runPayroll() {
    if (isRunning) return;
    setIsRunning(true); setWorkflowStep(1);
    setTimeout(()=>setWorkflowStep(2),1500);
    setTimeout(()=>setWorkflowStep(3),3000);
    setTimeout(()=>{
      setWorkflowStep(4);
      setIsRunning(false);
      showToast(`✅ Payroll for ${payrollMonth} processed! ${fmtC(totalPaid+totalPending)} disbursed.`);
    },4500);
  }

  /* ── Mark as Paid ── */
  function handlePaid(empId: string, method: string, ref: string) {
    setEmployees(prev=>prev.map(e=>e.id===empId?{...e,status:'Paid'}:e));
    setPayEmployee(null);
    const emp = employees.find(e=>e.id===empId);
    showToast(`${emp?.name} marked as Paid via ${method}${ref?` (Ref: ${ref})`:''}`);
  }

  /* ── Add Bonus ── */
  function handleAddBonus(empId: string, amount: number, reason: string) {
    setEmployees(prev=>prev.map(e=>e.id===empId?{...e, bonuses:e.bonuses+amount, netSalary:e.netSalary+amount, grossSalary:e.grossSalary+amount}:e));
    setShowBonusModal(false);
    const emp = employees.find(e=>e.id===empId);
    showToast(`Bonus of ${fmt(amount)} added to ${emp?.name}${reason?` — ${reason}`:''}`);
  }

  /* ── Generate Payslip (download PDF placeholder) ── */
  function generatePayslip(emp: Employee) {
    showToast(`Payslip for ${emp.name} (${payrollMonth}) sent to email & ready to download.`);
  }

  const workflowSteps = [{label:'Calculate',step:1},{label:'Review',step:2},{label:'Approve',step:3},{label:'Pay',step:4}];

  const kpis = [
    { label:'Employees Paid',   value:`${paidCount} / ${employees.length}`, sub:`${pendingCount} pending`,     trendUp:pendingCount===0, icon:Users,        gradient:'from-blue-600 to-cyan-500',     filterStatus:'Paid' as const },
    { label:'Total Payroll',    value:fmtC(totalPaid+totalPending),          sub:`${fmtC(totalPaid)} paid`,      trendUp:true,             icon:IndianRupee,  gradient:'from-emerald-600 to-green-500', filterStatus:'All' as const },
    { label:'Pending Payroll',  value:fmtC(totalPending),                    sub:`${pendingCount} employee${pendingCount!==1?'s':''}`, trendUp:false, icon:Clock, gradient:'from-amber-600 to-yellow-500', filterStatus:'Pending' as const },
    { label:'Total Deductions', value:fmtC(totalDeductions),                 sub:`${((totalDeductions/(totalPaid+totalPending||1))*100).toFixed(1)}% of payroll`, trendUp:false, icon:ShieldCheck, gradient:'from-purple-600 to-pink-500', filterStatus:'All' as const },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-white animate-spin"/>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm font-medium">Loading payroll data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-8 h-8"/> Payroll Management
            </h1>
            <p className="text-white/70 mt-1 text-sm">Manage employee salaries, deductions, payslips and payroll processing</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <button onClick={() => csvRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <FileDown className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"/>
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-3xl"/>
      </motion.div>

      {/* ─── TOAST ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
              toastType==='success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
            {toastType==='success' ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertCircle className="w-4 h-4 shrink-0"/>}
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi,i)=>(
          <motion.div key={kpi.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
            onClick={()=>{ setStatusFilter(kpi.filterStatus); document.getElementById('payroll-table')?.scrollIntoView({behavior:'smooth',block:'start'}); }}
            className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-5 cursor-pointer group hover:shadow-lg hover:border-indigo-400/60 transition-all duration-200 active:scale-[0.98]">
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{kpi.value}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.trendUp?'bg-emerald-500/15 text-emerald-400':'bg-amber-500/15 text-amber-400'}`}>
                  {kpi.trendUp?<TrendingUp className="w-3 h-3"/>:<Clock className="w-3 h-3"/>}
                  {kpi.sub}
                </span>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <kpi.icon className="w-5 h-5 text-white"/>
              </div>
            </div>
            <p className="relative text-[10px] text-indigo-500 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <ChevronRight className="w-3 h-3"/> Click to filter
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── AI INSIGHT ─── */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 p-5">
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm shrink-0">
            <Sparkles className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              AI Payroll Insights <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">SMART</span>
            </h3>
            <p className="text-white/80 text-sm mt-1 leading-relaxed">
              <span className="text-yellow-300 font-semibold">{paidCount}</span> of <span className="text-yellow-300 font-semibold">{employees.length}</span> employees paid this month
              {' '}· Total disbursed <span className="text-yellow-300 font-semibold">{fmtC(totalPaid)}</span>
              {' '}· Pending <span className="text-red-300 font-semibold">{fmtC(totalPending)}</span> for {pendingCount} employee{pendingCount!==1?'s':''}.
              {' '}Deductions account for <span className="text-yellow-300 font-semibold">{((totalDeductions/(totalPaid+totalPending||1))*100).toFixed(1)}%</span> of gross payroll.
              {onHoldCount > 0 && <span className="text-orange-300 font-semibold"> ⚠ {onHoldCount} on hold — review required.</span>}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── FILTERS ─── */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"/>
            <input type="text" placeholder="Search by name, ID or department..."
              value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"/>
            {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"><X className="w-4 h-4"/></button>}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--muted-foreground)] shrink-0"/>
            <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {departments.map(d=><option key={d} value={d}>{d==='All'?'All Departments':d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)] shrink-0"/>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {statuses.map(s=><option key={s} value={s}>{s==='All'?'All Statuses':s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0"/>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {sortOptions.map(s=><option key={s} value={s}>Sort: {s}</option>)}
            </select>
            <button onClick={()=>setSortOrder(p=>p==='asc'?'desc':'asc')}
              className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] transition">
              {sortOrder==='asc'?<ArrowUp className="w-4 h-4"/>:<ArrowDown className="w-4 h-4"/>}
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-[var(--muted-foreground)]">
          Showing <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> of {employees.length} employees ·
          <span className="ml-1 text-emerald-500 font-semibold">{paidCount} Paid</span> ·
          <span className="ml-1 text-amber-500 font-semibold">{pendingCount} Pending</span> ·
          <span className="ml-1 text-red-500 font-semibold">{onHoldCount} On Hold</span>
        </div>
      </motion.div>

      {/* ─── EMPLOYEE TABLE ─── */}
      <motion.div id="payroll-table" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl overflow-hidden">

        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                {['Employee','Department','Basic','HRA','Bonuses','Deductions','Net Salary','Status','Action'].map(h=>(
                  <th key={h} className={`p-4 font-bold text-[var(--muted-foreground)] text-xs uppercase tracking-wider ${['Basic','HRA','Bonuses','Deductions','Net Salary'].includes(h)?'text-right':'text-left'} ${h==='Status'||h==='Action'?'text-center':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp,i)=>(
                <motion.tr key={emp.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                  className="border-b border-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                  onClick={()=>setSelectedEmployee(emp)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {emp.name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{emp.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)] border border-[var(--border)]"
                      style={{color: DEPT_COLORS[emp.department]||'inherit'}}>
                      <Building2 className="w-3 h-3"/>{emp.department}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-[var(--foreground)]">{fmt(emp.basicSalary)}</td>
                  <td className="p-4 text-right text-[var(--muted-foreground)]">{fmt(emp.hra)}</td>
                  <td className="p-4 text-right text-emerald-500 font-semibold">{fmt(emp.bonuses)}</td>
                  <td className="p-4 text-right text-red-500 font-semibold">-{fmt(emp.totalDeductions)}</td>
                  <td className="p-4 text-right font-bold text-[var(--foreground)]">{fmt(emp.netSalary)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[emp.status]}`}>
                      {STATUS_ICON[emp.status]}{emp.status}
                    </span>
                  </td>
                  <td className="p-4 text-center" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={()=>setSelectedEmployee(emp)} title="View Payslip"
                        className="p-1.5 rounded-lg hover:bg-indigo-500/15 text-indigo-400 transition">
                        <Eye className="w-4 h-4"/>
                      </button>
                      {emp.status==='Pending' && (
                        <button onClick={()=>setPayEmployee(emp)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black transition uppercase tracking-wider">
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="lg:hidden divide-y divide-[var(--border)]">
          {filtered.map((emp,i)=>(
            <motion.div key={emp.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="p-4 hover:bg-[var(--accent)] transition-colors cursor-pointer" onClick={()=>setSelectedEmployee(emp)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                    {emp.name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{emp.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{emp.employeeId} · {emp.department}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[emp.status]}`}>
                    {STATUS_ICON[emp.status]}{emp.status}
                  </span>
                  {emp.status==='Pending' && (
                    <button onClick={e=>{e.stopPropagation();setPayEmployee(emp);}}
                      className="text-[10px] font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition">
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
                  <p className="text-[var(--muted-foreground)]">Basic</p>
                  <p className="font-semibold mt-0.5">{fmt(emp.basicSalary)}</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                  <p className="text-red-400">Deductions</p>
                  <p className="font-semibold text-red-400 mt-0.5">-{fmt(emp.totalDeductions)}</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-2 text-center">
                  <p className="text-indigo-400">Net Pay</p>
                  <p className="font-bold text-indigo-400 mt-0.5">{fmt(emp.netSalary)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length===0 && !loading && (
          <div className="p-12 text-center text-[var(--muted-foreground)]">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40"/>
            <p className="font-medium">No employees found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>

      {/* ─── CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Payroll Trend */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400"/> Monthly Payroll Trend
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Total payroll disbursed vs deductions · Current month: <span className="font-bold text-[var(--foreground)]">{fmtC(monthlyTrend[monthlyTrend.length-1]?.payroll||0)}</span>
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="payG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--muted-foreground)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'var(--muted-foreground)'}} axisLine={false} tickLine={false} tickFormatter={(v:any)=>fmtC(v)}/>
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,fontSize:13}}
                  formatter={(v:any,name:any)=>[fmt(v), name==='payroll'?'Payroll':'Deductions']}/>
                <Area type="monotone" dataKey="payroll" stroke="#6366f1" strokeWidth={2} fill="url(#payG)" name="payroll"/>
                <Area type="monotone" dataKey="deductions" stroke="#ef4444" strokeWidth={2} fill="url(#dedG)" name="deductions"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department-wise Payroll */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-cyan-400"/> Department-wise Payroll
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Net salary by department · Total: <span className="font-bold text-[var(--foreground)]">{fmtC(employees.reduce((s,e)=>s+e.netSalary,0))}</span>
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{left:8}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:11,fill:'var(--muted-foreground)'}} axisLine={false} tickLine={false} tickFormatter={(v:any)=>fmtC(v)}/>
                <YAxis type="category" dataKey="dept" tick={{fontSize:12,fill:'var(--muted-foreground)'}} axisLine={false} tickLine={false} width={80}/>
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,fontSize:13}}
                  formatter={(v:any,_:any,p:any)=>[`${fmt(v)} (${p.payload.paid}/${p.payload.count} paid)`,'Net Salary']}/>
                <Bar dataKey="total" radius={[0,6,6,0]}>
                  {deptData.map((d,i)=><Cell key={i} fill={DEPT_COLORS[d.dept]||PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {deptData.map(d=>(
              <div key={d.dept} className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:DEPT_COLORS[d.dept]||'#888'}}/>
                {d.dept} ({d.paid}/{d.count} paid)
              </div>
            ))}
          </div>
        </motion.div>

        {/* Deduction Breakdown */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.8}}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <CircleDollarSign className="w-4 h-4 text-purple-400"/> Deduction Breakdown
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Total deductions: <span className="font-bold text-[var(--foreground)]">{fmtC(totalDeductions)}</span> out of gross <span className="font-bold">{fmtC(employees.reduce((s,e)=>s+e.grossSalary,0))}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={deductData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name">
                    {deductData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,fontSize:13}}
                    formatter={(v:any)=>[fmt(v),'']}/>
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-2 min-w-[130px]">
              {deductData.map((d,i)=>(
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:PIE_COLORS[i%PIE_COLORS.length]}}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-[var(--foreground)] truncate">{d.name}</p>
                    <p className="text-[9px] text-[var(--muted-foreground)]">{fmtC(d.value)} · {totalDeductions>0?((d.value/totalDeductions)*100).toFixed(1):0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payroll Processing + Quick Actions */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.9}}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-5 flex flex-col gap-5">
          {/* Processing */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400"/> Payroll Processing
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"/>
                <input type="month" value={payrollMonth} onChange={e=>setPayrollMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"/>
              </div>
              <button onClick={runPayroll} disabled={isRunning}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg disabled:opacity-50 transition">
                {isRunning?<Loader2 className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>}
                {isRunning?'Processing...':'Run Payroll'}
              </button>
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-[var(--border)]"/>
              <div className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                style={{width:`${Math.max(0,((workflowStep-1)/3)*80)}%`}}/>
              {workflowSteps.map(ws=>(
                <div key={ws.label} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${workflowStep>=ws.step?'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg':'bg-[var(--accent)] text-[var(--muted-foreground)] border border-[var(--border)]'}`}>
                    {workflowStep>ws.step?<Check className="w-4 h-4"/>:ws.step}
                  </div>
                  <span className={`text-xs font-medium ${workflowStep>=ws.step?'text-[var(--foreground)]':'text-[var(--muted-foreground)]'}`}>{ws.label}</span>
                </div>
              ))}
            </div>
            {workflowStep===4 && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4"/> Payroll for {payrollMonth} processed! {fmtC(totalPaid+totalPending)} disbursed.
              </motion.div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400"/> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:'Run Payroll',      icon:Play,           desc:'Process monthly',     gradient:'from-indigo-600 to-purple-600', action: runPayroll },
                {label:'Generate Payslips',icon:FileText,       desc:'Email to all staff',  gradient:'from-emerald-600 to-teal-600',  action: ()=>showToast(`Payslips for ${payrollMonth} generated and emailed to ${paidCount} employees.`) },
                {label:'Export Report',    icon:FileSpreadsheet,desc:'Download Excel CSV',  gradient:'from-blue-600 to-cyan-600',     action: exportCSV },
                {label:'Add Bonus',        icon:Gift,           desc:'Assign incentives',   gradient:'from-amber-600 to-orange-600',  action: ()=>setShowBonusModal(true) },
              ].map(a=>(
                <button key={a.label} onClick={a.action}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)] hover:bg-[var(--surface)] transition-all group text-left active:scale-[0.97]">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${a.gradient} shadow-lg shrink-0`}>
                    <a.icon className="w-3.5 h-3.5 text-white"/>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-[var(--foreground)] truncate">{a.label}</p>
                    <p className="text-[9px] text-[var(--muted-foreground)] truncate">{a.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform"/>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── PAYSLIP MODAL ─── */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div key="ps-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={()=>setSelectedEmployee(null)}>
            <motion.div key="ps-content" initial={{opacity:0,scale:0.9,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:30}}
              transition={{type:'spring',damping:25,stiffness:300}} onClick={e=>e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">Payslip Details</h2>
                  <button onClick={()=>setSelectedEmployee(null)} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"><X className="w-4 h-4"/></button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {selectedEmployee.name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedEmployee.name}</p>
                    <p className="text-white/70 text-sm">{selectedEmployee.employeeId} · {selectedEmployee.designation}</p>
                    <p className="text-white/60 text-xs">{selectedEmployee.department} · Joined {selectedEmployee.joiningDate}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Earnings */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/>Earnings</h4>
                  <div className="space-y-2.5">
                    {[
                      {l:'Basic Salary',        v:selectedEmployee.basicSalary},
                      {l:'HRA',                 v:selectedEmployee.hra},
                      {l:'Bonuses & Incentives',v:selectedEmployee.bonuses}
                    ].map(i=>(
                      <div key={i.l} className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">{i.l}</span>
                        <span className="font-medium text-[var(--foreground)]">{fmt(i.v)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold text-sm">
                      <span className="text-emerald-500">Gross Salary</span>
                      <span className="text-emerald-500">{fmt(selectedEmployee.grossSalary)}</span>
                    </div>
                  </div>
                </div>
                {/* Deductions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-1.5"><TrendingDown className="w-3 h-3"/>Deductions</h4>
                  <div className="space-y-2.5">
                    {[
                      {l:'Provident Fund (PF)',      v:selectedEmployee.pf},
                      {l:'Tax Deducted at Source (TDS)',v:selectedEmployee.tds},
                      {l:'ESI',                     v:selectedEmployee.esi},
                      {l:'Professional Tax',        v:selectedEmployee.professionalTax},
                      {l:'Loan Deduction',          v:selectedEmployee.loanDeduction},
                    ].map(i=>(
                      <div key={i.l} className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">{i.l}</span>
                        <span className="font-medium text-red-500">-{fmt(i.v)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold text-sm">
                      <span className="text-red-500">Total Deductions</span>
                      <span className="text-red-500">-{fmt(selectedEmployee.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
                {/* Net Pay */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Net Pay</p>
                      <p className="text-2xl font-bold text-[var(--foreground)] mt-0.5">{fmt(selectedEmployee.netSalary)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_COLOR[selectedEmployee.status]}`}>
                      {STATUS_ICON[selectedEmployee.status]}{selectedEmployee.status}
                    </span>
                  </div>
                  {selectedEmployee.bankAccount !== '—' && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      {selectedEmployee.bankAccount !== '—' && <span>Bank: {selectedEmployee.bankAccount}</span>}
                      {selectedEmployee.panNumber !== '—' && <span>PAN: {selectedEmployee.panNumber}</span>}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={()=>generatePayslip(selectedEmployee)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 transition">
                    <Download className="w-4 h-4"/> Download Payslip
                  </button>
                  <button onClick={()=>{setSelectedEmployee(null);showToast(`Payslip emailed to ${selectedEmployee.name}.`);}}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--surface)] transition">
                    <Send className="w-4 h-4"/>
                  </button>
                  {selectedEmployee.status==='Pending' && (
                    <button onClick={()=>{setSelectedEmployee(null);setPayEmployee(selectedEmployee);}}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg hover:opacity-90 transition">
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PAY METHOD MODAL ─── */}
      <AnimatePresence>
        {payEmployee && (
          <PayMethodModal
            employee={payEmployee}
            onClose={()=>setPayEmployee(null)}
            onPaid={(method,ref)=>handlePaid(payEmployee.id,method,ref)}
          />
        )}
      </AnimatePresence>

      {/* ─── ADD BONUS MODAL ─── */}
      <AnimatePresence>
        {showBonusModal && (
          <AddBonusModal
            employees={employees}
            onClose={()=>setShowBonusModal(false)}
            onSave={handleAddBonus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
