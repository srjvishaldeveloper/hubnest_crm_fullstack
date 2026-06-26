'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  User, Mail, Phone, MapPin, Building2, Shield, Edit3, Save, X,
  CheckCircle2, Clock, XCircle, FileText, Upload, Lock,
  Smartphone, Monitor, Globe, Wifi, LogOut, Bell, Sun, Moon,
  Languages, TrendingUp, BadgeCheck, Eye, EyeOff,
  Sparkles, Zap, Activity, Download, Trash2,
  ToggleLeft, ToggleRight, Star, Award, AlertTriangle,
  RefreshCw, Camera, Plus, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileUser {
  id: string; name: string; email: string; admin_id?: string;
  phone?: string; photo_url?: string; language?: string;
  address?: string; bio?: string; date_of_birth?: string;
  emergency_contact?: string; role?: string; company?: string; status?: string;
}

interface Document {
  id: string; name: string; type: string; file_url: string;
  file_size: string; mime_type?: string; status: string; upload_date: string;
}

interface Session {
  id: string; device: string; browser: string; location: string;
  ip: string; current: boolean; lastActive: string;
}

interface LoginEntry {
  id: string; date: string; device: string; status: string;
  ip: string; location: string;
}

export type ProfileTab = 'personal' | 'documents' | 'security' | 'settings';

