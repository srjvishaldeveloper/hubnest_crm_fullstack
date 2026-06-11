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
    accent_color?: string;
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
        // Ensure fields is always an array
        f.fields = Array.isArray(f.fields)
          ? f.fields
          : typeof f.fields === 'string'
          ? JSON.parse(f.fields)
          : [];
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

  // --- Not found ---
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Form Not Found</h1>
          <p className="text-sm text-slate-500">This form link is no longer active or the form has been removed.</p>
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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Header accent bar */}
          <div className="h-2" style={{ backgroundColor: accent }} />

          {/* Title */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900">{form.name}</h1>
            {form.description && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{form.description}</p>
            )}
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">This form has no fields configured yet.</p>
            ) : (
              fields.map((field) => {
                const fieldType = field.type || 'text';
                const label = field.label || field.name;
                const inputBase =
                  'w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition placeholder:text-slate-400 text-slate-800';

                return (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      {label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>

                    {fieldType === 'textarea' ? (
                      <textarea
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={values[field.name] || ''}
                        onChange={(e) => updateValue(field.name, e.target.value)}
                        rows={4}
                        className={`${inputBase} resize-none`}
                      />
                    ) : fieldType === 'select' && field.options ? (
                      <select
                        required={field.required}
                        value={values[field.name] || ''}
                        onChange={(e) => updateValue(field.name, e.target.value)}
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
                              name={field.name}
                              value={opt}
                              required={field.required}
                              checked={values[field.name] === opt}
                              onChange={(e) => updateValue(field.name, e.target.value)}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : fieldType === 'checkbox' ? (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={values[field.name] === 'true'}
                          onChange={(e) => updateValue(field.name, e.target.checked ? 'true' : 'false')}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-sm text-slate-700">{field.placeholder || label}</span>
                      </label>
                    ) : (
                      <input
                        type={fieldType}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={values[field.name] || ''}
                        onChange={(e) => updateValue(field.name, e.target.value)}
                        className={inputBase}
                      />
                    )}
                  </div>
                );
              })
            )}

            {fields.length > 0 && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{ backgroundColor: accent }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-sm disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="w-4 h-4" /> {form.settings?.submit_label || 'Submit'}</>
                  )}
                </button>
              </div>
            )}

            {status === 'error' && errorMsg && (
              <p className="text-xs text-red-500 text-center">{errorMsg}</p>
            )}
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 pt-0">
            <p className="text-center text-[11px] text-slate-400">
              Powered by <span className="font-semibold text-slate-500">HubNest CRM</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
