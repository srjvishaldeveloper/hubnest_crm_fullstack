'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, MessageSquare, Send, ChevronRight, ChevronLeft, Check,
  Upload, X, Users, Calendar, Clock, Globe, Loader2,
  Sparkles, AlertCircle, CheckCircle2, ArrowLeft, FileText,
  Smartphone, Plus, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Image, Palette, Type,
  Heading1, Heading2, Minus, Code, Quote, Undo2, Redo2,
} from 'lucide-react';
import api from '../../../../services/api';
import TemplateGallery, { type CampaignTemplate } from '../../../../components/marketing/TemplateGallery';

// ─── Types ────────────────────────────────────────────────────────────────────
type CampaignType = 'email' | 'sms' | 'whatsapp';
type BuilderStage = 'type' | 'template' | 'wizard';

interface ContactList {
  id: string;
  name: string;
  contact_count: string | number;
}

interface FieldMapping {
  fileField: string;
  mapTo: string;
}

interface WizardData {
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  listId: string;
  content: string;
  templateId: string;
  sendNow: boolean;
  scheduledAt: string;
  timezone: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
  'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

const CONTACT_FIELDS = ['name', 'email', 'phone', 'company', 'city', 'country', 'notes'];

const TYPE_CONFIG: Record<CampaignType, {
  label: string; icon: React.ElementType; bg: string; shadowColor: string; accentColor: string; textColor: string; desc: string;
}> = {
  email:    { label: 'Email Campaign',    icon: Mail,          bg: 'hover:bg-orange-50', shadowColor: 'hover:shadow-orange-200/50', accentColor: 'bg-orange-100', textColor: 'text-orange-600', desc: 'Rich HTML & text emails with open/click tracking' },
  sms:      { label: 'SMS Campaign',      icon: Smartphone,    bg: 'hover:bg-blue-50', shadowColor: 'hover:shadow-blue-200/50', accentColor: 'bg-blue-100', textColor: 'text-blue-600', desc: 'Instant text messages via Fast2SMS' },
  whatsapp: { label: 'WhatsApp Campaign', icon: MessageSquare, bg: 'hover:bg-green-50', shadowColor: 'hover:shadow-green-200/50', accentColor: 'bg-green-100', textColor: 'text-green-600', desc: 'Conversational WhatsApp messages' },
};

const WIZARD_STEPS = ['Info', 'Recipients', 'Content', 'Schedule'];

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done = current > n;
  const active = current === n;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
        done   ? 'bg-orange-500 border-orange-500 text-white' :
        active ? 'border-orange-500 text-orange-600 bg-white shadow-sm' :
                 'border-gray-200 text-gray-400 bg-white'
      }`}>
        {done ? <Check className="w-4 h-4" /> : n}
      </div>
      <span className={`text-[11px] font-medium ${active ? 'text-orange-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const iCls = (err?: string) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
    err ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100'
  }`;

// ─── Contact Importer ─────────────────────────────────────────────────────────
function ContactImporter({ contactLists, onClose, onImported }: {
  contactLists: ContactList[];
  onClose: () => void;
  onImported: (listId: string, listName: string) => void;
}) {
  const [importMode, setImportMode] = useState<'upload' | 'manual'>('upload');
  const [manualText, setManualText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [targetList, setTargetList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [useNewList, setUseNewList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; listId: string } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim() !== '');
    if (!lines.length) return;
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const hs = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    setHeaders(hs);
    setMappings(hs.map(h => ({
      fileField: h,
      mapTo: CONTACT_FIELDS.find(f => f.toLowerCase() === h.toLowerCase()) || '',
    })));
    setRows(lines.slice(1, 6).map(l => l.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))));
  };

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target?.result as string);
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) handleFile(f);
  };

  useEffect(() => {
    if (importMode === 'manual' && manualText.trim().length > 10) {
      const timer = setTimeout(() => parseCSV(manualText), 500);
      return () => clearTimeout(timer);
    } else if (importMode === 'manual') {
      setHeaders([]); setRows([]);
    }
  }, [manualText, importMode]);

  const handleImport = async () => {
    if ((importMode === 'upload' && !file) || (importMode === 'manual' && !manualText)) return;
    if (!targetList && !newListName) return;
    
    setLoading(true);
    setError('');
    try {
      const text = importMode === 'upload' && file ? await file.text() : manualText;
      const lines = text.trim().split('\n').filter(l => l.trim() !== '');
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const hs = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const contacts = lines.slice(1).map(line => {
        const vals = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        mappings.forEach(m => {
          if (m.mapTo) {
            const idx = hs.indexOf(m.fileField);
            if (idx >= 0) obj[m.mapTo] = vals[idx] || '';
          }
        });
        return obj;
      }).filter(c => c.email || c.phone);

      const resp = await api.post('/marketing/contacts/import', {
        contacts,
        listId: useNewList ? undefined : targetList,
        createList: useNewList,
        listName: useNewList ? newListName : undefined,
      });
      const data = resp.data?.data || resp.data;
      setResult({ imported: data.imported, skipped: data.skipped, listId: data.listId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Import Complete!</h3>
          <p className="text-gray-500 text-sm mt-1">{result.imported} imported · {result.skipped} skipped</p>
        </div>
        <button
          onClick={() => onImported(result.listId, useNewList ? newListName : (contactLists.find(l => l.id === targetList)?.name || ''))}
          className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 shadow-sm"
        >
          Use This List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => { setImportMode('upload'); setHeaders([]); setRows([]); }}
          className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${importMode === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upload File
        </button>
        <button
          onClick={() => { setImportMode('manual'); setHeaders([]); setRows([]); }}
          className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${importMode === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Manual Entry
        </button>
      </div>

      {/* Input area */}
      {importMode === 'upload' ? (
        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            file ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-7 h-7 text-orange-500" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{rows.length}+ rows detected</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setHeaders([]); setRows([]); }} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Drop CSV or XLSX here, or <span className="text-orange-500">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">Must have email or phone column</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-2">Paste your contacts here (comma or tab separated). Include a header row.</p>
          <textarea
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder={"Name, Email, Phone\nJohn Doe, john@example.com, 1234567890\nJane Smith, jane@example.com, 0987654321"}
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all resize-y"
          />
        </div>
      )}

      {/* Field mapping */}
      {headers.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Map Columns</h4>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">File Column</th>
                  <th className="text-left px-4 py-2.5">Sample</th>
                  <th className="text-left px-4 py-2.5">Map To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {headers.map((h, i) => (
                  <tr key={h} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700 font-medium">{h}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[100px]">{rows[0]?.[i] || '—'}</td>
                    <td className="px-4 py-2">
                      <select
                        value={mappings[i]?.mapTo || ''}
                        onChange={e => setMappings(prev => prev.map((m, idx) => idx === i ? { ...m, mapTo: e.target.value } : m))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-400 bg-white"
                      >
                        <option value="">— Skip —</option>
                        {CONTACT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Target list */}
      {headers.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 fill-mode-both">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Add to List</h4>
          <div className="flex gap-3 mb-3">
            <button onClick={() => setUseNewList(false)} className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${!useNewList ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Existing</button>
            <button onClick={() => setUseNewList(true)} className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${useNewList ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Create New</button>
          </div>
          {useNewList ? (
            <input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="New list name…" className={iCls()} />
          ) : (
            <select value={targetList} onChange={e => setTargetList(e.target.value)} className={iCls()}>
              <option value="">Select a list…</option>
              {contactLists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.contact_count})</option>)}
            </select>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
        <button
          onClick={handleImport}
          disabled={((importMode === 'upload' && !file) || (importMode === 'manual' && !manualText)) || (!targetList && !newListName) || loading}
          className="px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 shadow-sm shadow-orange-200 disabled:opacity-40 disabled:shadow-none flex items-center gap-2 transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Import Contacts
        </button>
      </div>
    </div>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
const PERSONALIZATION_TAGS = [
  '{{first_name}}', '{{last_name}}', '{{full_name}}', '{{email}}',
  '{{phone}}', '{{company}}', '{{city}}', '{{deal_value}}', '{{unsubscribe_link}}',
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const COLORS = ['#000000', '#374151', '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

function ToolBtn({
  onClick, title, children, active,
}: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-xs select-none ${
        active ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />;
}

function RichTextEditor({ value, onChange, error }: { value: string; onChange: (val: string) => void; error?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      const text = editorRef.current.innerText || '';
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, [handleInput]);

  const insertTag = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, tag);
    handleInput();
    setShowPersonalization(false);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    exec('createLink', linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`);
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const setFontSize = (size: string) => {
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    const el = editorRef.current?.querySelector('font[size="7"]') as HTMLElement | null;
    if (el) { el.removeAttribute('size'); el.style.fontSize = size; }
    handleInput();
    setShowFontSize(false);
  };

  const setColor = (color: string) => {
    exec('foreColor', color);
    setShowColorPicker(false);
  };

  const insertDivider = () => {
    exec('insertHTML', '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />');
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertHTML', `<img src="${url}" alt="Image" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" />`);
  };

  const insertBlockquote = () => {
    exec('insertHTML', '<blockquote style="border-left:3px solid #F97316;padding:8px 16px;margin:8px 0;background:#fff7ed;color:#92400e;border-radius:0 8px 8px 0;font-style:italic;"></blockquote>');
  };

  const insertCode = () => {
    exec('insertHTML', '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.875em;color:#374151;"></code>');
  };

  return (
    <div className={`border rounded-xl overflow-visible flex flex-col transition-all ${
      error ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100'
    }`}>
      {/* ── Toolbar ── */}
      <div className="bg-gray-50/90 border-b border-gray-100 p-1.5 flex flex-wrap items-center gap-0.5">
        {/* Undo / Redo */}
        <ToolBtn onClick={() => exec('undo')} title="Undo"><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Redo"><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
        <Sep />

        {/* Headings */}
        <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph"><Type className="w-3.5 h-3.5" /></ToolBtn>

        {/* Font size */}
        <div className="relative">
          <ToolBtn onClick={() => { setShowFontSize(v => !v); setShowColorPicker(false); setShowPersonalization(false); setShowLinkInput(false); }} title="Font size">
            <span className="text-[10px] font-bold">Aa</span>
          </ToolBtn>
          {showFontSize && (
            <div className="absolute top-8 left-0 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-1 min-w-[90px]">
              {FONT_SIZES.map(s => (
                <button key={s} type="button" onClick={() => setFontSize(s)}
                  className="w-full text-left px-3 py-1 text-xs hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Text formatting */}
        <ToolBtn onClick={() => exec('bold')} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline"><Underline className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>

        {/* Color */}
        <div className="relative">
          <ToolBtn onClick={() => { setShowColorPicker(v => !v); setShowFontSize(false); setShowPersonalization(false); setShowLinkInput(false); }} title="Text color">
            <Palette className="w-3.5 h-3.5" />
          </ToolBtn>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-2">
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-md border border-white/20 hover:scale-110 transition-transform shadow-sm"
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <Sep />

        {/* Alignment */}
        <ToolBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('justifyFull')} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></ToolBtn>
        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={insertBlockquote} title="Blockquote"><Quote className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={insertCode} title="Inline code"><Code className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={insertDivider} title="Divider line"><Minus className="w-3.5 h-3.5" /></ToolBtn>
        <Sep />

        {/* Link */}
        <div className="relative">
          <ToolBtn onClick={() => { setShowLinkInput(v => !v); setShowColorPicker(false); setShowFontSize(false); setShowPersonalization(false); }} title="Insert link">
            <Link2 className="w-3.5 h-3.5" />
          </ToolBtn>
          {showLinkInput && (
            <div className="absolute top-8 left-0 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-2 flex gap-1.5 min-w-[260px]">
              <input
                autoFocus
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') insertLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                placeholder="https://example.com"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
              />
              <button type="button" onClick={insertLink}
                className="px-2.5 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <ToolBtn onClick={insertImage} title="Insert image"><Image className="w-3.5 h-3.5" /></ToolBtn>
        <Sep />

        {/* Personalization tags */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowPersonalization(v => !v); setShowColorPicker(false); setShowFontSize(false); setShowLinkInput(false); }}
            className="flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100"
          >
            <Sparkles className="w-3 h-3" /> {'{{…}}'}
          </button>
          {showPersonalization && (
            <div className="absolute top-8 right-0 z-30 bg-white rounded-xl border border-gray-200 shadow-lg p-1.5 min-w-[170px]">
              <p className="text-[10px] text-gray-400 font-semibold uppercase px-2 py-1 tracking-wider">Insert Variable</p>
              {PERSONALIZATION_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => insertTag(tag)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg font-mono transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Editor area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder="Start writing your email content here… Use the toolbar above to format, or click {{…}} to insert personalization variables."
        className="p-4 min-h-[280px] max-h-[480px] overflow-y-auto outline-none text-sm text-gray-800 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-orange-500 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-orange-400 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:rounded [&_code]:font-mono empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
      />

      {/* ── Footer: word count + HTML toggle ── */}
      <div className="px-3 py-1.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        <button
          type="button"
          onClick={() => {
            const html = editorRef.current?.innerHTML || '';
            const view = prompt('Current HTML (edit carefully):', html);
            if (view !== null && editorRef.current) {
              editorRef.current.innerHTML = view;
              handleInput();
            }
          }}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-mono"
        >
          {'</> HTML'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignBuilderPage() {
  const router = useRouter();

  const [stage, setStage] = useState<BuilderStage>('type');
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [emailEditorMode, setEmailEditorMode] = useState<'rich' | 'html'>('rich');
  const [launching, setLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({});
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '', subject: '', senderName: '', senderEmail: '',
    listId: '', content: '', templateId: '', sendNow: true,
    scheduledAt: '', timezone: 'Asia/Kolkata',
  });

  const setField = (k: keyof WizardData, v: string | boolean) =>
    setWizardData(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    api.get('/marketing/lists')
      .then(r => setContactLists(r.data?.data?.lists || r.data?.lists || []))
      .catch(() => setContactLists([]));
  }, []);

  // ── Template selection ────────────────────────────────────────────────────
  const handleSelectTemplate = (tpl: CampaignTemplate) => {
    setWizardData(prev => ({ ...prev, content: tpl.html_content || '', templateId: tpl.id }));
    setStage('wizard');
    setWizardStep(1);
  };

  const handleStartBlank = () => {
    setWizardData(prev => ({ ...prev, content: '', templateId: '' }));
    setStage('wizard');
    setWizardStep(1);
  };

  useEffect(() => {
    if (stage === 'template' && selectedType === 'whatsapp') {
      handleStartBlank();
    }
  }, [stage, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const errs: Partial<Record<keyof WizardData, string>> = {};
    if (s === 1) {
      if (!wizardData.name.trim()) errs.name = 'Campaign name is required';
      if (selectedType === 'email' && !wizardData.subject.trim()) errs.subject = 'Subject line is required';
      if (!wizardData.senderName.trim()) errs.senderName = 'Sender name is required';
    }
    if (s === 2) {
      if (!wizardData.listId) errs.listId = 'Please select a contact list';
    }
    if (s === 3) {
      if (!wizardData.content.trim()) errs.content = 'Content cannot be empty';
    }
    if (s === 4 && !wizardData.sendNow && !wizardData.scheduledAt) {
      errs.scheduledAt = 'Please pick a date and time';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validate(wizardStep)) setWizardStep(s => Math.min(s + 1, 4)); };
  const prevStep = () => { setErrors({}); setWizardStep(s => Math.max(s - 1, 1)); };

  const handleLaunch = async () => {
    if (!validate(4)) return;
    setLaunching(true);
    try {
      const payload = {
        name: wizardData.name,
        type: selectedType,
        platform: selectedType,
        status: wizardData.sendNow ? 'Active' : 'Scheduled',
        content: {
          subject: wizardData.subject,
          from_name: wizardData.senderName,
          from_email: wizardData.senderEmail,
          body: wizardData.content,
          list_id: wizardData.listId,
          template_id: wizardData.templateId,
        },
        schedule_config: wizardData.sendNow ? {} : {
          scheduled_at: wizardData.scheduledAt,
          timezone: wizardData.timezone,
        },
      };
      const resp = await api.post('/marketing/campaigns', payload);
      const cId = resp.data?.data?.campaign?.id || resp.data?.campaign?.id;
      if (wizardData.sendNow && cId) {
        await api.post(`/marketing/campaigns/${cId}/send`).catch(() => null);
      }
      setLaunchSuccess(true);
      setTimeout(() => router.push('/marketing/campaigns'), 2200);
    } catch {
      setErrors({ name: 'Failed to launch campaign. Please try again.' });
    } finally {
      setLaunching(false);
    }
  };

  const selectedList = contactLists.find(l => l.id === wizardData.listId);

  // ── Page header title ─────────────────────────────────────────────────────
  const headerTitle = stage === 'type' ? 'Campaign Builder' :
    stage === 'template' ? 'Choose Template' : 'Campaign Setup';

  const headerSubtitle = stage === 'type' ? 'Choose your campaign channel' :
    stage === 'template' ? `${selectedType === 'email' ? 'Email' : 'SMS'} templates` : WIZARD_STEPS[wizardStep - 1];

  // ── Launch success ─────────────────────────────────────────────────────────
  if (launchSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Campaign Launched!</h2>
        <p className="text-gray-400 text-sm">Redirecting to campaigns…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (stage === 'type') router.push('/marketing/campaigns');
                else if (stage === 'template') setStage('type');
                else if (selectedType === 'whatsapp') setStage('type');
                else { setStage('template'); setWizardStep(1); }
              }}
              className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{headerTitle}</h1>
              <p className="text-xs text-gray-400">{headerSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all"
          >
            <Upload className="w-4 h-4" /> Import Contacts
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">

        {/* ── Stage 0: Campaign Type ─────────────────────────────────────── */}
        {stage === 'type' && (
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-orange-100">
                <Sparkles className="w-3.5 h-3.5" /> New Campaign
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">What would you like to send?</h2>
              <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">Choose a channel below. You&apos;ll pick a template in the next step.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {(Object.entries(TYPE_CONFIG) as [CampaignType, typeof TYPE_CONFIG[CampaignType]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedType(key); setStage('template'); }}
                    className={`group relative flex flex-col items-center gap-4 p-7 rounded-3xl border border-gray-200 bg-white ${cfg.bg} hover:border-transparent ${cfg.shadowColor} hover:shadow-2xl transition-all duration-300 text-center overflow-hidden`}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${cfg.accentColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${cfg.textColor}`} />
                    </div>
                    <div className="relative z-10 flex-1">
                      <h3 className="text-base font-extrabold text-gray-900 tracking-tight">{cfg.label}</h3>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{cfg.desc}</p>
                    </div>
                    <div className="w-full pt-4 border-t border-gray-100 text-sm font-semibold text-orange-500 flex items-center justify-center gap-1.5">
                      Select <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Stage 1: Template Gallery ──────────────────────────────────── */}
        {stage === 'template' && selectedType && selectedType !== 'whatsapp' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 min-h-[600px] flex flex-col">
            <TemplateGallery
              campaignType={selectedType as 'email' | 'sms'}
              onSelectTemplate={handleSelectTemplate}
              onStartBlank={handleStartBlank}
            />
          </div>
        )}

        {/* WhatsApp: skip template gallery, go straight to wizard — handled via useEffect below */}

        {/* ── Stage 2: Campaign Wizard ───────────────────────────────────── */}
        {stage === 'wizard' && selectedType && (
          <div className="max-w-2xl mx-auto pb-4">
            {/* Stepper */}
            <div className="relative flex items-start justify-between mb-10">
              {/* Connecting line layer */}
              <div className="absolute top-4 left-0 right-0 flex px-4">
                {WIZARD_STEPS.slice(0, -1).map((_, i) => (
                  <div key={i} className="flex-1 flex items-center">
                    <div className={`flex-1 h-0.5 transition-colors duration-300 ${wizardStep > i + 1 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                  </div>
                ))}
              </div>
              {/* Step dots */}
              {WIZARD_STEPS.map((label, i) => (
                <StepDot key={label} n={i + 1} current={wizardStep} label={label} />
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {wizardStep}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">{WIZARD_STEPS[wizardStep - 1]}</h3>
                  <p className="text-xs text-gray-400">
                    {wizardStep === 1 && 'Basic campaign information'}
                    {wizardStep === 2 && 'Who receives this campaign'}
                    {wizardStep === 3 && 'Edit your campaign content'}
                    {wizardStep === 4 && 'When should this go out'}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700`}>
                  {TYPE_CONFIG[selectedType].label}
                </span>
              </div>

              <div className="px-8 py-6 space-y-5">
                {/* ── Step 1: Info ── */}
                {wizardStep === 1 && (
                  <>
                    <Field label="Campaign Name" required error={errors.name}>
                      <input value={wizardData.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Summer Sale 2025" className={iCls(errors.name)} />
                    </Field>
                    {selectedType === 'email' && (
                      <Field label="Subject Line" required error={errors.subject}>
                        <input value={wizardData.subject} onChange={e => setField('subject', e.target.value)} placeholder="Exclusive Summer Deals — Up to 40% off!" className={iCls(errors.subject)} />
                      </Field>
                    )}
                    <div className={`grid gap-4 ${selectedType === 'email' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <Field label="Sender Name" required error={errors.senderName}>
                        <input value={wizardData.senderName} onChange={e => setField('senderName', e.target.value)} placeholder="HubNest Marketing" className={iCls(errors.senderName)} />
                      </Field>
                      {selectedType === 'email' && (
                        <Field label="Sender Email">
                          <input value={wizardData.senderEmail} onChange={e => setField('senderEmail', e.target.value)} placeholder="hello@yourbrand.com" className={iCls()} />
                        </Field>
                      )}
                    </div>
                  </>
                )}

                {/* ── Step 2: Recipients ── */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <Field label="Contact List" required error={errors.listId}>
                      <select value={wizardData.listId} onChange={e => setField('listId', e.target.value)} className={iCls(errors.listId)}>
                        <option value="">Select a contact list…</option>
                        {contactLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </Field>
                    {selectedList && (
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{selectedList.name}</p>
                          <p className="text-xs text-gray-500">{selectedList.contact_count} contacts</p>
                        </div>
                      </div>
                    )}
                    <button onClick={() => setShowImporter(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
                      <Plus className="w-4 h-4" /> Import contacts
                    </button>
                  </div>
                )}

                {/* ── Step 3: Content ── */}
                {wizardStep === 3 && (
                  <div>
                    {selectedType === 'email' ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">Email Content <span className="text-orange-500">*</span></label>
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setEmailEditorMode('rich')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${emailEditorMode === 'rich' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Rich Text</button>
                            <button onClick={() => setEmailEditorMode('html')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${emailEditorMode === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>HTML</button>
                          </div>
                        </div>
                        {emailEditorMode === 'rich' ? (
                          <RichTextEditor value={wizardData.content} onChange={val => setField('content', val)} error={errors.content} />
                        ) : (
                          <>
                            <textarea
                              value={wizardData.content}
                              onChange={e => setField('content', e.target.value)}
                              rows={12}
                              placeholder="Paste or write your HTML email here…"
                              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-y transition-all ${errors.content ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'}`}
                            />
                            {wizardData.content.trimStart().startsWith('<') && (
                              <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
                                <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-b border-gray-100">Live preview</p>
                                <iframe srcDoc={wizardData.content} className="w-full h-48" title="preview" sandbox="allow-same-origin" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-sm font-medium text-gray-700">Message <span className="text-orange-500">*</span></label>
                          <span className={`text-xs font-medium ${wizardData.content.length > 140 ? 'text-rose-500' : 'text-gray-400'}`}>
                            {wizardData.content.length}/160
                          </span>
                        </div>
                        <textarea
                          value={wizardData.content}
                          onChange={e => setField('content', e.target.value)}
                          rows={5}
                          maxLength={160}
                          placeholder="Write your SMS message…"
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none transition-all ${errors.content ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100'}`}
                        />
                        {wizardData.content.length > 140 && (
                          <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> May be split into multiple SMS</p>
                        )}
                      </div>
                    )}
                    {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                  </div>
                )}

                {/* ── Step 4: Schedule ── */}
                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {([['sendNow', true, 'Send Now', 'Dispatch immediately', Send],
                         ['sendNow', false, 'Schedule', 'Pick date & time', Calendar]] as const).map(([, val, title, sub, Icon]) => (
                        <button
                          key={title}
                          onClick={() => setField('sendNow', val)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${(val ? wizardData.sendNow : !wizardData.sendNow) ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${(val ? wizardData.sendNow : !wizardData.sendNow) ? 'bg-orange-500' : 'bg-gray-100'}`}>
                            <Icon className={`w-4 h-4 ${(val ? wizardData.sendNow : !wizardData.sendNow) ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{title}</p>
                            <p className="text-[11px] text-gray-400">{sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {!wizardData.sendNow && (
                      <div className="space-y-4">
                        <Field label="Send Date & Time" required error={errors.scheduledAt}>
                          <div className="relative">
                            <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="datetime-local"
                              value={wizardData.scheduledAt}
                              onChange={e => setField('scheduledAt', e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              className={`${iCls(errors.scheduledAt)} pl-9`}
                            />
                          </div>
                        </Field>
                        <Field label="Timezone">
                          <div className="relative">
                            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select value={wizardData.timezone} onChange={e => setField('timezone', e.target.value)} className={`${iCls()} pl-9`}>
                              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                            </select>
                          </div>
                        </Field>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campaign Summary</p>
                      {[
                        ['Name', wizardData.name || '—'],
                        ['Type', TYPE_CONFIG[selectedType].label],
                        ['Recipients', selectedList ? `${selectedList.name} (${selectedList.contact_count})` : '—'],
                        ['Send', wizardData.sendNow ? 'Immediately' : wizardData.scheduledAt ? new Date(wizardData.scheduledAt).toLocaleString() : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-medium text-gray-800">{v}</span>
                        </div>
                      ))}
                    </div>

                    {errors.name && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between">
                <button
                  onClick={wizardStep === 1
                    ? () => selectedType === 'whatsapp' ? setStage('type') : setStage('template')
                    : prevStep}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {wizardStep === 1 ? (selectedType === 'whatsapp' ? 'Back' : 'Back to Templates') : 'Back'}
                </button>
                {wizardStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 shadow-sm shadow-orange-200 transition-colors"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    disabled={launching}
                    className="flex items-center gap-2 px-7 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 shadow-sm shadow-orange-200 transition-colors disabled:opacity-50"
                  >
                    {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {wizardData.sendNow ? 'Launch Campaign' : 'Schedule Campaign'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Contact Importer Modal ─────────────────────────────────────────── */}
      {showImporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowImporter(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center"><Upload className="w-4 h-4 text-white" /></div>
                <div>
                  <h3 className="font-bold text-gray-900">Import Contacts</h3>
                  <p className="text-xs text-gray-400">CSV or Excel file</p>
                </div>
              </div>
              <button onClick={() => setShowImporter(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5">
              <ContactImporter
                contactLists={contactLists}
                onClose={() => setShowImporter(false)}
                onImported={(listId, listName) => {
                  setContactLists(prev =>
                    prev.find(l => l.id === listId)
                      ? prev
                      : [...prev, { id: listId, name: listName, contact_count: 0 }]
                  );
                  setField('listId', listId);
                  setShowImporter(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
