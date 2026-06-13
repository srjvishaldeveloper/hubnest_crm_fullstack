'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Plus, Sparkles, Trash2, Edit2, Code, Eye, Loader2,
  CheckCircle, X, BarChart2, Clock, ToggleLeft, ToggleRight, Search,
  Link2, Check, Save, ExternalLink, Copy, Plus as PlusIcon, Minus, GripVertical
} from 'lucide-react';
import api from '../../../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const FORM_TYPES = ['Lead Capture', 'Survey', 'Registration', 'Newsletter', 'Contact'];
const FIELD_TYPES = ['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'url'];

const typeBadgeColor: Record<string, string> = {
  'Lead Capture': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Survey': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Registration': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Newsletter': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Contact': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

interface FormField {
  id?: string;
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  type: string;
  description?: string;
  campaign_id?: string | null;
  fields?: FormField[];
  settings?: Record<string, string>;
  submission_count?: number;
  last_submission?: string;
  is_embedded?: boolean;
  completion_rate?: number;
}

interface Submission {
  id: string;
  submitted_at: string;
  data: Record<string, unknown>;
  submission_data?: Record<string, unknown>;
}

// ─── Shared Field Editor ────────────────────────────────────────────────────────
function FieldEditor({ fields, setFields }: { fields: FormField[], setFields: React.Dispatch<React.SetStateAction<FormField[]>> }) {
  const addField = () => {
    const ts = Date.now();
    setFields(prev => [...prev, { name: `field_${ts}`, label: '', placeholder: '', type: 'text', required: false }]);
  };

  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx));

  const updateField = (idx: number, patch: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...patch };
      // Auto-sync name from label so submission data has meaningful keys
      if (patch.label !== undefined) {
        const slug = patch.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        updated.name = slug || `field_${Date.now()}`;
      }
      return updated;
    }));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFields(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Fields ({fields.length})</label>
        <button type="button" onClick={addField}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
          <PlusIcon className="w-3.5 h-3.5" /> Add Field
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-[#1f1f1f] rounded-xl">
          <p className="text-xs text-slate-400">No fields yet. Click "Add Field" to start building.</p>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {fields.map((field, idx) => (
                <Draggable key={field.name || `field-${idx}`} draggableId={field.name || `field-${idx}`} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-slate-50 dark:bg-[#0d0d0d] rounded-xl p-3 border ${snapshot.isDragging ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 dark:border-[#1f1f1f]'} space-y-3 transition bg-white dark:bg-[#161616]`}
                    >
                      <div className="flex items-center gap-2">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing hover:text-indigo-500 p-1 bg-slate-100 dark:bg-[#222] rounded-md transition">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-5">{idx + 1}</span>
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Label</p>
                            <input value={field.label || ''} onChange={e => updateField(idx, { label: e.target.value })}
                              placeholder="Field Label"
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-400 text-slate-800 dark:text-[#ededed]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Type</p>
                            <select value={field.type || 'text'} onChange={e => updateField(idx, { type: e.target.value })}
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-400 text-slate-800 dark:text-[#ededed]">
                              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Placeholder</p>
                            <input value={field.placeholder || ''} onChange={e => updateField(idx, { placeholder: e.target.value })}
                              placeholder="Hint text..."
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-400 text-slate-800 dark:text-[#ededed]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-[#0d0d0d] p-1.5 rounded-lg border border-slate-200 dark:border-[#1f1f1f] hover:border-indigo-300 transition">
                            <input type="checkbox" checked={!!field.required} onChange={e => updateField(idx, { required: e.target.checked })} className="w-3.5 h-3.5 accent-indigo-600" />
                            <span className="text-[10px] font-semibold text-slate-500">Req.</span>
                          </label>
                          <button type="button" onClick={() => removeField(idx)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition border border-transparent hover:border-red-200 dark:hover:border-red-800">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="pl-10">
                          <p className="text-[10px] font-semibold text-slate-400 mb-1">Options (comma-separated)</p>
                          <input
                            value={(field.options || []).join(', ')}
                            onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-indigo-400 text-slate-800 dark:text-[#ededed]" />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// ─── Embed Modal ──────────────────────────────────────────────────────────────
function EmbedModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const shareUrl = `${origin}/public/form/${form.id}`;

  const iframeCode = `<iframe
  src="${shareUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);"
  title="${form.name}"
></iframe>`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Share & Embed</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">{form.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Direct Link */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Direct Link</label>
            <div className="flex items-center gap-2">
              <input readOnly value={shareUrl}
                className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none" />
              <button onClick={() => copy(shareUrl)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shrink-0">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                className="p-2.5 border border-slate-200 dark:border-[#1f1f1f] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Embed Code (iframe)</label>
            <div className="relative">
              <textarea readOnly value={iframeCode} rows={6}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none resize-none" />
              <button onClick={() => copy(iframeCode)}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#333] text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-[#666]">
              Paste this code into any HTML page or website builder to embed the form.
            </p>
          </div>
        </div>
        <div className="p-5 pt-0">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Form Modal ──────────────────────────────────────────────────────────
function EditFormModal({
  form,
  campaigns,
  onClose,
  onSaved,
}: {
  form: Form;
  campaigns: {id: string, name: string}[];
  onClose: () => void;
  onSaved: (updated: Form) => void;
}) {
  const [name, setName] = useState(form.name);
  const [type, setType] = useState(form.type || 'Lead Capture');
  const [campaignId, setCampaignId] = useState(form.campaign_id || '');
  const [description, setDescription] = useState(form.description || '');
  const [submitText, setSubmitText] = useState(form.settings?.submitText || 'Submit');
  const [successMessage, setSuccessMessage] = useState(form.settings?.successMessage || 'Thank you! Your submission has been received.');
  const [redirectUrl, setRedirectUrl] = useState(form.settings?.redirectUrl || '');
  const [isActive, setIsActive] = useState(form.settings?.status !== 'inactive');
  
  const [fields, setFields] = useState<FormField[]>(() => {
    const raw = form.fields;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    return arr;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/marketing/forms/${form.id}`, {
        name,
        type,
        campaign_id: campaignId || null,
        description,
        fields,
        settings: { ...(form.settings || {}), type, submitText, successMessage, redirectUrl, status: isActive ? 'active' : 'inactive' },
      });
      const updated = res.data?.data?.form || res.data?.data || res.data?.form || res.data;
      onSaved({ ...form, name, type, campaign_id: campaignId, description, fields, settings: { ...form.settings, submitText, successMessage, redirectUrl, status: isActive ? 'active' : 'inactive' }, ...updated });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f] sticky top-0 bg-white dark:bg-[#161616] z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Edit Form</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">{form.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isActive ? 'Active' : 'Inactive'}</span>
              <button type="button" onClick={() => setIsActive(!isActive)}
                className={`ml-2 w-8 h-4 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-400'} relative`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${isActive ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Name</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Link to Campaign</label>
            <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
              <option value="">-- No Campaign --</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl">
            <span className="text-sm font-semibold text-slate-700 dark:text-[#ededed]">Form Status</span>
            <button type="button" onClick={() => setIsActive(!isActive)} className="flex items-center gap-2">
              {isActive ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
              <span className="text-xs font-medium text-slate-500">{isActive ? 'Active' : 'Inactive'}</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description..."
              className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] resize-none placeholder:text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Submit Button Text</label>
              <input value={submitText} onChange={e => setSubmitText(e.target.value)} placeholder="e.g. Subscribe Now"
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Success Message</label>
              <input value={successMessage} onChange={e => setSuccessMessage(e.target.value)} placeholder="e.g. Thanks for signing up!"
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
            </div>
          </div>

          {/* Fields Editor */}
          <FieldEditor fields={fields} setFields={setFields} />

          <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] space-y-4">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Success Action</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Success Message</label>
                <input value={successMessage} onChange={e => setSuccessMessage(e.target.value)}
                  placeholder="Thank you!"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Redirect URL (Optional)</label>
                <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FormBuilderPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submissionsPanel, setSubmissionsPanel] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [embedModal, setEmbedModal] = useState<Form | null>(null);
  const [editModal, setEditModal] = useState<Form | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Lead Capture');
  const [formCampaign, setFormCampaign] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSubmitText, setFormSubmitText] = useState('Submit');
  const [formSuccessMessage, setFormSuccessMessage] = useState('Thank you!');
  const [formRedirectUrl, setFormRedirectUrl] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [campaigns, setCampaigns] = useState<{id: string, name: string}[]>([]);
  const [aiToggle, setAiToggle] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function closeCreateModal() {
    setShowCreateModal(false);
    setFormName('');
    setFormType('Lead Capture');
    setFormCampaign('');
    setFormDesc('');
    setFormSubmitText('Submit');
    setFormSuccessMessage('Thank you!');
    setFormRedirectUrl('');
    setFormFields([]);
    setAiPrompt('');
    setAiToggle(false);
    setCreateError('');
  }

  function handleCopyLink(formId: string) {
    if (!formId || formId === 'undefined') return;
    const url = `${window.location.origin}/public/form/${formId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(formId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  useEffect(() => { 
    fetchForms(); 
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await api.get('/marketing/campaigns');
      const data = res.data?.data || res.data?.campaigns || res.data || [];
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function fetchForms() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/forms');
      const raw = res.data?.data?.forms ?? res.data?.forms ?? (Array.isArray(res.data?.data) ? res.data.data : null) ?? res.data ?? [];
      const arr: Form[] = Array.isArray(raw) ? raw : [];
      setForms(arr.filter(f => f && f.id));
    } catch { setForms([]); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      let fields: FormField[] = formFields;
      if (aiToggle && aiPrompt.trim()) {
        try {
          const aiRes = await api.post('/marketing/ai/form/generate', { prompt: aiPrompt });
          fields = aiRes.data?.form?.fields || aiRes.data?.data?.fields || fields;
        } catch {
          // AI unavailable — continue with empty fields
        }
      }
      const res = await api.post('/marketing/forms', { name: formName, type: formType, campaign_id: formCampaign || null, description: formDesc, fields, settings: { submitText: formSubmitText, successMessage: formSuccessMessage, redirectUrl: formRedirectUrl } });
      const newForm: Form = res.data?.data?.form ?? res.data?.form ?? (res.data?.data?.id ? res.data.data : null) ?? res.data;
      if (newForm && !newForm.type) newForm.type = formType;
      if (!newForm?.id) { await fetchForms(); closeCreateModal(); return; }
      setForms(prev => [newForm, ...prev]);
      closeCreateModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Failed to create form.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Delete this form? This cannot be undone.');
    if (!ok) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/forms/${id}`);
      setForms(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete form';
      alert(msg);
    } finally {
      setDeleting(null);
    }
  }

  async function toggleEmbedded(form: Form) {
    const newVal = !form.is_embedded;
    setForms(prev => prev.map(f => f.id === form.id ? { ...f, is_embedded: newVal } : f));
    try {
      await api.patch(`/marketing/forms/${form.id}`, { is_embedded: newVal });
    } catch {
      setForms(prev => prev.map(f => f.id === form.id ? { ...f, is_embedded: !newVal } : f));
    }
  }

  async function openSubmissions(form: Form) {
    setSubmissionsPanel(form);
    setSubLoading(true);
    try {
      const res = await api.get(`/marketing/forms/${form.id}/submissions`);
      const subs = res.data?.data?.submissions || res.data?.submissions || res.data?.data || [];
      setSubmissions(Array.isArray(subs) ? subs : []);
    } catch { setSubmissions([]); } finally { setSubLoading(false); }
  }

  function handleFormSaved(updated: Form) {
    setForms(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
  }

  const filtered = forms.filter(f => (f.name || '').toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Forms', value: forms.length, color: 'text-indigo-600' },
    { label: 'Total Submissions', value: forms.reduce((a, f) => a + (Number(f.submission_count) || 0), 0), color: 'text-green-600' },
    { label: 'Active Embedded', value: forms.filter(f => f.is_embedded).length, color: 'text-blue-600' },
    { label: 'Avg Completion', value: forms.length ? `${Math.round(forms.reduce((a, f) => a + (f.completion_rate || 0), 0) / forms.length)}%` : '0%', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Form Builder</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Create and manage lead capture forms</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAiToggle(true); setCreateError(''); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
          <button onClick={() => { setAiToggle(false); setCreateError(''); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Form
          </button>
        </div>
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

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..."
          className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No forms found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first form to start capturing leads</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((form) => (
            <div key={form.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] truncate">{form.name}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadgeColor[form.type] || typeBadgeColor['Contact']}`}>
                    {form.type}
                  </span>
                </div>
                <button onClick={() => toggleEmbedded(form)} className="flex items-center gap-1 text-[10px] font-semibold shrink-0 hover:opacity-80 transition-opacity">
                  {form.is_embedded
                    ? <span className="flex items-center gap-1 text-green-600"><ToggleRight className="w-3.5 h-3.5" /> Embedded</span>
                    : <span className="flex items-center gap-1 text-slate-400"><ToggleLeft className="w-3.5 h-3.5" /> Not Embedded</span>}
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#a3a3a3]">
                <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {Number(form.submission_count) || 0} submissions</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {form.last_submission ? new Date(form.last_submission).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3">
                {/* Edit — opens edit modal */}
                <button
                  onClick={() => setEditModal(form)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                {/* Embed — opens embed/share modal */}
                <button
                  onClick={() => setEmbedModal(form)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition">
                  <Code className="w-3 h-3" /> Embed
                </button>
                {/* Share Link — copies to clipboard */}
                <button
                  onClick={() => handleCopyLink(form.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                    copied === form.id
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100'
                  }`}
                >
                  {copied === form.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                  {copied === form.id ? 'Copied!' : 'Share'}
                </button>
                {/* View submissions */}
                <button onClick={() => openSubmissions(form)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                  <Eye className="w-3 h-3" /> Submissions
                </button>
                {/* Preview — opens form in new tab */}
                {form.id && (
                  <a
                    href={`/public/form/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition">
                    <ExternalLink className="w-3 h-3" /> Preview
                  </a>
                )}
                {/* Delete */}
                <button onClick={() => handleDelete(form.id)} disabled={deleting === form.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition ml-auto">
                  {deleting === form.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Form Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f] sticky top-0 bg-white dark:bg-[#161616] z-10">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">{aiToggle ? 'AI Generate Form' : 'Create Form'}</h2>
              <button onClick={closeCreateModal} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Lead Capture Q3"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                  {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Link to Campaign</label>
                <select value={formCampaign} onChange={e => setFormCampaign(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed]">
                  <option value="">-- No Campaign --</option>
                  {campaigns.map((c, i) => <option key={`${c.id}-${i}`} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional description..."
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Submit Button Text</label>
                  <input value={formSubmitText} onChange={e => setFormSubmitText(e.target.value)} placeholder="e.g. Subscribe Now"
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Success Message</label>
                  <input value={formSuccessMessage} onChange={e => setFormSuccessMessage(e.target.value)} placeholder="e.g. Thanks for signing up!"
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#ededed]">AI Generate Fields</span>
                </div>
                <button type="button" onClick={() => setAiToggle(!aiToggle)}
                  className={`w-10 h-5 rounded-full transition-colors ${aiToggle ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'} relative`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${aiToggle ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {aiToggle && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">AI Prompt</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder='e.g. "Create a registration form with name, email, company, and job title"'
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 h-24 resize-none" />
                </div>
              )}

              {/* Add FieldEditor to Create Form Modal */}
              <FieldEditor fields={formFields} setFields={setFormFields} />

              <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] space-y-4">
                <h3 className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Success Action</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Success Message</label>
                    <input value={formSuccessMessage} onChange={e => setFormSuccessMessage(e.target.value)}
                      placeholder="Thank you!"
                      className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-[#ededed]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Redirect URL (Optional)</label>
                    <input value={formRedirectUrl} onChange={e => setFormRedirectUrl(e.target.value)}
                      placeholder="https://example.com/thank-you"
                      className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-violet-500 text-slate-900 dark:text-[#ededed]" />
                  </div>
                </div>
              </div>

              {createError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2">{createError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeCreateModal}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className={`flex-1 py-2.5 ${aiToggle ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60`}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : aiToggle ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {aiToggle ? 'Generate' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Embed Modal ── */}
      {embedModal && <EmbedModal form={embedModal} onClose={() => setEmbedModal(null)} />}

      {/* ── Edit Modal ── */}
      {editModal && (
        <EditFormModal
          form={editModal}
          campaigns={campaigns}
          onClose={() => setEditModal(null)}
          onSaved={(updated) => { handleFormSaved(updated); setEditModal(null); }}
        />
      )}

      {/* ── Submissions Slide-Over ── */}
      {submissionsPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSubmissionsPanel(null)} />
          <div className="w-full max-w-2xl bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-[#1f1f1f] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Submissions</h2>
                <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">{submissionsPanel.name}</p>
              </div>
              <button onClick={() => setSubmissionsPanel(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {subLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-600 animate-spin" /></div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1f1f1f]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#0d0d0d] border-b border-slate-200 dark:border-[#1f1f1f]">
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">Submitted At</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-[#a3a3a3]">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                      {submissions.map((s, i) => {
                        const data = s.submission_data || s.data || {};
                        const entries = Object.entries(data).filter(([k]) => k && k.trim() !== '');
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition align-top">
                            <td className="px-3 py-2.5 text-slate-500 dark:text-[#a3a3a3]">{i + 1}</td>
                            <td className="px-3 py-2.5 text-slate-700 dark:text-[#ededed] whitespace-nowrap">{new Date(s.created_at || s.submitted_at || Date.now()).toLocaleString()}</td>
                            <td className="px-3 py-2.5">
                              {entries.length > 0 ? (
                                <div className="space-y-1.5">
                                  {entries.map(([key, val]) => (
                                    <div key={key} className="flex items-start gap-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase min-w-[60px] shrink-0">{key.replace(/_/g, ' ')}</span>
                                      <span className="text-xs text-slate-700 dark:text-[#ededed] font-medium">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No data</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
