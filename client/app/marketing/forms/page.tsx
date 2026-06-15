'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText, Plus, Sparkles, Trash2, Edit2, Code, Eye, Loader2,
  CheckCircle, X, BarChart2, Clock, ToggleLeft, ToggleRight, Search,
  Link2, Check, Save, ExternalLink, Copy, Minus, GripVertical,
  UserPlus, Mail, Briefcase, Calendar, Star, Clock3, BarChart,
  ShoppingCart, Bell, LifeBuoy, Building, GraduationCap, Home,
  Handshake, AlertTriangle, Share2, Download, MessageCircle,
  ChevronLeft, ChevronRight, Layers, Grid3X3,
} from 'lucide-react';
import api from '../../../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// ─── Constants ───────────────────────────────────────────────────────────────

const FORM_TYPES = ['Lead Capture', 'Survey', 'Registration', 'Newsletter', 'Contact'];
const FIELD_TYPES = ['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file', 'rating', 'url'];

const TEMPLATE_CATEGORIES = ['All', 'CRM', 'HR', 'Events', 'Feedback', 'Booking', 'Marketing', 'Support', 'Education', 'Business', 'Ecommerce', 'Real Estate'];

const ACCENT_COLORS: string[] = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444', '#6366F1', '#14B8A6'];

