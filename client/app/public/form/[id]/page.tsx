'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Send } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FormField {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface PublicForm {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings?: {
    submit_label?: string;
    success_message?: string;
    successMessage?: string;
    accent_color?: string;
    submitText?: string;
    redirectUrl?: string;
    status?: string;
  };
}

type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'not_found';

export default function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<PublicForm | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/marketing/public/forms/${id}/public`)
      .then(async (res) => {
        if (res.status === 404) { setStatus('not_found'); return; }
        if (!res.ok) throw new Error('Failed to load form');
        const json = await res.json();
        const f: PublicForm = json.data?.form || json.form || json;
        f.fields = (Array.isArray(f.fields)
          ? f.fields
          : typeof f.fields === 'string'
          ? JSON.parse(f.fields)
          : []).map((field: any, idx: number) => {
            const label = field.label || field.placeholder || field.name || 'Untitled Field';
            const name = field.name || (label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + idx);
            return { ...field, name, label };
          });
        setForm(f);
        const initial: Record<string, string> = {};
        f.fields.forEach((field) => { initial[field.name] = ''; });
        setValues(initial);
        setStatus('ready');
      })
      .catch(() => { setStatus('error'); setErrorMsg('Unable to load form. It may have been removed or the link is invalid.'); });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/marketing/public/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
      if (form?.settings?.redirectUrl) {
        setTimeout(() => {
          window.location.href = form.settings!.redirectUrl!;
        }, 1000);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Your submission could not be saved. Please try again.');
    }
  }

  function updateValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  const accent = form?.settings?.accent_color || '#4F46E5';

  // --- Loading ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading form…</span>
        </div>
      </div>
    );
  }

  // --- Error / Inactive ---
  if (status === 'not_found' || (form && form.settings?.status === 'inactive')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-50 dark:ring-amber-900/10">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-[#ededed]">Form Not Available</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3]">
            This form is no longer active or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (status === 'error' && !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-500">{errorMsg}</p>
          <button
            onClick={() => { setStatus('loading'); setErrorMsg(''); window.location.reload(); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {form?.settings?.success_message || 'Thank you!'}
          </h1>
          <p className="text-sm text-slate-500">Your response has been recorded successfully.</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const fields = form.fields;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="max-w-lg w-full mx-auto relative group">
        {/* Decorative background glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Card */}
        <div className="relative bg-white dark:bg-[#161616] rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-[#2a2a2a] overflow-hidden">
          {/* Header accent bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

          {/* Title */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-[#1f1f1f]">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#ededed] tracking-tight">{form.name}</h1>
            {form.description && (
              <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-2 leading-relaxed">{form.description}</p>
            )}
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">This form has no fields configured yet.</p>
            ) : (
              fields.map((field) => {
                const fieldType = field.type || 'text';
                const label = field.label || 'Untitled Field';
                const fieldName = field.name;
                const inputBase =
                  'w-full text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#0d0d0d] outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-[#666] text-slate-800 dark:text-[#ededed] font-medium';

                return (
                  <div key={fieldName} className="space-y-2">
                    <label className="block text-[13px] font-bold text-slate-700 dark:text-[#a3a3a3]">
                      {label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {fieldType === 'textarea' ? (
                      <textarea
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={values[fieldName] || ''}
                        onChange={(e) => updateValue(fieldName, e.target.value)}
                        rows={4}
                        className={`${inputBase} resize-none`}
                      />
                    ) : fieldType === 'select' && field.options ? (
                      <select
                        required={field.required}
                        value={values[fieldName] || ''}
                        onChange={(e) => updateValue(fieldName, e.target.value)}
                        className={inputBase}
                      >
                        <option value="">Select an option…</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : fieldType === 'radio' && field.options ? (
                      <div className="space-y-2">
                        {field.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name={fieldName}
                              value={opt}
                              required={field.required}
                              checked={values[fieldName] === opt}
                              onChange={(e) => updateValue(fieldName, e.target.value)}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : fieldType === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-[#333] bg-white dark:bg-[#0d0d0d] group-hover:border-indigo-500 transition-colors">
                          <input
                            type="checkbox"
                            required={field.required}
                            checked={values[fieldName] === 'true'}
                            onChange={(e) => updateValue(fieldName, e.target.checked ? 'true' : 'false')}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {values[fieldName] === 'true' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-[#ededed]">{field.placeholder || label}</span>
                      </label>
                    ) : (
                      <input
                        type={fieldType}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={values[fieldName] || ''}
                        onChange={(e) => updateValue(fieldName, e.target.value)}
                        className={inputBase}
                      />
                    )}
                  </div>
                );
              })
            )}

              {fields.length > 0 && (
                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{ backgroundColor: accent }}
                    className="w-full py-3.5 px-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-70 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {form.settings?.submitText || 'Submit'}
                        <Send className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                  {status === 'error' && errorMsg && (
                    <p className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 py-2 rounded-lg">{errorMsg}</p>
                  )}
                  {(status as string) === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 py-2 rounded-lg">{form.settings?.successMessage || form.settings?.success_message || 'Form submitted successfully!'}</p>
                  )}
                </div>
              )}
            </form>
          </div>
          
          {/* Footer branding */}
          <div className="py-6 text-center">
            <p className="text-[11px] font-medium text-slate-400 dark:text-[#666]">
              Powered by <span className="font-bold text-slate-900 dark:text-[#ededed]">HubNest CRM</span>
            </p>
          </div>
        </div>
      </div>
  );
}
