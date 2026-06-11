'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { exportToCSV } from '../../../services/csvExport';
import api from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const DEPT_ROLES: Record<string, string[]> = {
  Sales: ['Sales Executive', 'Sales Manager'],
  Marketing: ['Marketing Executive'],
  Support: ['Support Agent', 'Support Manager'],
  Finance: ['Finance Executive']
};
import {
  Search, Plus, Filter, Download, Eye, Pencil, Trash2,
  Users, UserCheck, UserX, ShieldOff, ChevronDown, UserCircle,
  X, Copy, Check, ShieldAlert, Key, Sparkles, TrendingUp,
  Activity, ShieldCheck, Mail, Phone, Calendar, BadgeCheck, AlertTriangle,
  RotateCcw, Ban
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .transform(val => val.replace(/[\s\-()]/g, ''))
    .refine(val => {
      if (!val) return true; // optional field
      // International format: +countrycode followed by number, total 8-15 digits after +
      if (val.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(val);
      // Indian local format: exactly 10 digits starting with 6-9
      if (/^[6-9]\d{9}$/.test(val)) return true;
      return false;
    }, "Invalid phone number. Use +country code (e.g., +919876543210) or 10-digit Indian number (e.g., 9876543210)")
    .optional().or(z.literal(''))
});

interface UserRecord {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  lastLogin: string;
  phone: string;
  joinedDate: string;
  avatar: string;
  leadsHandled: number;
  loginDays: number;
  actionsPerformed: number;
  conversionRate: string;
  dealsClosed: number;
  revenueGenerated: string;
}

const MOCK_USERS_DETAILED: UserRecord[] = [
  {
    id: '1',
    name: 'Varun Malhotra',
    email: 'varun@jobnest.com',
    employeeId: 'EMP-3012',
    role: 'Sales Manager',
    department: 'Sales',
    status: 'Active',
    lastLogin: '2 mins ago',
    phone: '+91 98765 43210',
    joinedDate: '12 Jan 2024',
    avatar: 'VM',
    leadsHandled: 142,
    loginDays: 24,
    actionsPerformed: 820,
    conversionRate: '88%',
    dealsClosed: 32,
    revenueGenerated: '$45,000'
  },
  {
    id: '2',
    name: 'Sneha Gupta',
    email: 'sneha@jobnest.com',
    employeeId: 'EMP-3045',
    role: 'Sales Executive',
    department: 'Sales',
    status: 'Active',
    lastLogin: '1 hour ago',
    phone: '+91 99887 76655',
    joinedDate: '01 Feb 2024',
    avatar: 'SG',
    leadsHandled: 98,
    loginDays: 20,
    actionsPerformed: 412,
    conversionRate: '94%',
    dealsClosed: 24,
    revenueGenerated: '$28,500'
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@jobnest.com',
    employeeId: 'EMP-3010',
    role: 'Support Manager',
    department: 'Support',
    status: 'Active',
    lastLogin: 'Today, 10:45 AM',
    phone: '+91 98888 77777',
    joinedDate: '15 Oct 2023',
    avatar: 'AP',
    leadsHandled: 0,
    loginDays: 22,
    actionsPerformed: 980,
    conversionRate: 'N/A',
    dealsClosed: 0,
    revenueGenerated: 'N/A'
  },
  {
    id: '4',
    name: 'Priya Sharma',
    email: 'priya.s@jobnest.com',
    employeeId: 'EMP-3098',
    role: 'Marketing Executive',
    department: 'Marketing',
    status: 'Inactive',
    lastLogin: '5 days ago',
    phone: '+91 91111 22222',
    joinedDate: '10 Mar 2024',
    avatar: 'PS',
    leadsHandled: 45,
    loginDays: 12,
    actionsPerformed: 120,
    conversionRate: '72%',
    dealsClosed: 8,
    revenueGenerated: '$9,200'
  },
  {
    id: '5',
    name: 'Karthik Nair',
    email: 'karthik@jobnest.com',
    employeeId: 'EMP-3022',
    role: 'Support Agent',
    department: 'Support',
    status: 'Blocked',
    lastLogin: '2 weeks ago',
    phone: '+91 92222 33333',
    joinedDate: '18 Nov 2023',
    avatar: 'KN',
    leadsHandled: 0,
    loginDays: 0,
    actionsPerformed: 0,
    conversionRate: 'N/A',
    dealsClosed: 0,
    revenueGenerated: 'N/A'
  },
  {
    id: '6',
    name: 'Rohan Mehta',
    email: 'rohan.m@jobnest.com',
    employeeId: 'EMP-3114',
    role: 'Finance Executive',
    department: 'Finance',
    status: 'Active',
    lastLogin: '3 hours ago',
    phone: '+91 93333 44444',
    joinedDate: '05 May 2024',
    avatar: 'RM',
    leadsHandled: 0,
    loginDays: 25,
    actionsPerformed: 640,
    conversionRate: 'N/A',
    dealsClosed: 0,
    revenueGenerated: 'N/A'
  }
];

