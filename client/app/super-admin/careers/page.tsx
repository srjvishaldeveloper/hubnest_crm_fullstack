'use client';

import { useEffect, useState } from 'react';
import api from '../../../services/api';
import {
  Briefcase, Plus, Search, Pencil, Trash2, Users,
  MapPin, Clock, Building2, Filter, ChevronDown,
  Eye, X, Check, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';

interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  description: string;
  requirements: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'Active' | 'Closed' | 'Draft';
  applicationsCount: number;
  postedAt: string;
  closingDate?: string;
}

const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Support',
  'Operations', 'Design', 'Product', 'Legal', 'Leadership'
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Contract'];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border border-green-200',
  Closed: 'bg-red-50 text-red-700 border border-red-200',
  Draft: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
};

const TYPE_COLORS: Record<string, string> = {
  'Full-time': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Part-time': 'bg-purple-50 text-purple-700 border border-purple-200',
  'Remote': 'bg-teal-50 text-teal-700 border border-teal-200',
  'Contract': 'bg-orange-50 text-orange-700 border border-orange-200',
};

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-[#1f1f1f]">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + i * 5}%` }} />
        </td>
      ))}
    </tr>
  );
}

interface ModalProps {
  job: Partial<Career> | null;
  onClose: () => void;
  onSave: (job: Partial<Career>) => Promise<void>;
  isEditing: boolean;
}

function JobModal({ job, onClose, onSave, isEditing }: ModalProps) {
  const [form, setForm] = useState<Partial<Career>>(
    job || {
      title: '',
      department: DEPARTMENTS[0],
      location: '',
      type: 'Full-time',
      description: '',
      requirements: '',
      salaryMin: undefined,
      salaryMax: undefined,
      status: 'Active',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.department || !form.location) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save job posting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F9FAFB]">
              {isEditing ? 'Edit Job Posting' : 'Post New Job'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Update this career opportunity' : 'Create a new career opportunity on the platform'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Job Title *</label>
            <input
              required
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
            />
          </div>

          {/* Department + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Department *</label>
              <select
                value={form.department || ''}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 outline-none bg-white"
              >
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Job Type *</label>
              <select
                value={form.type || 'Full-time'}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 outline-none bg-white"
              >
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Location + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Location *</label>
              <input
                required
                type="text"
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Mumbai, India / Remote"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Status</label>
              <select
                value={form.status || 'Active'}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 outline-none bg-white"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Min Salary (₹/year)</label>
              <input
                type="number"
                value={form.salaryMin || ''}
                onChange={(e) => setForm({ ...form, salaryMin: Number(e.target.value) || undefined })}
                placeholder="e.g. 600000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Max Salary (₹/year)</label>
              <input
                type="number"
                value={form.salaryMax || ''}
                onChange={(e) => setForm({ ...form, salaryMax: Number(e.target.value) || undefined })}
                placeholder="e.g. 1200000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Job Description *</label>
            <textarea
              required
              rows={4}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition resize-none"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Requirements</label>
            <textarea
              rows={3}
              value={form.requirements || ''}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="List skills, experience, and qualifications required for this role..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition resize-none"
            />
          </div>

          {/* Closing Date */}
          <div>
            <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">Application Closing Date</label>
            <input
              type="date"
              value={form.closingDate || ''}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200/60 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:bg-[#161616] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F59E0B] text-white text-sm font-semibold hover:bg-amber-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isEditing ? 'Update Posting' : 'Post Job'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Career | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/super-admin/careers');
      setJobs(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load career postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSave = async (form: Partial<Career>) => {
    if (editingJob) {
      await api.put(`/super-admin/careers/${editingJob.id}`, form);
    } else {
      await api.post('/super-admin/careers', form);
    }
    await fetchJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    setDeleting(id);
    try {
      await api.delete(`/super-admin/careers/${id}`);
      await fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete job posting.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || j.status === statusFilter;
    const matchDept = deptFilter === 'All' || j.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === 'Active').length,
    closed: jobs.filter((j) => j.status === 'Closed').length,
    totalApplications: jobs.reduce((acc, j) => acc + (j.applicationsCount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">Career Management</h1>
          <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mt-1">
            Manage job postings, track applications, and build your team.
          </p>
        </div>
        <button
          onClick={() => { setEditingJob(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F59E0B] text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Postings', value: stats.total, icon: Briefcase, color: 'text-[#F59E0B] bg-amber-50' },
          { label: 'Active Jobs', value: stats.active, icon: Check, color: 'text-green-600 bg-green-50' },
          { label: 'Closed Jobs', value: stats.closed, icon: X, color: 'text-red-600 bg-red-50' },
          { label: 'Applications', value: stats.totalApplications, icon: Users, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] font-medium">{label}</p>
                <p className="text-xl font-bold text-[#0F172A] dark:text-[#F9FAFB]">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, department, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-amber-400 outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-amber-400 outline-none bg-white"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            onClick={fetchJobs}
            className="px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1">Failed to Load Data</p>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-[#F59E0B] text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1f1f1f] bg-slate-50 dark:bg-[#161616]/60">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Title</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Applications</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posted</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                          <Briefcase className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1">No Job Postings Found</p>
                        <p className="text-xs text-slate-500 mb-4">
                          {search || statusFilter !== 'All' || deptFilter !== 'All'
                            ? 'Try adjusting your filters'
                            : 'Create your first career posting to attract talent'}
                        </p>
                        {!search && statusFilter === 'All' && deptFilter === 'All' && (
                          <button
                            onClick={() => { setEditingJob(null); setShowModal(true); }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition"
                          >
                            <Plus className="w-4 h-4" />
                            Post First Job
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100 dark:border-[#1f1f1f] hover:bg-slate-50 dark:bg-[#161616]/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-[#F59E0B]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A] dark:text-[#F9FAFB] text-[13px]">{job.title}</p>
                            {job.salaryMin && job.salaryMax && (
                              <p className="text-[11px] text-slate-400">
                                ₹{(job.salaryMin / 100000).toFixed(1)}L – ₹{(job.salaryMax / 100000).toFixed(1)}L/yr
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-[#F9FAFB] text-[13px]">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {job.department}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-[#F9FAFB] text-[13px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {job.location}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_COLORS[job.type] || ''}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {job.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F172A] dark:text-[#F9FAFB]">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {job.applicationsCount || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[job.status]}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500">
                        {job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditingJob(job); setShowModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-[#F59E0B] hover:bg-amber-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(job.id)}
                            disabled={deleting === job.id}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Modal */}
      {showModal && (
        <JobModal
          job={editingJob}
          onClose={() => { setShowModal(false); setEditingJob(null); }}
          onSave={handleSave}
          isEditing={!!editingJob}
        />
      )}
    </div>
  );
}