// ─── Template Data ────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'lead-capture', name: 'Lead Capture', description: 'Capture basic lead info', icon: UserPlus, color: '#F97316', category: 'CRM',
    fields: [
      { name: 'full_name',    label: 'Full Name',     type: 'text',   required: true  },
      { name: 'email',        label: 'Email Address', type: 'email',  required: true  },
      { name: 'phone',        label: 'Phone Number',  type: 'phone',  required: false },
      { name: 'source',       label: 'Source',        type: 'select', required: false, options: ['Google', 'Facebook', 'Referral', 'Other'] },
    ],
  },
  {
    id: 'contact-us', name: 'Contact Us', description: 'General contact / enquiry form', icon: Mail, color: '#3B82F6', category: 'CRM',
    fields: [
      { name: 'name',    label: 'Name',    type: 'text',     required: true  },
      { name: 'email',   label: 'Email',   type: 'email',    required: true  },
      { name: 'phone',   label: 'Phone',   type: 'phone',    required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: true  },
    ],
  },
  {
    id: 'job-application', name: 'Job Application', description: 'Collect applicant details', icon: Briefcase, color: '#8B5CF6', category: 'HR',
    fields: [
      { name: 'full_name',          label: 'Full Name',        type: 'text',     required: true  },
      { name: 'email',              label: 'Email',            type: 'email',    required: true  },
      { name: 'phone',              label: 'Phone',            type: 'phone',    required: true  },
      { name: 'position_applied',   label: 'Position Applied', type: 'text',     required: true  },
      { name: 'years_experience',   label: 'Years Experience', type: 'number',   required: false },
      { name: 'resume',             label: 'Upload Resume',    type: 'file',     required: true  },
      { name: 'cover_note',         label: 'Cover Note',       type: 'textarea', required: false },
    ],
  },
  {
    id: 'event-registration', name: 'Event Registration', description: 'Register attendees for events', icon: Calendar, color: '#10B981', category: 'Events',
    fields: [
      { name: 'full_name',  label: 'Full Name',    type: 'text',     required: true  },
      { name: 'email',      label: 'Email',        type: 'email',    required: true  },
      { name: 'phone',      label: 'Phone',        type: 'phone',    required: false },
      { name: 'event_date', label: 'Event Date',   type: 'select',   required: true,  options: ['Day 1', 'Day 2', 'Both Days'] },
      { name: 'seats',      label: 'No. of Seats', type: 'number',   required: true  },
      { name: 'terms',      label: 'I agree to terms', type: 'checkbox', required: true },
    ],
  },
  {
    id: 'feedback', name: 'Customer Feedback', description: 'Collect product/service feedback', icon: Star, color: '#F59E0B', category: 'Feedback',
    fields: [
      { name: 'name',        label: 'Name',            type: 'text',     required: false },
      { name: 'email',       label: 'Email',           type: 'email',    required: false },
      { name: 'rating',      label: 'Overall Rating',  type: 'rating',   required: true  },
      { name: 'liked',       label: 'What did you like?', type: 'select', required: false, options: ['Product', 'Support', 'Price', 'Delivery'] },
      { name: 'suggestions', label: 'Suggestions',     type: 'textarea', required: false },
    ],
  },
  {
    id: 'appointment', name: 'Appointment Booking', description: 'Book a meeting or consultation', icon: Clock3, color: '#EC4899', category: 'Booking',
    fields: [
      { name: 'full_name',       label: 'Full Name',     type: 'text',   required: true  },
      { name: 'email',           label: 'Email',         type: 'email',  required: true  },
      { name: 'phone',           label: 'Phone',         type: 'phone',  required: true  },
      { name: 'preferred_date',  label: 'Preferred Date', type: 'date',  required: true  },
      { name: 'time_slot',       label: 'Time Slot',     type: 'select', required: true,  options: ['9AM', '11AM', '2PM', '4PM'] },
      { name: 'reason',          label: 'Reason',        type: 'textarea', required: false },
    ],
  },
  {
    id: 'survey', name: 'Customer Survey', description: 'NPS / satisfaction survey', icon: BarChart, color: '#06B6D4', category: 'Feedback',
    fields: [
      { name: 'name',      label: 'Name',              type: 'text',     required: false },
      { name: 'rating',    label: 'Rate our service',  type: 'rating',   required: true  },
      { name: 'recommend', label: 'Would you recommend us?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments',  label: 'Comments',          type: 'textarea', required: false },
    ],
  },
  {
    id: 'product-order', name: 'Product Order', description: 'Simple product order form', icon: ShoppingCart, color: '#F97316', category: 'Ecommerce',
    fields: [
      { name: 'customer_name',      label: 'Customer Name',    type: 'text',     required: true  },
      { name: 'email',              label: 'Email',            type: 'email',    required: true  },
      { name: 'phone',              label: 'Phone',            type: 'phone',    required: true  },
      { name: 'product',            label: 'Product',          type: 'select',   required: true,  options: ['Product A', 'Product B', 'Product C'] },
      { name: 'quantity',           label: 'Quantity',         type: 'number',   required: true  },
      { name: 'delivery_address',   label: 'Delivery Address', type: 'textarea', required: true  },
    ],
  },
  {
    id: 'newsletter', name: 'Newsletter Signup', description: 'Grow your email list', icon: Bell, color: '#10B981', category: 'Marketing',
    fields: [
      { name: 'first_name', label: 'First Name',    type: 'text',     required: true  },
      { name: 'email',      label: 'Email Address', type: 'email',    required: true  },
      { name: 'interests',  label: 'Interests',     type: 'select',   required: false, options: ['Tech', 'Marketing', 'Design', 'Business'] },
      { name: 'consent',    label: 'I agree to receive emails', type: 'checkbox', required: true },
    ],
  },
  {
    id: 'support-ticket', name: 'Support Ticket', description: 'Raise a support request', icon: LifeBuoy, color: '#EF4444', category: 'Support',
    fields: [
      { name: 'name',        label: 'Name',             type: 'text',     required: true  },
      { name: 'email',       label: 'Email',            type: 'email',    required: true  },
      { name: 'issue_type',  label: 'Issue Type',       type: 'select',   required: true,  options: ['Bug', 'Billing', 'Account', 'Other'] },
      { name: 'priority',    label: 'Priority',         type: 'select',   required: true,  options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'description', label: 'Describe Issue',   type: 'textarea', required: true  },
      { name: 'screenshot',  label: 'Attach Screenshot', type: 'file',    required: false },
    ],
  },
  {
    id: 'vendor-registration', name: 'Vendor Registration', description: 'Onboard new vendors / suppliers', icon: Building, color: '#6366F1', category: 'Business',
    fields: [
      { name: 'company_name',   label: 'Company Name',            type: 'text',     required: true  },
      { name: 'contact_person', label: 'Contact Person',          type: 'text',     required: true  },
      { name: 'email',          label: 'Email',                   type: 'email',    required: true  },
      { name: 'phone',          label: 'Phone',                   type: 'phone',    required: true  },
      { name: 'gst',            label: 'GST Number',              type: 'text',     required: false },
      { name: 'services',       label: 'Products / Services',     type: 'textarea', required: true  },
    ],
  },
  {
    id: 'student-enrollment', name: 'Student Enrollment', description: 'Course or class enrollment', icon: GraduationCap, color: '#8B5CF6', category: 'Education',
    fields: [
      { name: 'student_name', label: 'Student Name', type: 'text',   required: true  },
      { name: 'email',        label: 'Email',        type: 'email',  required: true  },
      { name: 'phone',        label: 'Phone',        type: 'phone',  required: true  },
      { name: 'dob',          label: 'Date of Birth', type: 'date',  required: true  },
      { name: 'course',       label: 'Course',       type: 'select', required: true,  options: ['Web Dev', 'Data Science', 'Design', 'Marketing'] },
      { name: 'mode',         label: 'Mode',         type: 'radio',  required: true,  options: ['Online', 'Offline'] },
    ],
  },
  {
    id: 'real-estate', name: 'Real Estate Enquiry', description: 'Property interest form', icon: Home, color: '#F59E0B', category: 'Real Estate',
    fields: [
      { name: 'full_name',        label: 'Full Name',          type: 'text',     required: true  },
      { name: 'email',            label: 'Email',              type: 'email',    required: true  },
      { name: 'phone',            label: 'Phone',              type: 'phone',    required: true  },
      { name: 'property_type',    label: 'Property Type',      type: 'select',   required: true,  options: ['Apartment', 'Villa', 'Plot', 'Commercial'] },
      { name: 'budget',           label: 'Budget',             type: 'select',   required: false, options: ['<50L', '50L-1Cr', '1Cr-2Cr', '2Cr+'] },
      { name: 'location_pref',    label: 'Location Preference', type: 'textarea', required: false },
    ],
  },
  {
    id: 'partnership', name: 'Partnership Request', description: 'Business partnership enquiry', icon: Handshake, color: '#EC4899', category: 'Business',
    fields: [
      { name: 'name',             label: 'Name',              type: 'text',     required: true  },
      { name: 'company',          label: 'Company',           type: 'text',     required: true  },
      { name: 'email',            label: 'Email',             type: 'email',    required: true  },
      { name: 'phone',            label: 'Phone',             type: 'phone',    required: false },
      { name: 'partnership_type', label: 'Partnership Type',  type: 'select',   required: true,  options: ['Reseller', 'Integration', 'Co-marketing', 'Other'] },
      { name: 'proposal',         label: 'Proposal',          type: 'textarea', required: true  },
    ],
  },
  {
    id: 'complaint', name: 'Complaint Form', description: 'Register a complaint', icon: AlertTriangle, color: '#EF4444', category: 'Support',
    fields: [
      { name: 'full_name',       label: 'Full Name',         type: 'text',     required: true  },
      { name: 'email',           label: 'Email',             type: 'email',    required: true  },
      { name: 'phone',           label: 'Phone',             type: 'phone',    required: false },
      { name: 'complaint_type',  label: 'Complaint Type',    type: 'select',   required: true,  options: ['Product', 'Service', 'Staff', 'Billing', 'Other'] },
      { name: 'details',         label: 'Complaint Details', type: 'textarea', required: true  },
      { name: 'proof',           label: 'Attach Proof',      type: 'file',     required: false },
    ],
  },
] as const;

