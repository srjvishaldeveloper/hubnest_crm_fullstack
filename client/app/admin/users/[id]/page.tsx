'use client';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, Ban, KeyRound, Trash2, Mail, Phone, Building2, Calendar, Clock, Target, TrendingUp, DollarSign, Activity, Briefcase, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { MOCK_USERS } from '../../../../store/mockData';

/* Role-based permission labels */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Sales Manager': ['View Leads', 'Assign Leads', 'Manage Sales Team', 'View Reports', 'Create Sales Executive'],
  'Sales Executive': ['View Assigned Leads', 'Update Lead Status', 'Log Activities'],
  'Marketing Head': ['Manage Campaigns', 'View Analytics', 'Manage Marketing Team', 'Create Marketing Executive'],
  'Marketing Executive': ['Execute Campaigns', 'View Campaign Reports'],
  'Support Manager': ['Manage Tickets', 'Assign Tickets', 'View SLA Reports', 'Create Support Agent'],
  'Support Agent': ['View Assigned Tickets', 'Update Ticket Status'],
  'Finance Executive': ['View Finance Reports', 'Manage Invoices', 'Track Payments'],
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = MOCK_USERS.find(u => u.id === id);
  if (!user) return <div className="py-32 text-center"><p className="text-slate-500 text-sm">User not found</p><button onClick={() => router.back()} className="mt-4 text-sm text-[#2563EB] hover:underline">Go back</button></div>;

  const perms = ROLE_PERMISSIONS[user.role] || [];
  const sc = user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : user.status === 'Inactive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#2563EB] transition group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Users
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/20">{user.avatar}</div>
            <h2 className="mt-4 text-lg font-bold text-[#0F172A]">{user.name}</h2>
            <span className="mt-1 font-mono text-xs text-slate-500">{user.employeeId}</span>
            <span className="mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg">{user.role}</span>
            <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc}`}>{user.status}</span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600"><Mail className="w-4 h-4 text-slate-400"/>{user.email}</div>
            <div className="flex items-center gap-3 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400"/>{user.phone}</div>
            <div className="flex items-center gap-3 text-sm text-slate-600"><Building2 className="w-4 h-4 text-slate-400"/>{user.department}</div>
            <div className="flex items-center gap-3 text-sm text-slate-600"><Calendar className="w-4 h-4 text-slate-400"/>Joined {user.joinedDate}</div>
            <div className="flex items-center gap-3 text-sm text-slate-600"><Clock className="w-4 h-4 text-slate-400"/>Last login {user.lastLogin}</div>
            {user.team && <div className="flex items-center gap-3 text-sm text-slate-600"><Briefcase className="w-4 h-4 text-slate-400"/>Team {user.team}</div>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"><Pencil className="w-3.5 h-3.5"/> Edit</button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition"><Ban className="w-3.5 h-3.5"/> Block</button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"><KeyRound className="w-3.5 h-3.5"/> Reset Pwd</button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"><Trash2 className="w-3.5 h-3.5"/> Deactivate</button>
          </div>
        </motion.div>
        <div className="lg:col-span-2 space-y-6">
          {/* Permissions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#2563EB]"/>Permissions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perms.map(p => <div key={p} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50"><CheckCircle2 className="w-4 h-4 text-emerald-500"/><span className="text-sm text-emerald-700 font-medium">{p}</span></div>)}
            </div>
          </motion.div>
          {/* Activity */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#2563EB]"/>Activity Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl text-center"><p className="text-2xl font-bold text-[#0F172A]">{user.performance.loginDays}</p><p className="text-xs text-slate-500 mt-0.5">Login Days</p></div>
              <div className="p-4 bg-violet-50 rounded-xl text-center"><p className="text-2xl font-bold text-[#0F172A]">{user.performance.actions}</p><p className="text-xs text-slate-500 mt-0.5">Actions</p></div>
              <div className="p-4 bg-emerald-50 rounded-xl text-center"><p className="text-2xl font-bold text-[#0F172A]">{user.performance.leadsHandled}</p><p className="text-xs text-slate-500 mt-0.5">Leads Handled</p></div>
              <div className="p-4 bg-amber-50 rounded-xl text-center"><p className="text-2xl font-bold text-[#0F172A]">{user.performance.dealsClosed}</p><p className="text-xs text-slate-500 mt-0.5">Deals Closed</p></div>
            </div>
          </motion.div>
          {/* Performance */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-slate-200/60 p-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500"/>Performance Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl"><div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-blue-600"/><span className="text-xs font-semibold text-blue-700">Conversion Rate</span></div><p className="text-2xl font-bold text-[#0F172A]">{user.performance.conversionRate}%</p></div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-600"/><span className="text-xs font-semibold text-emerald-700">Deals Closed</span></div><p className="text-2xl font-bold text-[#0F172A]">{user.performance.dealsClosed}</p></div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-amber-600"/><span className="text-xs font-semibold text-amber-700">Revenue</span></div><p className="text-2xl font-bold text-[#0F172A]">{user.performance.revenueGenerated}</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