interface ProfileCoreProps {
  /** Extra tabs to inject BEFORE the standard tabs */
  extraTabs?: { id: string; label: string; icon: React.ElementType; content: React.ReactNode }[];
  /** Role label shown in header badge */
  roleLabel?: string;
  /** Accent color class (Tailwind) e.g. 'rose' | 'blue' | 'emerald' */
  accent?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
    </motion.div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Verified: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700',
    Rejected: 'bg-red-100 text-red-700', Success: 'bg-emerald-100 text-emerald-700',
    Failed: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_TYPES = ['Identity', 'Employment', 'Tax', 'Financial', 'Address', 'Education', 'Medical', 'Other'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileCore({ extraTabs = [], roleLabel, accent = 'blue' }: ProfileCoreProps) {
  const { user: storeUser, setUser, logout } = useAuthStore();

  // ── Profile data ──
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Edit personal ──
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', bio: '', date_of_birth: '', emergency_contact: '' });
  const [saving, setSaving] = useState(false);

  // ── Avatar ──
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Documents ──
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Other');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ── Password ──
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Sessions ──
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  // ── Settings ──
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: false });
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('System');

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Tab ──
  const standardTabs: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'personal',  label: 'Personal',  icon: User    },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'security',  label: 'Security',  icon: Shield  },
    { id: 'settings',  label: 'Settings',  icon: Bell    },
  ];
  const allTabs = [...extraTabs.map(t => ({ id: t.id, label: t.label, icon: t.icon })), ...standardTabs];
  const [activeTab, setActiveTab] = useState(allTabs[0]?.id || 'personal');

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Fetch profile ──
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/auth/profile');
      const u = res.data?.data?.user || res.data?.user;
      if (u) {
        setProfile(u);
        setEditForm({
          name: u.name || '', phone: u.phone || '', address: u.address || '',
          bio: u.bio || '', date_of_birth: u.date_of_birth?.split('T')[0] || '',
          emergency_contact: u.emergency_contact || '',
        });
        setLanguage(u.language === 'hi' ? 'Hindi' : u.language === 'mr' ? 'Marathi' : 'English');
      }
    } catch { /* use storeUser fallback */ } finally { setProfileLoading(false); }
  }, []);

  // ── Fetch documents ──
  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await api.get('/auth/profile/documents');
      setDocuments(res.data?.data?.documents || []);
    } catch { setDocuments([]); } finally { setDocsLoading(false); }
  }, []);

  // ── Fetch sessions ──
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      const res = await api.get(`/auth/active-sessions?currentRefreshToken=${encodeURIComponent(refreshToken)}`);
      const data = res.data?.data || res.data;
      setSessions(data?.sessions || []);
      setLoginHistory(data?.loginHistory || []);
    } catch { } finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (activeTab === 'documents') loadDocuments(); }, [activeTab, loadDocuments]);
  useEffect(() => { if (activeTab === 'security') loadSessions(); }, [activeTab, loadSessions]);

  // ── Save personal info ──
  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', editForm);
      const updated = res.data?.data?.user;
      if (updated) {
        setProfile(prev => ({ ...prev!, ...updated }));
        if (storeUser) setUser({ ...storeUser, name: updated.name, phone: updated.phone, photoUrl: updated.photo_url });
      }
      setIsEditing(false);
      showToast('Profile saved successfully');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to save profile', 'error');
    } finally { setSaving(false); }
  }

  // ── Avatar upload ──
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB', 'error'); return; }
    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await api.post('/auth/profile/avatar', { photo_url: dataUrl });
        const updated = res.data?.data?.user;
        setProfile(prev => ({ ...prev!, photo_url: updated?.photo_url || dataUrl }));
        if (storeUser) setUser({ ...storeUser, photoUrl: updated?.photo_url || dataUrl });
        showToast('Profile photo updated!');
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Upload failed', 'error');
      } finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  // ── Doc file picker ──
  function handleDocFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = ev => setDocPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Upload document ──
  async function handleUploadDoc() {
    if (!docFile || !docName) { showToast('Please select a file and enter a name', 'error'); return; }
    if (docFile.size > 10 * 1024 * 1024) { showToast('File must be under 10 MB', 'error'); return; }
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await api.post('/auth/profile/documents', {
          name: docName, type: docType, file_url: dataUrl,
          file_size: formatBytes(docFile.size), mime_type: docFile.type,
        });
        const doc = res.data?.data?.document;
        if (doc) setDocuments(prev => [doc, ...prev]);
        setShowDocModal(false); setDocName(''); setDocType('Other'); setDocFile(null); setDocPreview(null);
        showToast('Document uploaded successfully');
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Upload failed', 'error');
      } finally { setUploadingDoc(false); }
    };
    reader.readAsDataURL(docFile);
  }

  // ── Delete document ──
  async function handleDeleteDoc(id: string) {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/auth/profile/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      showToast('Document deleted');
    } catch { showToast('Failed to delete document', 'error'); }
  }

  // ── Change password ──
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showToast('Passwords do not match', 'error'); return; }
    if (newPwd.length < 8)    { showToast('Password must be at least 8 characters', 'error'); return; }
    setPwdLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: curPwd, newPassword: newPwd });
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
      showToast('Password changed successfully');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setPwdLoading(false); }
  }

  // ── Revoke session ──
  async function handleRevokeSession(sessionId: string) {
    try {
      await api.post('/auth/revoke-session', { sessionId });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      showToast('Session terminated');
    } catch { showToast('Failed to terminate session', 'error'); }
  }

  const displayUser = profile || storeUser;
  const initials = displayUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const accentGrad = `from-${accent}-500 to-${accent}-700`;
  const accentBorder = `border-${accent}-500`;
  const accentRing = `ring-${accent}-500/20`;

  // ── PERSONAL TAB ──────────────────────────────────────────────────────────
  const personalTab = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Personal Information</h2>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition">
              Cancel
            </button>
          )}
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition
              ${isEditing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'}`}>
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          { key: 'name',              label: 'Full Name',         icon: User,  type: 'text'  },
          { key: 'phone',             label: 'Phone Number',      icon: Phone, type: 'tel'   },
          { key: 'date_of_birth',     label: 'Date of Birth',     icon: Star,  type: 'date'  },
          { key: 'emergency_contact', label: 'Emergency Contact', icon: Phone, type: 'text'  },
        ] as const).map(field => (
          <div key={field.key} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              <field.icon className="w-3.5 h-3.5" />{field.label}
            </label>
            {isEditing ? (
              <input type={field.type} value={(editForm as any)[field.key]}
                onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 transition" />
            ) : (
              <p className="text-sm font-semibold text-[var(--foreground)]">{(profile as any)?.[field.key] || '—'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Read-only fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Email Address', value: displayUser?.email, icon: Mail },
          { label: 'Role',          value: profile?.role || storeUser?.role || roleLabel, icon: BadgeCheck },
          { label: 'Company',       value: profile?.company, icon: Building2 },
          { label: 'Status',        value: profile?.status, icon: Activity },
        ].map((f, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              <f.icon className="w-3.5 h-3.5" />{f.label}
            </label>
            <p className="text-sm font-semibold text-[var(--foreground)]">{f.value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
          <MapPin className="w-3.5 h-3.5" />Address
        </label>
        {isEditing ? (
          <textarea rows={2} value={editForm.address}
            onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 transition resize-none" />
        ) : (
          <p className="text-sm font-semibold text-[var(--foreground)]">{profile?.address || '—'}</p>
        )}
      </div>

      {/* Bio */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
          <User className="w-3.5 h-3.5" />Bio / About
        </label>
        {isEditing ? (
          <textarea rows={3} value={editForm.bio}
            onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us about yourself…"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 transition resize-none" />
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">{profile?.bio || 'No bio added yet.'}</p>
        )}
      </div>
    </div>
  );

  // ── DOCUMENTS TAB ─────────────────────────────────────────────────────────
  const documentsTab = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Documents</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button onClick={() => setShowDocModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition">
          <Plus className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {docsLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-2xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">No documents uploaded yet</p>
          <button onClick={() => setShowDocModal(true)}
            className="mt-3 text-xs font-bold text-blue-600 hover:underline">Upload your first document</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(doc => (
            <motion.div key={doc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 group hover:border-blue-300 transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--foreground)] truncate">{doc.name}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{doc.type} • {doc.file_size}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {new Date(doc.upload_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${statusBadge(doc.status)}`}>{doc.status}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <a href={doc.file_url} download={doc.name} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"><Download className="w-3.5 h-3.5" /></a>
                    <button onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-sm font-black text-[var(--foreground)]">Upload Document</h3>
                <button onClick={() => { setShowDocModal(false); setDocFile(null); setDocPreview(null); setDocName(''); }}
                  className="p-1.5 hover:bg-[var(--accent)] rounded-xl text-[var(--muted-foreground)] transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Document Name *</label>
                  <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Aadhar Card"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-blue-500">
                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">File *</label>
                  <input ref={docInputRef} type="file" className="hidden" onChange={handleDocFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" />
                  <button onClick={() => docInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer">
                    {docPreview ? (
                      <div>
                        {docFile?.type.startsWith('image/') ? (
                          <img src={docPreview} alt="preview" className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
                        ) : (
                          <FileText className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                        )}
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">{docFile?.name}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">{docFile ? formatBytes(docFile.size) : ''}</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-[var(--muted-foreground)]">Click to browse files</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG, DOC up to 10 MB</p>
                      </div>
                    )}
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowDocModal(false); setDocFile(null); setDocPreview(null); setDocName(''); }}
                    className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent)] transition">Cancel</button>
                  <button onClick={handleUploadDoc} disabled={uploadingDoc || !docFile || !docName}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow transition disabled:opacity-50">
                    {uploadingDoc ? <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    {uploadingDoc ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── SECURITY TAB ──────────────────────────────────────────────────────────
  const securityTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-black text-[var(--foreground)] mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-blue-500" />Change Password</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Use a strong password you don't use elsewhere.</p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {([
              { label: 'Current Password', val: curPwd, set: setCurPwd },
              { label: 'New Password',     val: newPwd, set: setNewPwd },
              { label: 'Confirm Password', val: confirmPwd, set: setConfirmPwd },
            ]).map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">{f.label}</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} required
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-blue-500 pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-[var(--muted-foreground)]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={pwdLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow transition disabled:opacity-50 mt-2">
              {pwdLoading ? <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> : null}
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* 2FA */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-black text-[var(--foreground)] mb-1 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" />Two-Factor Authentication</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Add an extra layer of security to your account.</p>
          <div className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Authenticator App</p>
                <p className="text-xs text-[var(--muted-foreground)]">{twoFa ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <button onClick={() => setTwoFa(t => !t)} className="transition-colors">
              {twoFa ? <ToggleRight className="w-9 h-9 text-emerald-500" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
            </button>
          </div>
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${twoFa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {twoFa ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {twoFa ? 'Your account has enhanced 2FA protection.' : 'Enable 2FA to secure your account better.'}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2"><Wifi className="w-4 h-4 text-cyan-500" />Active Sessions</h3>
          <button onClick={loadSessions} className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        {sessionsLoading ? (
          <div className="flex justify-center py-6"><RefreshCw className="w-5 h-5 text-blue-500 animate-spin" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-center text-[var(--muted-foreground)] py-6">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition
                ${s.current ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : 'border-[var(--border)] hover:bg-[var(--accent)]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.current ? 'bg-blue-100' : 'bg-[var(--surface)]'}`}>
                    <Monitor className={`w-4 h-4 ${s.current ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-2">
                      {s.device}
                      {s.current && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">CURRENT</span>}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{s.location} • {s.ip} • {s.lastActive}</p>
                  </div>
                </div>
                {!s.current && (
                  <button onClick={() => handleRevokeSession(s.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 transition">
                    <LogOut className="w-3 h-3" /> Terminate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      {loginHistory.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" />Login History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface)]">
                <tr>{['Date & Time','Device','Location','IP','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loginHistory.map(entry => (
                  <tr key={entry.id} className="hover:bg-[var(--accent)] transition">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">{entry.date}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{entry.device}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{entry.location}</td>
                    <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">{entry.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge(entry.status)}`}>{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ── SETTINGS TAB ──────────────────────────────────────────────────────────
  const settingsTab = (
    <div className="space-y-5">
      {/* Notifications */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <h3 className="text-sm font-black text-[var(--foreground)] mb-1 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" />Notification Preferences</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">Choose how you receive alerts and updates.</p>
        <div className="space-y-3">
          {([
            { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email', icon: Mail },
            { key: 'sms',   label: 'SMS Notifications',   desc: 'Critical alerts via SMS', icon: Smartphone },
            { key: 'push',  label: 'Push Notifications',  desc: 'Browser push notifications', icon: Bell },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 hover:bg-[var(--accent)] transition">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{item.label}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
              </div>
              <button onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}>
                {notifications[item.key] ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Language */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-black text-[var(--foreground)] mb-1 flex items-center gap-2"><Languages className="w-4 h-4 text-cyan-500" />Language</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Select your preferred interface language.</p>
          <div className="space-y-2">
            {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu'].map(lang => (
              <button key={lang} onClick={() => { setLanguage(lang); api.put('/auth/profile', { language: lang.toLowerCase().slice(0,2) }).catch(() => {}); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition
                  ${language === lang ? 'bg-blue-50 border border-blue-300 text-blue-700' : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'}`}>
                {lang} {language === lang && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-black text-[var(--foreground)] mb-1 flex items-center gap-2"><Sun className="w-4 h-4 text-amber-500" />Theme</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Choose how the app looks to you.</p>
          <div className="space-y-2">
            {[
              { v: 'Light',  icon: Sun,     desc: 'Bright and clean' },
              { v: 'Dark',   icon: Moon,    desc: 'Easy on the eyes' },
              { v: 'System', icon: Monitor, desc: 'Follows device setting' },
            ].map(t => (
              <button key={t.v} onClick={() => setTheme(t.v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition
                  ${theme === t.v ? 'bg-blue-50 border border-blue-300 text-blue-700' : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'}`}>
                <t.icon className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-semibold">{t.v}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{t.desc}</p>
                </div>
                {theme === t.v && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[var(--card)] border border-red-200 rounded-2xl p-5">
        <h3 className="text-sm font-black text-red-600 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">These actions are permanent and cannot be undone.</p>
        <button onClick={() => { if (confirm('Sign out of all other devices?')) api.post('/auth/logout-other-devices').then(() => showToast('All other devices signed out')).catch(() => showToast('Failed', 'error')); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition">
          <LogOut className="w-3.5 h-3.5" /> Sign out all other devices
        </button>
      </div>
    </div>
  );

  const tabContent: Record<string, React.ReactNode> = {
    personal: personalTab, documents: documentsTab, security: securityTab, settings: settingsTab,
    ...Object.fromEntries(extraTabs.map(t => [t.id, t.content])),
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      {/* ── PROFILE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {/* Banner */}
        <div className={`h-32 md:h-40 bg-gradient-to-r ${accentGrad} relative`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_60%)]" />
        </div>

        {/* Info row */}
        <div className="px-5 md:px-8 pb-5 -mt-14 md:-mt-16 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl border-4 border-[var(--card)] ring-2 ring-blue-500/30">
              {avatarLoading ? (
                <RefreshCw className="w-8 h-8 animate-spin text-white/80" />
              ) : (profile?.photo_url || storeUser?.photoUrl) ? (
                <img src={profile?.photo_url || storeUser?.photoUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} disabled={avatarLoading}
              className="absolute bottom-1 right-1 w-7 h-7 bg-white border border-slate-200 shadow rounded-lg flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name + meta */}
          <div className="flex-1 pt-1">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                {profileLoading ? (
                  <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
                ) : (
                  <h1 className="text-xl md:text-2xl font-black text-[var(--foreground)]">{displayUser?.name || '—'}</h1>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-blue-500" />{profile?.role || storeUser?.role || roleLabel || '—'}</span>
                  {profile?.company && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-violet-500" />{profile.company}</span>}
                  {displayUser?.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-emerald-500" />{displayUser.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setActiveTab('personal'); setIsEditing(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="flex overflow-x-auto scrollbar-hide gap-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-1.5">
        {allTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${active ? 'bg-blue-600 text-white shadow' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          {tabContent[activeTab] || null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