const DONUT_DATA = [
  { name: 'Sales Executives', value: 48, color: '#2563EB' },
  { name: 'Support Agents', value: 25, color: '#10B981' },
  { name: 'Marketing', value: 15, color: '#F59E0B' },
  { name: 'Managers', value: 12, color: '#8B5CF6' }
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', actions: 120 },
  { day: 'Tue', actions: 240 },
  { day: 'Wed', actions: 180 },
  { day: 'Thu', actions: 310 },
  { day: 'Fri', actions: 280 },
  { day: 'Sat', actions: 90 },
  { day: 'Sun', actions: 40 }
];

function AdminUsersPageContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'Blocked'>('All');
  const searchParams = useSearchParams();

  useEffect(() => {
    api.get('/auth/users')
      .then(res => {
        if (res.data && res.data.success && res.data.data.users) {
          setUsers(res.data.data.users);
        }
      })
      .catch(err => {
        console.error('Failed to fetch users:', err);
      });
  }, []);

  // Auto-open Add User modal when navigated with ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, [searchParams]);
  
  // Filters
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newRole, setNewRole] = useState('Sales Executive');
  const [newDept, setNewDept] = useState('Sales');
  const [newPassword, setNewPassword] = useState('Tenant@123!');
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [sendCreds, setSendCreds] = useState(true);
  const [sortBy, setSortBy] = useState('name-asc');

  // Email validation checking states
  const [emailCheckErr, setEmailCheckErr] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailCheckCode, setEmailCheckCode] = useState<string | null>(null);
  const [archivedUserId, setArchivedUserId] = useState<string | null>(null);
  const [restoringUser, setRestoringUser] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (showAddModal) {
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewEmployeeId(`EMP-${Math.floor(3100 + Math.random() * 6800)}`);
      setEmailCheckErr('');
      setEmailAvailable(null);
      setCheckingEmail(false);
      setEmailCheckCode(null);
      setArchivedUserId(null);
      setRestoringUser(false);
      setPhoneError('');
    }
  }, [showAddModal]);

  async function handleEmailBlur() {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailAvailable(null);
      setEmailCheckErr('');
      setEmailCheckCode(null);
      setArchivedUserId(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailAvailable(false);
      setEmailCheckErr('Please enter a valid email address.');
      setEmailCheckCode(null);
      setArchivedUserId(null);
      return;
    }

    setCheckingEmail(true);
    setEmailCheckErr('');
    setEmailCheckCode(null);
    setArchivedUserId(null);
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(trimmed)}&_t=${Date.now()}`);
      const data = response.data?.data;
      const available = data?.available;
      const code = data?.code || null;
      const userId = data?.userId || null;

      setEmailAvailable(available);
      setEmailCheckCode(code);

      if (!available) {
        if (code === 'USER_ARCHIVED') {
          setArchivedUserId(userId);
          setEmailCheckErr('This email belongs to an archived user in your company.');
        } else if (code === 'OTHER_TENANT') {
          setEmailCheckErr('This email is registered with another company. Please use a different email.');
        } else {
          setEmailCheckErr('This email is already in use. Try a different one.');
        }
      } else {
        setEmailCheckErr('');
      }
    } catch (err: any) {
      console.error('Email check failed:', err);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleRestoreUser() {
    if (!archivedUserId) return;
    setRestoringUser(true);
    try {
      await api.post(`/auth/users/${archivedUserId}/restore`);
      // Refresh user list
      const res = await api.get('/auth/users');
      if (res.data?.success && res.data.data.users) {
        setUsers(res.data.data.users);
      }
      setShowAddModal(false);
      alert('User restored successfully!');
    } catch (err: any) {
      console.error('Restore failed:', err);
      alert(err.response?.data?.message || 'Failed to restore user');
    } finally {
      setRestoringUser(false);
    }
  }

  // Detail View Right Drawer
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<'Overview' | 'Permissions' | 'Activity' | 'Performance' | 'Security'>('Overview');

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length,
      newMonth: users.filter(u => u.joinedDate.includes('2024')).length,
      blocked: users.filter(u => u.status === 'Blocked').length,
    };
  }, [users]);

  const sortedAndFilteredUsers = useMemo(() => {
    const res = users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) || 
                          u.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === 'All' || u.status === activeTab;
      const matchRole = selectedRole === 'All' || u.role === selectedRole;
      const matchDept = selectedDept === 'All' || u.department === selectedDept;
      return matchSearch && matchTab && matchRole && matchDept;
    });

    return [...res].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'id-asc') return a.employeeId.localeCompare(b.employeeId);
      if (sortBy === 'id-desc') return b.employeeId.localeCompare(a.employeeId);
      return 0;
    });
  }, [users, search, activeTab, selectedRole, selectedDept, sortBy]);

  // Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedAndFilteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = createUserSchema.parse({
        name: newName,
        email: newEmail,
        phone: newPhone
      });

      if (emailAvailable === false) {
        setEmailCheckErr('This email is already in use. Try a different one.');
        return;
      }

      const employeeId = newEmployeeId.trim() || `EMP-${Math.floor(3100 + Math.random() * 6800)}`;

      api.post('/auth/create-user', {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        employeeId,
        role: newRole,
        department: newDept,
        password: newPassword,
        sendCreds
      }).then(res => {
      if (res.data && res.data.success) {
        const newUser: UserRecord = {
          id: res.data.data.id || String(users.length + 1),
          name: newName,
          email: newEmail,
          employeeId,
          role: newRole,
          department: newDept,
          status: 'Active',
          lastLogin: 'Never',
          phone: newPhone || '+91 99999 88888',
          joinedDate: 'Today',
          avatar: newName.split(' ').map(n => n[0]).join('').toUpperCase(),
          leadsHandled: 0,
          loginDays: 0,
          actionsPerformed: 0,
          conversionRate: '0%',
          dealsClosed: 0,
          revenueGenerated: '$0'
        };

        setUsers(prev => [newUser, ...prev]);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        alert('User created successfully!');
      } else {
        alert(res.data.message || 'Failed to create user');
      }
    }).catch(err => {
      console.error(err);
      if (err.response?.status === 409) {
        const code = err.response?.data?.code;
        if (code === 'USER_ARCHIVED') {
          setArchivedUserId(err.response?.data?.userId);
          setEmailCheckCode('USER_ARCHIVED');
          setEmailCheckErr('This email belongs to an archived user. You can restore them.');
        } else if (code === 'OTHER_TENANT') {
          setEmailCheckCode('OTHER_TENANT');
          setEmailCheckErr('This email is registered with another company. Please use a different email.');
        } else {
          setEmailCheckErr('This email is already in use. Try a different one.');
        }
        setEmailAvailable(false);
        return;
      }
      alert(err.response?.data?.message || 'Failed to create user');
    });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        alert(err.issues[0].message);
      }
    }
  };

  const handleDeleteUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this user?')) {
      api.delete(`/auth/users/${id}`)
        .then(() => {
          setUsers(prev => prev.filter(u => u.id !== id));
          if (selectedUser?.id === id) setSelectedUser(null);
          alert('User deleted successfully!');
        })
        .catch(err => {
          console.error(err);
          alert(err.response?.data?.message || 'Failed to delete user');
        });
    }
  };

  const handleToggleBlock = (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    if (confirm(`Are you sure you want to change user status to ${nextStatus}?`)) {
      api.post('/auth/users/toggle-block', { id, status: nextStatus })
        .then(() => {
          setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus as any } : u));
          if (selectedUser?.id === id) {
            setSelectedUser(prev => prev ? { ...prev, status: nextStatus as any } : null);
          }
          alert(`User status updated to ${nextStatus} successfully!`);
        })
        .catch(err => {
          console.error(err);
          alert(err.response?.data?.message || 'Failed to update user status');
        });
    }
  };

  const handleResetUserPassword = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to reset the password for ${name}?`)) {
      api.post(`/auth/users/${id}/reset-password`)
        .then((res: any) => {
          alert(res.data?.message || 'Password has been reset and credentials sent to email.');
        })
        .catch((err: any) => {
          console.error(err);
          alert(err.response?.data?.message || 'Failed to reset password');
        });
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Users Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Configure user accounts, performance logs, and role-based access control.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#333333] text-xs font-semibold bg-white dark:bg-[#161616] hover:bg-slate-50 dark:hover:bg-[#1f1f1f] text-slate-700 dark:text-[#F9FAFB] transition outline-none"
            >
              <option value="name-asc" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sort: Name (A-Z)</option>
              <option value="name-desc" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sort: Name (Z-A)</option>
              <option value="id-asc" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sort: ID (Low to High)</option>
              <option value="id-desc" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sort: ID (High to Low)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 dark:bg-[#161616] transition bg-white text-slate-700"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button 
            onClick={() => {
              const dataToExport = selectedIds.length > 0
                ? users.filter(u => selectedIds.includes(u.id))
                : sortedAndFilteredUsers;
              exportToCSV(dataToExport, 'team_users');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 dark:bg-[#161616] transition bg-white text-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/10"
          >
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {/* 5 Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Users', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive Users', value: stats.inactive, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'New This Month', value: stats.newMonth, icon: Calendar, color: 'text-[#8B5CF6]', bg: 'bg-purple-50' },
          { label: 'Blocked Accounts', value: stats.blocked, icon: ShieldOff, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-[#161616] p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-[#0F172A] dark:text-[#F9FAFB] mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and filters section */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Tab Header & Search bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1f1f1f] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex border-b border-slate-100 dark:border-[#1f1f1f] md:border-b-0">
            {(['All', 'Active', 'Inactive', 'Blocked'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-[13px] ${
                  activeTab === tab 
                    ? 'border-[#2563EB] text-[#2563EB]' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab} Users
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161616] border border-slate-200 rounded-xl px-3 py-1.5 w-60 hover:border-slate-300 transition group focus-within:border-blue-500 focus-within:bg-white">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, ID, email..." 
                className="bg-transparent text-xs outline-none w-full text-slate-700 placeholder:text-slate-400" 
              />
            </div>
          </div>
        </div>

        {/* Filter Dropdown (Collapsible) */}
        {showFiltersDropdown && (
          <div className="bg-slate-50 dark:bg-[#161616] border-b border-slate-100 dark:border-[#1f1f1f] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Department</label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-slate-700 dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold"
              >
                <option value="All" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">All Departments</option>
                <option value="Sales" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sales</option>
                <option value="Marketing" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Marketing</option>
                <option value="Support" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Support</option>
                <option value="Finance" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Finance</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Role Badge</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-slate-700 dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold"
              >
                <option value="All" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">All Roles</option>
                <option value="Sales Manager" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sales Manager</option>
                <option value="Sales Executive" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sales Executive</option>
                <option value="Support Manager" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Support Manager</option>
                <option value="Support Agent" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Support Agent</option>
                <option value="Marketing Executive" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Marketing Executive</option>
                <option value="Finance Executive" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Finance Executive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedDept('All'); setSelectedRole('All'); setSearch(''); }}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#161616]/75 border-b border-slate-100 dark:border-[#1f1f1f]">
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox"
                    checked={sortedAndFilteredUsers.length > 0 && selectedIds.length === sortedAndFilteredUsers.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                  />
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Info</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Login</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredUsers.map((u) => (
                <tr 
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }}
                  className="border-b border-slate-100 dark:border-[#1f1f1f] hover:bg-slate-50 dark:bg-[#161616]/60 transition cursor-pointer"
                >
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={e => handleSelectOne(u.id, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-100" 
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
                        {u.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB]">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">{u.employeeId}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full text-[#2563EB] bg-blue-50 border border-blue-100">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{u.department}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : u.status === 'Inactive' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        u.status === 'Active' ? 'bg-[#16A34A]' : u.status === 'Inactive' ? 'bg-[#D97706]' : 'bg-[#DC2626]'
                      }`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{u.lastLogin}</td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => { setSelectedUser(u); setDrawerTab('Overview'); }}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#0F172A] dark:text-[#F9FAFB] rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleToggleBlock(u.id, u.status, e)}
                        className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition"
                        title="Block/Unblock"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteUser(u.id, e)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedAndFilteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <UserCircle className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-xs text-slate-500 font-medium mt-2">No users found matching filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section (3 panels): Donut Chart / Line Chart / AI recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Role Distribution */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border dark:border-[#1f1f1f] border-slate-200/60 shadow-sm flex flex-col h-[320px]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Summary of user seat counts within client system</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DONUT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DONUT_DATA.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-[#0F172A] dark:text-[#F9FAFB]">{stats.total}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Seats</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-50 pt-3 mt-1">
            {DONUT_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-slate-600 font-semibold">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: User Activity line chart */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border dark:border-[#1f1f1f] border-slate-200/60 shadow-sm flex flex-col h-[320px]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Activity (This Week)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Aggregate actions completed daily by active executives</p>
          </div>
          <div className="flex-1 min-h-0 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_ACTIVITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="actions" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 6 }} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: AI Recommendations list */}
        <div className="bg-white dark:bg-[#161616] p-5 rounded-2xl border dark:border-[#1f1f1f] border-slate-200/60 shadow-sm flex flex-col h-[320px] overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Recommendations</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Intelligent governance alerts and action triggers</p>
            </div>
            <Sparkles className="w-4.5 h-4.5 text-[#2563EB]" />
          </div>
          <div className="flex-1 overflow-y-auto mt-4.5 space-y-3.5 pr-1.5 scrollbar-thin">
            {[
              { text: 'Deactivate 1 inactive user (Priya Sharma) to optimize license cost and seal database credentials.', status: 'Action Recommended', color: 'text-amber-500 border-amber-200 bg-amber-50/60' },
              { text: 'Verify Sneha Gupta permissions. Conversion rate is at 94% which outperforms ordinary thresholds.', status: 'Performance Insight', color: 'text-emerald-500 border-emerald-200 bg-emerald-50/60' },
              { text: 'Blocked account (Karthik Nair) is still attached to Support group. Remove from queue assignment.', status: 'Security Warning', color: 'text-rose-500 border-rose-200 bg-rose-50/60' },
            ].map((rec, idx) => (
              <div key={idx} className="p-3 border rounded-xl space-y-1 bg-slate-50 dark:bg-[#161616]/40">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{rec.status}</span>
                <p className="text-xs text-slate-700 font-semibold leading-normal">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <div 
                className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">Add Team Member</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Provision a workspace account for client CRM</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Body Form */}
                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name *</label>
                      <input 
                        required
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Varun Malhotra"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Employee ID *</label>
                      <input 
                        required
                        type="text" 
                        value={newEmployeeId}
                        onChange={e => setNewEmployeeId(e.target.value)}
                        placeholder="e.g. EMP-3101"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address *</label>
                      <div className="relative">
                        <input 
                          required
                          type="email" 
                          value={newEmail}
                          onChange={e => {
                            setNewEmail(e.target.value);
                            setEmailAvailable(null);
                            setEmailCheckErr('');
                          }}
                          onBlur={handleEmailBlur}
                          placeholder="varun@jobnest.com"
                          className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition font-semibold bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] ${
                            emailCheckErr ? 'border-red-400 focus:border-red-400' : 'border-slate-200 dark:border-[#333333] focus:border-blue-500'
                          } pr-8`}
                        />
                        {checkingEmail && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        )}
                        {!checkingEmail && emailAvailable === true && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs" title="Email available">✓</span>
                        )}
                        {!checkingEmail && emailAvailable === false && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs" title="Email already in use">✗</span>
                        )}
                      </div>
                      {emailCheckErr && (
                        <div className="mt-1.5">
                          <p className={`text-[10px] font-medium ${
                            emailCheckCode === 'USER_ARCHIVED' ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {emailCheckCode === 'USER_ARCHIVED' && <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {emailCheckCode === 'OTHER_TENANT' && <Ban className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {emailCheckErr}
                          </p>
                          {emailCheckCode === 'USER_ARCHIVED' && archivedUserId && (
                            <button
                              type="button"
                              onClick={handleRestoreUser}
                              disabled={restoringUser}
                              className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${restoringUser ? 'animate-spin' : ''}`} />
                              {restoringUser ? 'Restoring...' : 'Restore User'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        value={newPhone}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPhone(val);
                          // Live phone validation
                          const cleaned = val.replace(/[\s\-()]/g, '');
                          if (!cleaned) {
                            setPhoneError('');
                          } else if (cleaned.startsWith('+')) {
                            if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
                              setPhoneError(cleaned.length > 15 ? 'Too many digits' : 'Include country code + 7-14 digits');
                            } else {
                              setPhoneError('');
                            }
                          } else {
                            if (!/^[6-9]\d{9}$/.test(cleaned)) {
                              setPhoneError(cleaned.length > 10 ? 'Too many digits for Indian number' : cleaned.length < 10 ? '' : 'Must start with 6-9');
                            } else {
                              setPhoneError('');
                            }
                          }
                        }}
                        placeholder="+91 99999 88888"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold" 
                      />
                      {phoneError && (
                        <p className="mt-1 text-[10px] text-red-500 font-medium">{phoneError}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Department</label>
                      <select 
                        value={newDept}
                        onChange={e => {
                          const dept = e.target.value;
                          setNewDept(dept);
                          setNewRole(DEPT_ROLES[dept]?.[0] || '');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold"
                      >
                        <option value="Sales" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Sales</option>
                        <option value="Marketing" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Marketing</option>
                        <option value="Support" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Support</option>
                        <option value="Finance" className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Role Group</label>
                      <select 
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#161616] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-semibold"
                      >
                        {DEPT_ROLES[newDept]?.map(role => (
                          <option key={role} value={role} className="bg-white dark:bg-[#161616] text-slate-800 dark:text-[#F9FAFB]">{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Password</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#0a0a0a] text-[#0F172A] dark:text-[#F9FAFB] outline-none focus:border-blue-500 transition font-mono font-semibold" 
                      />
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(newPassword)}
                        className="p-2 border border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:bg-[#161616] rounded-xl transition"
                      >
                        {copiedPwd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Email credentials notification checkbox */}
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendCreds}
                      onChange={e => setSendCreds(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-200"
                    />
                    <div>
                      <span className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-semibold">Send credentials to Email</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">User will receive an automated email containing login details</p>
                    </div>
                  </label>

                  <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-[#1f1f1f]">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:bg-[#161616] transition text-slate-600"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={checkingEmail || emailAvailable === false || emailCheckCode === 'OTHER_TENANT'}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white transition shadow-sm shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save User
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-out Detail Panel (Drawer) */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50"
              onClick={() => setSelectedUser(null)}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#161616] border-l dark:border-[#1f1f1f] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between bg-slate-50 dark:bg-[#161616]/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs">
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{selectedUser.role} • {selectedUser.department}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub Navigation Tabs inside Drawer */}
              <div className="px-5 border-b border-slate-100 dark:border-[#1f1f1f] flex gap-4 overflow-x-auto bg-slate-50 dark:bg-[#161616]/25">
                {(['Overview', 'Permissions', 'Activity', 'Performance', 'Security'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`py-2.5 text-[11px] font-bold tracking-tight border-b-2 transition ${
                      drawerTab === tab 
                        ? 'border-[#2563EB] text-[#2563EB]' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {drawerTab === 'Overview' && (
                  <div className="space-y-5">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Basic Info</h4>
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#161616]/60 p-3.5 border border-slate-100 dark:border-[#1f1f1f] rounded-xl">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Employee ID</p>
                          <p className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-mono font-bold mt-0.5">{selectedUser.employeeId}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Joined Date</p>
                          <p className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-semibold mt-0.5">{selectedUser.joinedDate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                          <p className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-semibold mt-0.5 truncate">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Contact</p>
                          <p className="text-xs text-[#0F172A] dark:text-[#F9FAFB] font-semibold mt-0.5">{selectedUser.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Activity Summary */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Activity Summary</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] text-center">
                          <p className="text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.loginDays}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Login Days</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] text-center">
                          <p className="text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.actionsPerformed}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Actions</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-100 dark:border-[#1f1f1f] text-center">
                          <p className="text-sm font-extrabold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.leadsHandled}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Leads Handled</p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Overview */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Performance Overview</h4>
                      <div className="bg-slate-50 dark:bg-[#161616]/60 p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Lead Conversion Score</span>
                          <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.conversionRate}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Deals Won / Closed</span>
                          <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">{selectedUser.dealsClosed}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Closed Pipeline Revenue</span>
                          <span className="font-bold text-blue-600">{selectedUser.revenueGenerated}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'Permissions' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Module Access Rights</h4>
                    {[
                      { module: 'Leads & Pipeline', access: 'Write & Read Access', active: true },
                      { module: 'Marketing Campaigns', access: 'Read Only Access', active: true },
                      { module: 'Customer Support Tickets', access: 'No Access', active: false },
                      { module: 'Reports & Analytics', access: 'Full Control', active: true },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 dark:border-[#1f1f1f] rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-[#0F172A] dark:text-[#F9FAFB] block">{item.module}</span>
                          <span className="text-[10px] text-slate-400">{item.access}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${
                          item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {item.active ? 'Granted' : 'Revoked'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {drawerTab === 'Activity' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Recent Action Log</h4>
                    <div className="space-y-3.5 border-l-2 border-slate-100 dark:border-[#1f1f1f] ml-2 pl-4">
                      {[
                        { time: '10 mins ago', desc: 'Updated pipeline stage for Lead "Apex Corp"' },
                        { time: '1 hour ago', desc: 'Initiated login session from Android device (New Delhi)' },
                        { time: 'Yesterday', desc: 'Exported sales conversion statistics as CSV' },
                        { time: '3 days ago', desc: 'Assigned customer support ticket #1204 to Agent Amit' },
                      ].map((item, idx) => (
                        <div key={idx} className="relative space-y-0.5">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-white" />
                          <span className="text-[9px] text-slate-400 font-bold block">{item.time}</span>
                          <p className="text-xs text-slate-700 font-semibold leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {drawerTab === 'Performance' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Performance Trends</h4>
                    <div className="p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50 space-y-4">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-slate-400 font-bold">Target Quota Progress</span>
                          <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">82%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-slate-400 font-bold">Response Speed Index</span>
                          <span className="font-bold text-emerald-600">Fast (4.2m Avg)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'Security' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Security State</h4>
                    <div className="p-4 border border-slate-100 dark:border-[#1f1f1f] rounded-xl bg-slate-50 dark:bg-[#161616]/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Two-Factor Authentication</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full">Enabled</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Active Login Nodes</span>
                        <span className="font-bold text-[#0F172A] dark:text-[#F9FAFB]">1 Session</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Device Type</span>
                        <span className="text-slate-600 font-mono font-bold">Windows (Chrome)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Drawer Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/75 flex gap-2">
                <button 
                  onClick={(e) => { handleResetUserPassword(selectedUser.id, selectedUser.name, e); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-[#161616] text-slate-600 text-xs font-semibold transition"
                >
                  Reset Password
                </button>
                <button 
                  onClick={(e) => { handleToggleBlock(selectedUser.id, selectedUser.status, e); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold transition"
                >
                  {selectedUser.status === 'Blocked' ? 'Unblock Account' : 'Deactivate User'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#121212]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-amber-500 border-t-transparent" />
      </div>
    }>
      <AdminUsersPageContent />
    </Suspense>
  );
}