type TemplateDef = (typeof TEMPLATES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  id?: string;
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string;
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
  created_at?: string;
  submitted_at?: string;
  data: Record<string, unknown>;
  submission_data?: Record<string, unknown>;
}

// ─── Field Editor (drag-to-reorder) ──────────────────────────────────────────

function FieldEditor({ fields, setFields }: { fields: FormField[]; setFields: React.Dispatch<React.SetStateAction<FormField[]>> }) {
  const addField = () => {
    const ts = Date.now();
    setFields(prev => [...prev, { name: `field_${ts}`, label: '', placeholder: '', type: 'text', required: false }]);
  };
  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx));
  const updateField = (idx: number, patch: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      const updated = { ...f, ...patch };
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
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFields(items);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">
          Form Fields ({fields.length})
        </label>
        <button type="button" onClick={addField}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Add Field
        </button>
      </div>
      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-[#1f1f1f] rounded-xl">
          <p className="text-xs text-slate-400">No fields yet. Click &quot;Add Field&quot; to start.</p>
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
                      style={provided.draggableProps.style as React.CSSProperties}
                      className={`bg-white dark:bg-[#161616] rounded-xl p-3 border ${
                        snapshot.isDragging
                          ? 'border-orange-400 shadow-md ring-1 ring-orange-400'
                          : 'border-slate-200 dark:border-[#1f1f1f]'
                      } space-y-2 transition`}
                    >
                      <div className="flex items-center gap-2">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-[#222] rounded-md transition">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Label</p>
                            <input value={field.label || ''} onChange={e => updateField(idx, { label: e.target.value })}
                              placeholder="Field Label"
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-orange-400 text-slate-800 dark:text-[#ededed]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Type</p>
                            <select value={field.type || 'text'} onChange={e => updateField(idx, { type: e.target.value })}
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-orange-400 text-slate-800 dark:text-[#ededed]">
                              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 mb-1">Placeholder</p>
                            <input value={field.placeholder || ''} onChange={e => updateField(idx, { placeholder: e.target.value })}
                              placeholder="Hint text…"
                              className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-orange-400 text-slate-800 dark:text-[#ededed]" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1 cursor-pointer p-1.5 rounded-lg border border-slate-200 dark:border-[#1f1f1f] hover:border-orange-300 transition">
                            <input type="checkbox" checked={!!field.required} onChange={e => updateField(idx, { required: e.target.checked })} className="w-3 h-3 accent-orange-500" />
                            <span className="text-[10px] font-semibold text-slate-500">Req.</span>
                          </label>
                          <button type="button" onClick={() => removeField(idx)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
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
                            className="w-full text-xs p-2 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-lg outline-none focus:border-orange-400 text-slate-800 dark:text-[#ededed]" />
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

// ─── Share Modal (Link + QR + Embed + WhatsApp + Email) ───────────────────────

function ShareModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const shareUrl = `${origin}/public/form/${form.id}`;

  const iframeCode = `<iframe\n  src="${shareUrl}"\n  width="100%"\n  height="620"\n  frameborder="0"\n  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);"\n  title="${form.name}"\n></iframe>`;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopiedWhat(key);
    setTimeout(() => setCopiedWhat(null), 2000);
  }

  function downloadQR() {
    const svg = document.getElementById('share-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `${form.name}-qr.png`; a.click(); };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Share Form</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5 truncate max-w-[280px]">{form.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Direct link */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Direct Link</p>
            <div className="flex gap-2">
              <input readOnly value={shareUrl}
                className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none" />
              <button onClick={() => copy(shareUrl, 'link')}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition shrink-0">
                {copiedWhat === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedWhat === 'link' ? 'Copied!' : 'Copy'}
              </button>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                className="p-2.5 border border-slate-200 dark:border-[#1f1f1f] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-[#0d0d0d] rounded-xl border border-slate-200 dark:border-[#1f1f1f]">
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm">
              <QRCodeSVG id="share-qr" value={shareUrl} size={96} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-[#ededed]">QR Code</p>
              <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">Scan to open form on any device. Download as PNG to print or share.</p>
              <button onClick={downloadQR}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg transition">
                <Download className="w-3 h-3" /> Download PNG
              </button>
            </div>
          </div>

          {/* Embed */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Embed Code (iframe)</p>
            <div className="relative">
              <textarea readOnly value={iframeCode} rows={5}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl font-mono text-slate-700 dark:text-[#ededed] outline-none resize-none" />
              <button onClick={() => copy(iframeCode, 'iframe')}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] text-[11px] font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition">
                {copiedWhat === 'iframe' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedWhat === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social share */}
          <div className="flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent('Fill out this form: ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(form.name)}&body=${encodeURIComponent('Please fill out this form: ' + shareUrl)}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
            <button onClick={() => copy(shareUrl, 'social')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition">
              <Share2 className="w-3.5 h-3.5" />
              {copiedWhat === 'social' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form Editor Drawer (right-side, 620px) ───────────────────────────────────

interface DrawerProps {
  template: TemplateDef | null;
  campaigns: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (form: Form) => void;
}

function FormEditorDrawer({ template, campaigns, onClose, onSaved }: DrawerProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState(template?.category ?? 'Lead Capture');
  const [description, setDescription] = useState(template?.description ?? '');
  const [campaignId, setCampaignId] = useState('');
  const [submitText, setSubmitText] = useState('Submit');
  const [successMessage, setSuccessMessage] = useState('Thank you! Your response has been recorded.');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [accentColor, setAccentColor] = useState<string>(template?.color ?? '#F97316');
  const [fields, setFields] = useState<FormField[]>(() =>
    (template?.fields ?? []).map((f: any, i: number) => ({ ...f, name: f.name || `field_${i}` }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Form name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/marketing/forms', {
        name: name.trim(),
        type,
        campaign_id: campaignId || null,
        description,
        fields,
        settings: { submitText, successMessage, redirectUrl, accent_color: accentColor, status: 'active' },
      });
      const form: Form =
        res.data?.data?.form ?? res.data?.form ?? (res.data?.data?.id ? res.data.data : null) ?? res.data;
      if (!form?.id) {
        // refetch list instead
        onSaved({ id: '', name, type } as Form);
        return;
      }
      if (!form.type) form.type = type;
      onSaved(form);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[640px] bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-[#1f1f1f] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1f1f1f] shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">
              {template ? `From Template: ${template.name}` : 'Create Form'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Customise fields, then save to get your share link</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Form Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lead Capture Q3"
              className="w-full text-sm p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 text-slate-900 dark:text-[#ededed]" />
          </div>

          {/* Type + Campaign */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full text-sm p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]">
                {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Link to Campaign</label>
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                className="w-full text-sm p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]">
                <option value="">-- No Campaign --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Optional description shown to users"
              className="w-full text-sm p-3 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed] resize-none placeholder:text-slate-400" />
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setAccentColor(c)}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${accentColor === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'}`} />
              ))}
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-full border-none outline-none cursor-pointer overflow-hidden" title="Custom color" />
            </div>
          </div>

          {/* Fields */}
          <FieldEditor fields={fields} setFields={setFields} />

          {/* Submit settings */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Submit Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Button Label</label>
                <input value={submitText} onChange={e => setSubmitText(e.target.value)} placeholder="Submit"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Success Message</label>
                <input value={successMessage} onChange={e => setSuccessMessage(e.target.value)} placeholder="Thank you!"
                  className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">Redirect URL after submit (optional)</label>
              <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://example.com/thank-you"
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1f1f1f] shrink-0 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-[2] py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save & Get Share Link'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditFormModal({
  form, campaigns, onClose, onSaved,
}: {
  form: Form;
  campaigns: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (updated: Form) => void;
}) {
  const [name, setName] = useState(form.name);
  const [type, setType] = useState(form.type || 'Lead Capture');
  const [campaignId, setCampaignId] = useState(form.campaign_id || '');
  const [description, setDescription] = useState(form.description || '');
  const [submitText, setSubmitText] = useState(form.settings?.submitText || 'Submit');
  const [successMessage, setSuccessMessage] = useState(form.settings?.successMessage || 'Thank you!');
  const [redirectUrl, setRedirectUrl] = useState(form.settings?.redirectUrl || '');
  const [isActive, setIsActive] = useState(form.settings?.status !== 'inactive');
  const [accentColor, setAccentColor] = useState<string>(form.settings?.accent_color || '#F97316');
  const [fields, setFields] = useState<FormField[]>(() => {
    const raw = form.fields;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/marketing/forms/${form.id}`, {
        name, type, campaign_id: campaignId || null, description, fields,
        settings: { ...(form.settings || {}), type, submitText, successMessage, redirectUrl, accent_color: accentColor, status: isActive ? 'active' : 'inactive' },
      });
      const updated = res.data?.data?.form || res.data?.data || res.data?.form || res.data;
      onSaved({ ...form, name, type, campaign_id: campaignId, description, fields, settings: { ...form.settings, submitText, successMessage, redirectUrl, accent_color: accentColor, status: isActive ? 'active' : 'inactive' }, ...updated });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
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
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isActive ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </button>
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Form Name</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]">
                {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Link to Campaign</label>
            <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]">
              <option value="">-- No Campaign --</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed] resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ background: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${accentColor === c ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'}`} />
              ))}
            </div>
          </div>
          <FieldEditor fields={fields} setFields={setFields} />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">Submit Button Text</label>
              <input value={submitText} onChange={e => setSubmitText(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">Success Message</label>
              <input value={successMessage} onChange={e => setSuccessMessage(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-orange-500 text-slate-900 dark:text-[#ededed]" />
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
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Form Card Download Row ───────────────────────────────────────────────────

function FormDownloadRow({ form }: { form: Form }) {
  const [busy, setBusy] = useState<'pdf' | 'csv' | 'excel' | null>(null);

  async function fetchAndDownload(type: 'pdf' | 'csv' | 'excel') {
    setBusy(type);
    try {
      const res = await api.get(`/marketing/forms/${form.id}/submissions`);
      const subs: Submission[] = res.data?.data?.submissions || res.data?.submissions || res.data?.data || [];
      if (!Array.isArray(subs) || subs.length === 0) {
        alert('No submissions to download yet.');
        return;
      }
      if (type === 'pdf') downloadPDF(form, subs);
      else if (type === 'csv') downloadCSV(form, subs);
      else downloadExcel(form, subs);
    } catch {
      alert('Could not load submissions.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-0.5">Download:</span>
      <button
        onClick={() => fetchAndDownload('pdf')}
        disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 disabled:opacity-50 rounded-lg transition border border-red-100 dark:border-red-900/30">
        {busy === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        PDF
      </button>
      <button
        onClick={() => fetchAndDownload('csv')}
        disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 disabled:opacity-50 rounded-lg transition border border-emerald-100 dark:border-emerald-900/30">
        {busy === 'csv' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        CSV
      </button>
      <button
        onClick={() => fetchAndDownload('excel')}
        disabled={busy !== null}
        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 disabled:opacity-50 rounded-lg transition border border-blue-100 dark:border-blue-900/30">
        {busy === 'excel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        Excel
      </button>
    </div>
  );
}

// ─── Submissions Panel ────────────────────────────────────────────────────────

function resolveLabel(key: string, formFields?: FormField[]): string {
  if (formFields && formFields.length > 0) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = formFields.find(f => {
      const fName = (f.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fId = (f.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return f.name === key || f.id === key || 
             (fName && normKey.includes(fName)) || 
             (fId && normKey.includes(fId)) ||
             (fName && fName.includes(normKey)) ||
             (fId && fId.includes(normKey));
    });
    if (match) {
      if (match.label && match.label.trim()) return match.label;
      if (match.placeholder && match.placeholder.trim()) return match.placeholder;
      if (match.name && match.name.trim()) return match.name;
    }
  }
  // Fallback: prettify the raw key
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function downloadCSV(form: Form, submissions: Submission[]) {
  const fields: FormField[] = (() => {
    try {
      const raw = form.fields;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    } catch { return []; }
  })();

  const allKeys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.submission_data || s.data || {}))));
  const headers = ['#', 'Submitted At', ...allKeys.map(k => resolveLabel(k, fields))];
  const rows = submissions.map((s, i) => {
    const data = s.submission_data || s.data || {};
    return [
      String(i + 1),
      new Date(s.created_at || s.submitted_at || Date.now()).toLocaleString(),
      ...allKeys.map(k => String((data as Record<string, unknown>)[k] ?? '')),
    ];
  });
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${form.name.replace(/[^a-z0-9]/gi, '_')}_responses.csv`;
  a.click();
}

function downloadExcel(form: Form, submissions: Submission[]) {
  const fields: FormField[] = (() => {
    try {
      const raw = form.fields;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    } catch { return []; }
  })();
  const allKeys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.submission_data || s.data || {}))));
  const headers = ['#', 'Submitted At', ...allKeys.map(k => resolveLabel(k, fields))];
  const rows = submissions.map((s, i) => {
    const data = s.submission_data || s.data || {};
    return [String(i + 1), new Date(s.created_at || s.submitted_at || Date.now()).toLocaleString(), ...allKeys.map(k => String((data as Record<string, unknown>)[k] ?? ''))];
  });
  const tableHtml = `<table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`;
  const blob = new Blob([xls], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${form.name.replace(/[^a-z0-9]/gi, '_')}_responses.xls`;
  a.click();
}

function downloadPDF(form: Form, submissions: Submission[]) {
  const fields: FormField[] = (() => {
    try {
      const raw = form.fields;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    } catch { return []; }
  })();
  const allKeys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.submission_data || s.data || {}))));
  const headers = ['#', 'Submitted At', ...allKeys.map(k => resolveLabel(k, fields))];
  const rows = submissions.map((s, i) => {
    const data = s.submission_data || s.data || {};
    return [String(i + 1), new Date(s.created_at || s.submitted_at || Date.now()).toLocaleString(), ...allKeys.map(k => String((data as Record<string, unknown>)[k] ?? ''))];
  });
  const win = window.open('', '_blank')!;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${form.name} — Responses</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#111;}h1{font-size:18px;margin-bottom:4px;}p{font-size:12px;color:#666;margin-bottom:16px;}
table{border-collapse:collapse;width:100%;font-size:12px;}th{background:#f97316;color:#fff;padding:8px 10px;text-align:left;}
td{padding:7px 10px;border-bottom:1px solid #e5e7eb;}tr:nth-child(even){background:#fef9f5;}
@media print{button{display:none!important;}</style></head><body>
<h1>${form.name} — Form Responses</h1>
<p>Exported ${new Date().toLocaleString()} &bull; ${submissions.length} response${submissions.length !== 1 ? 's' : ''}</p>
<button onclick="window.print()" style="margin-bottom:16px;padding:8px 16px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">🖨 Print / Save as PDF</button>
<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`);
  win.document.close();
}

function SubmissionsPanel({
  form, submissions, loading, onClose,
}: {
  form: Form;
  submissions: Submission[];
  loading: boolean;
  onClose: () => void;
}) {
  const formFields: FormField[] = (() => {
    try {
      const raw = form.fields;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    } catch { return []; }
  })();

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white dark:bg-[#161616] border-l border-slate-200 dark:border-[#1f1f1f] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1f1f1f] shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">Responses</h2>
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
              {form.name} &bull; {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Download toolbar */}
        {!loading && submissions.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1f1f1f] shrink-0 flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-[#0d0d0d]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">Download:</span>
            <button
              onClick={() => downloadPDF(form, submissions)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition border border-red-100 dark:border-red-900/30">
              <Download className="w-3 h-3" /> PDF
            </button>
            <button
              onClick={() => downloadCSV(form, submissions)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded-lg transition border border-emerald-100 dark:border-emerald-900/30">
              <Download className="w-3 h-3" /> CSV
            </button>
            <button
              onClick={() => downloadExcel(form, submissions)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition border border-blue-100 dark:border-blue-900/30">
              <Download className="w-3 h-3" /> Excel
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No responses yet</p>
              <p className="text-xs text-slate-400 mt-1">Share the form link to start collecting submissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s, i) => {
                const data = (s.submission_data || s.data || {}) as Record<string, unknown>;
                const entries = Object.entries(data).filter(([k]) => k && k.trim() !== '');
                return (
                  <div key={s.id} className="bg-slate-50 dark:bg-[#0d0d0d] rounded-xl border border-slate-200 dark:border-[#1f1f1f] overflow-hidden">
                    {/* Submission header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#161616] border-b border-slate-100 dark:border-[#1f1f1f]">
                      <span className="text-[11px] font-bold text-orange-500">#{i + 1}</span>
                      <span className="text-[11px] text-slate-500 dark:text-[#a3a3a3]">
                        {new Date(s.created_at || s.submitted_at || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    {/* Field rows */}
                    <div className="divide-y divide-slate-100 dark:divide-[#1a1a1a]">
                      {entries.length > 0 ? entries.map(([key, val]) => (
                        <div key={key} className="flex items-start gap-3 px-4 py-2.5">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] min-w-[120px] shrink-0 pt-0.5">
                            {resolveLabel(key, formFields)}
                          </span>
                          <span className="text-xs text-slate-800 dark:text-[#ededed] font-medium break-all">
                            {String(val)}
                          </span>
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-xs text-slate-400 italic">No data</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template Gallery Card ────────────────────────────────────────────────────

function TemplateCard({ template, onUse }: { template: TemplateDef; onUse: (t: TemplateDef) => void }) {
  const Icon = template.icon;
  return (
    <div className="group bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Color bar */}
      <div className="h-1" style={{ backgroundColor: template.color }} />
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Icon + category */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: template.color + '20' }}>
            <Icon className="w-5 h-5" style={{ color: template.color }} />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {template.category}
          </span>
        </div>
        {/* Name + desc */}
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">{template.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{template.description}</p>
        </div>
        {/* Field count */}
        <p className="text-[11px] text-slate-400 dark:text-[#666]">{template.fields.length} fields</p>
      </div>
      <div className="px-5 pb-4">
        <button
          onClick={() => onUse(template)}
          style={{ backgroundColor: template.color }}
          className="w-full py-2 text-white text-xs font-bold rounded-xl hover:opacity-90 transition shadow-sm active:scale-[0.98]">
          Use Template
        </button>
      </div>
    </div>
  );
}

// ─── Form Card (existing forms list) ─────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  'Lead Capture': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Survey': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Registration': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Newsletter': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Contact': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageView = 'gallery' | 'myforms';

export default function FormBuilderPage() {
  const [view, setView] = useState<PageView>('gallery');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  const [editorTemplate, setEditorTemplate] = useState<TemplateDef | null>(null);
  const [showBlankEditor, setShowBlankEditor] = useState(false);
  const [shareModal, setShareModal] = useState<Form | null>(null);
  const [editModal, setEditModal] = useState<Form | null>(null);
  const [submissionsPanel, setSubmissionsPanel] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { fetchForms(); fetchCampaigns(); }, []);

  // Auto-refresh forms list every 15s so submission_count stays current
  useEffect(() => {
    const interval = setInterval(() => { fetchForms(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await api.get('/marketing/campaigns');
      const data = res.data?.data || res.data?.campaigns || res.data || [];
      setCampaigns(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }

  async function fetchForms() {
    setLoading(true);
    try {
      const res = await api.get('/marketing/forms');
      const raw = res.data?.data?.forms ?? res.data?.forms ?? (Array.isArray(res.data?.data) ? res.data.data : null) ?? res.data ?? [];
      setForms((Array.isArray(raw) ? raw : []).filter((f: Form) => f && f.id));
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  function handleFormCreated(form: Form) {
    if (!form.id) { fetchForms(); }
    else { setForms(prev => [form, ...prev]); }
    setEditorTemplate(null);
    setShowBlankEditor(false);
    setShareModal(form.id ? form : null);
    setView('myforms');
  }

  function handleFormSaved(updated: Form) {
    setForms(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this form? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/marketing/forms/${id}`);
      setForms(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete form');
    } finally { setDeleting(null); }
  }

  async function openSubmissions(form: Form) {
    setSubmissionsPanel(form);
    setSubLoading(true);
    try {
      const res = await api.get(`/marketing/forms/${form.id}/submissions`);
      const subs = res.data?.data?.submissions || res.data?.submissions || res.data?.data || [];
      setSubmissions(Array.isArray(subs) ? subs : []);
    } catch { setSubmissions([]); }
    finally { setSubLoading(false); }
  }

  // Poll submissions every 5s while the panel is open
  useEffect(() => {
    if (!submissionsPanel) return;
    const poll = async () => {
      try {
        const res = await api.get(`/marketing/forms/${submissionsPanel.id}/submissions`);
        const subs = res.data?.data?.submissions || res.data?.submissions || res.data?.data || [];
        setSubmissions(Array.isArray(subs) ? subs : []);
        // Also update the count on the card
        setForms(prev => prev.map(f => f.id === submissionsPanel.id
          ? { ...f, submission_count: Array.isArray(subs) ? subs.length : f.submission_count }
          : f
        ));
      } catch { /* silent */ }
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [submissionsPanel?.id]);

  function handleCopyLink(formId: string) {
    if (!formId) return;
    const url = `${window.location.origin}/public/form/${formId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(formId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const visibleTemplates = TEMPLATES.filter(t => {
    const matchCat = categoryFilter === 'All' || t.category === categoryFilter;
    const q = templateSearch.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const stats = [
    { label: 'Total Forms', value: forms.length, color: 'text-orange-500' },
    { label: 'Total Submissions', value: forms.reduce((a, f) => a + (Number(f.submission_count) || 0), 0), color: 'text-green-600' },
    { label: 'Active Embedded', value: forms.filter(f => f.is_embedded).length, color: 'text-blue-600' },
    { label: 'Templates', value: TEMPLATES.length, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Form Builder</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Typeform-style forms — choose a template, share the link, collect responses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBlankEditor(true); setEditorTemplate(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Blank Form
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4">
            <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d0d0d] p-1 rounded-xl w-fit">
        <button onClick={() => setView('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'gallery' ? 'bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
          <Grid3X3 className="w-4 h-4" /> Templates
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">{TEMPLATES.length}</span>
        </button>
        <button onClick={() => setView('myforms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'myforms' ? 'bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
          <Layers className="w-4 h-4" /> My Forms
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">{forms.length}</span>
        </button>
      </div>

      {/* ══ GALLERY VIEW ══ */}
      {view === 'gallery' && (
        <div className="space-y-5">
          {/* Search + category filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-[#161616] border border-slate-200/60 dark:border-[#1f1f1f] rounded-xl px-3 py-2 w-full sm:w-64 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)} placeholder="Search templates…"
                className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 max-w-full">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#1f1f1f] text-slate-600 dark:text-slate-400 hover:border-orange-300'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {visibleTemplates.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f]">
              <p className="text-sm text-slate-400">No templates match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleTemplates.map(t => (
                <TemplateCard key={t.id} template={t} onUse={tmpl => setEditorTemplate(tmpl)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MY FORMS VIEW ══ */}
      {view === 'myforms' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No forms yet</p>
              <p className="text-xs text-slate-400 mt-1">Go to Templates and click &quot;Use Template&quot; to create your first form</p>
              <button onClick={() => setView('gallery')}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition">
                Browse Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {forms.map(form => (
                <div key={form.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-[#ededed] truncate">{form.name}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[form.type] || TYPE_BADGE['Contact']}`}>
                        {form.type}
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      form.settings?.status === 'inactive' ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {form.settings?.status === 'inactive' ? 'Inactive' : 'Active'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#a3a3a3]">
                    <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {Number(form.submission_count) || 0} submissions</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {form.last_submission ? new Date(form.last_submission).toLocaleDateString() : 'Never'}</span>
                  </div>
                  {/* Row 1 — actions */}
                  <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-[#1f1f1f] pt-3">
                    <button onClick={() => setEditModal(form)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-lg transition">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setShareModal(form)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 rounded-lg transition">
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                    <button onClick={() => handleCopyLink(form.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                        copied === form.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100'
                      }`}>
                      {copied === form.id ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                      {copied === form.id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button onClick={() => openSubmissions(form)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 rounded-lg transition">
                      <Eye className="w-3 h-3" /> Responses
                    </button>
                    {form.id && (
                      <a href={`/public/form/${form.id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 rounded-lg transition">
                        <ExternalLink className="w-3 h-3" /> Preview
                      </a>
                    )}
                    <button onClick={() => handleDelete(form.id)} disabled={deleting === form.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-lg transition ml-auto">
                      {deleting === form.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </div>
                  {/* Row 2 — download */}
                  <FormDownloadRow form={form} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Form Editor Drawer (from template OR blank) ── */}
      {(editorTemplate || showBlankEditor) && (
        <FormEditorDrawer
          template={editorTemplate}
          campaigns={campaigns}
          onClose={() => { setEditorTemplate(null); setShowBlankEditor(false); }}
          onSaved={handleFormCreated}
        />
      )}

      {/* ── Share Modal ── */}
      {shareModal && <ShareModal form={shareModal} onClose={() => setShareModal(null)} />}

      {/* ── Edit Modal ── */}
      {editModal && (
        <EditFormModal
          form={editModal}
          campaigns={campaigns}
          onClose={() => setEditModal(null)}
          onSaved={updated => { handleFormSaved(updated); setEditModal(null); }}
        />
      )}

      {/* ── Submissions Slide-Over ── */}
      {submissionsPanel && (
        <SubmissionsPanel
          form={submissionsPanel}
          submissions={submissions}
          loading={subLoading}
          onClose={() => setSubmissionsPanel(null)}
        />
      )}
    </div>
  );
}
