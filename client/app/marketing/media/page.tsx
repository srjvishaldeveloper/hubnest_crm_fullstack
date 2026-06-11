'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon, FileText, Video, File, Upload, Trash2,
  Search, Copy, Loader2, X, Plus, HardDrive, Filter
} from 'lucide-react';
import api from '../../../services/api';

type MediaFilter = 'all' | 'image' | 'video' | 'document';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  url?: string;
  file_url?: string;
  size?: number;
  file_size?: number;
  uploaded_at?: string;
  created_at?: string;
}

const filterOptions: { key: MediaFilter; label: string }[] = [
  { key: 'all', label: 'All Files' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'document', label: 'Documents' },
];

function getFileIcon(type: string) {
  if (type?.startsWith('image') || type === 'image') return ImageIcon;
  if (type?.startsWith('video') || type === 'video') return Video;
  return FileText;
}

function getFileColor(type: string): string {
  if (type?.startsWith('image') || type === 'image') return 'bg-blue-50 dark:bg-blue-900/20 text-blue-500';
  if (type?.startsWith('video') || type === 'video') return 'bg-purple-50 dark:bg-purple-900/20 text-purple-500';
  return 'bg-orange-50 dark:bg-orange-900/20 text-orange-500';
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('image');

  useEffect(() => { fetchMedia(); }, []);

  async function fetchMedia() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/media');
      const data = res.data?.media || res.data?.data || res.data || [];
      setMedia(Array.isArray(data) ? data : []);
    } catch { setMedia([]); } finally { setLoading(false); }
  }

  function handleFileSelect(f: File) {
    setUploadFile(f);
    setUploadName(f.name.split('.')[0]);
    if (f.type.startsWith('image')) setUploadType('image');
    else if (f.type.startsWith('video')) setUploadType('video');
    else setUploadType('document');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const mockUrl = `https://media.hubnest.io/${Date.now()}-${uploadName}`;
      const payload = { name: uploadName, type: uploadType, url: mockUrl, size: uploadFile?.size || 0 };
      const res = await api.post('/marketing/media', payload);
      const nm = res.data?.media || res.data?.data || { id: `m-${Date.now()}`, ...payload, file_url: mockUrl, file_size: uploadFile?.size || 0 };
      setMedia([nm, ...media]);
      setShowModal(false);
      setUploadFile(null); setUploadName(''); setUploadType('image');
    } catch {
      const nm: MediaItem = { id: `m-${Date.now()}`, name: uploadName, type: uploadType, url: '', file_url: '', size: uploadFile?.size || 0, file_size: uploadFile?.size };
      setMedia([nm, ...media]);
      setShowModal(false);
      setUploadFile(null); setUploadName(''); setUploadType('image');
    } finally { setUploading(false); }
  }

  function handleDelete(id: string) {
    // Optimistic UI — no backend route needed per spec
    setMedia(media.filter(m => m.id !== id));
  }

  function handleCopyUrl(item: MediaItem) {
    const url = item.url || item.file_url || '';
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = media.filter(m => {
    const matchFilter = filter === 'all' || (m.type || '').toLowerCase().includes(filter);
    const matchSearch = (m.name || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalSize = media.reduce((a, m) => a + (m.size || m.file_size || 0), 0);
  const images = media.filter(m => (m.type || '').includes('image')).length;
  const videos = media.filter(m => (m.type || '').includes('video')).length;
  const docs = media.length - images - videos;

  const stats = [
    { label: 'Total Files', value: media.length, color: 'text-indigo-600' },
    { label: 'Images', value: images, color: 'text-blue-600' },
    { label: 'Documents', value: docs, color: 'text-orange-600' },
    { label: 'Total Storage', value: formatSize(totalSize), color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Media Library</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Manage all your marketing assets in one place</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <Upload className="w-4 h-4" /> Upload Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-1 bg-white dark:bg-[#161616] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl p-1 shadow-sm">
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${filter === f.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
            className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No media files found</p>
          <p className="text-xs text-slate-400 mt-1">Upload your first asset to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filtered.map((item) => {
            const Icon = getFileIcon(item.type);
            const iconColor = getFileColor(item.type);
            const url = item.url || item.file_url;
            const size = item.size || item.file_size;
            return (
              <div key={item.id} className="group bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm overflow-hidden flex flex-col">
                {/* Thumbnail */}
                <div className="aspect-square relative bg-slate-50 dark:bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
                  {(item.type?.startsWith('image') || item.type === 'image') && url ? (
                    <img src={url} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                    <button onClick={() => handleCopyUrl(item)} title="Copy URL"
                      className="p-1.5 bg-white dark:bg-[#161616] rounded-lg shadow-sm hover:bg-slate-100 transition">
                      <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-[#ededed]" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} title="Delete"
                      className="p-1.5 bg-white dark:bg-[#161616] rounded-lg shadow-sm hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                  {copied === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-lg">Copied!</span>
                    </div>
                  )}
                </div>
                {/* Meta */}
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-[#ededed] truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400">{(item.type || '').split('/')[1]?.toUpperCase() || (item.type || '').toUpperCase() || 'FILE'}</span>
                    <span className="text-[10px] text-slate-400">{formatSize(size)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Upload Asset</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* Drag & Drop zone */}
              <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center gap-2 ${dragging ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' : 'border-slate-300 dark:border-[#2a2a2a] hover:border-indigo-400'}`}>
                <Upload className="w-8 h-8 text-slate-400" />
                {uploadFile ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-[#ededed]">{uploadFile.name}</p>
                    <p className="text-xs text-slate-400">{formatSize(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-[#ededed]">Drop file here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-0.5">Images, videos, PDFs up to 50MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} className="hidden" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Asset Name</label>
                <input required value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. hero-banner-q4"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Type</label>
                <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
