'use client';

import { useState } from 'react';
import {
  Settings, Mail, MessageSquare, Phone, ShieldCheck,
  Bell, CheckCircle, Loader2, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface GeneralSettings {
  company_name: string;
  reply_to_email: string;
  timezone: string;
  language: string;
}

interface EmailSettings {
  from_name: string;
  from_email: string;
  footer_text: string;
  unsubscribe_template: string;
}

interface WhatsAppSettings {
  account_id: string;
  phone_number: string;
  api_token: string;
}

interface SmsSettings {
  provider: 'Twilio' | 'MSG91';
  account_sid: string;
  auth_token: string;
  sender_id: string;
}

interface ComplianceSettings {
  gdpr: boolean;
  ccpa: boolean;
  double_optin: boolean;
  retention_days: number;
}

interface NotificationSettings {
  campaign_sent: boolean;
  form_submission: boolean;
  new_lead: boolean;
  workflow_triggered: boolean;
}

// ─── Nav items ────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'general',       label: 'General',            icon: Settings      },
  { key: 'email',         label: 'Email Settings',     icon: Mail          },
  { key: 'whatsapp',      label: 'WhatsApp Settings',  icon: MessageSquare },
  { key: 'sms',           label: 'SMS Settings',       icon: Phone         },
  { key: 'compliance',    label: 'Compliance',         icon: ShieldCheck   },
  { key: 'notifications', label: 'Notifications',      icon: Bell          },
] as const;

type NavKey = typeof NAV_ITEMS[number]['key'];

// ─── Small helper components ──────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-[#ededed] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ enabled, onToggle, label, description }: { enabled: boolean; onToggle: () => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-[#1f1f1f] last:border-0">
      <div>
        <p className="text-xs font-bold text-slate-900 dark:text-[#ededed]">{label}</p>
        <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">{description}</p>
      </div>
      <button onClick={onToggle}>
        {enabled ? <ToggleRight size={26} className="text-blue-600" /> : <ToggleLeft size={26} className="text-slate-300 dark:text-[#333]" />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function MarketingSettings() {
  const [activeSection, setActiveSection] = useState<NavKey>('general');
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState<string | null>(null);

  const [general, setGeneral] = useState<GeneralSettings>({
    company_name:   'HubNest Inc.',
    reply_to_email: 'noreply@hubnest.io',
    timezone:       'Asia/Kolkata',
    language:       'en',
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    from_name:             'HubNest Marketing',
    from_email:            'marketing@hubnest.io',
    footer_text:           '© 2025 HubNest Inc. All rights reserved.',
    unsubscribe_template:  'Click here to unsubscribe: {{unsubscribe_link}}',
  });

  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>({
    account_id:   '',
    phone_number: '',
    api_token:    '',
  });

  const [sms, setSms] = useState<SmsSettings>({
    provider:    'Twilio',
    account_sid: '',
    auth_token:  '',
    sender_id:   '',
  });

  const [compliance, setCompliance] = useState<ComplianceSettings>({
    gdpr:           true,
    ccpa:           false,
    double_optin:   true,
    retention_days: 365,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    campaign_sent:      true,
    form_submission:    true,
    new_lead:           true,
    workflow_triggered: false,
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    showToast(`${NAV_ITEMS.find(n => n.key === activeSection)?.label} settings saved.`);
  }

  const inputClass = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold';
  const selectClass = inputClass + ' appearance-none';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0e0e0e] p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900 dark:bg-[#1f1f1f] text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#ededed]">Marketing Settings</h1>
        <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">Configure channels, compliance, and notification preferences</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <nav className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-2 space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeSection === key ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-[#ededed]'}`}>
                <Icon size={13} />
                <span className="flex-1 text-left">{label}</span>
                {activeSection !== key && <ChevronRight size={11} className="opacity-40" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-6">

          {/* General */}
          {activeSection === 'general' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">General</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Basic campaign identity and regional settings.</p>
              <div className="space-y-4 max-w-lg">
                <Field label="Company Name">
                  <input value={general.company_name} onChange={e => setGeneral(p => ({ ...p, company_name: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Default Reply-to Email">
                  <input type="email" value={general.reply_to_email} onChange={e => setGeneral(p => ({ ...p, reply_to_email: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Timezone">
                  <select value={general.timezone} onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))} className={selectClass}>
                    {['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London'].map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </Field>
                <Field label="Language">
                  <select value={general.language} onChange={e => setGeneral(p => ({ ...p, language: e.target.value }))} className={selectClass}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeSection === 'email' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Email Settings</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Default sender identity and footer configuration for all campaigns.</p>
              <div className="space-y-4 max-w-lg">
                <Field label="Default From Name">
                  <input value={emailSettings.from_name} onChange={e => setEmailSettings(p => ({ ...p, from_name: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Default From Email">
                  <input type="email" value={emailSettings.from_email} onChange={e => setEmailSettings(p => ({ ...p, from_email: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Email Footer Text">
                  <textarea rows={3} value={emailSettings.footer_text} onChange={e => setEmailSettings(p => ({ ...p, footer_text: e.target.value }))} className={inputClass + ' resize-none'} />
                </Field>
                <Field label="Unsubscribe Link Template">
                  <input value={emailSettings.unsubscribe_template} onChange={e => setEmailSettings(p => ({ ...p, unsubscribe_template: e.target.value }))} className={inputClass} />
                  <p className="text-[10px] text-slate-400 dark:text-[#a3a3a3] mt-1">Use {'{{unsubscribe_link}}'} as the placeholder.</p>
                </Field>
              </div>
            </div>
          )}

          {/* WhatsApp Settings */}
          {activeSection === 'whatsapp' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">WhatsApp Settings</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Connect your WhatsApp Business account for messaging campaigns.</p>
              <div className="space-y-4 max-w-lg">
                <Field label="WhatsApp Business Account ID">
                  <input value={whatsapp.account_id} onChange={e => setWhatsapp(p => ({ ...p, account_id: e.target.value }))} placeholder="e.g. 123456789012345" className={inputClass} />
                </Field>
                <Field label="Phone Number">
                  <input value={whatsapp.phone_number} onChange={e => setWhatsapp(p => ({ ...p, phone_number: e.target.value }))} placeholder="+91 98765 43210" className={inputClass} />
                </Field>
                <Field label="API Token">
                  <input type="password" value={whatsapp.api_token} onChange={e => setWhatsapp(p => ({ ...p, api_token: e.target.value }))} placeholder="Bearer token from Meta Developer Console" className={inputClass} />
                </Field>
              </div>
            </div>
          )}

          {/* SMS Settings */}
          {activeSection === 'sms' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">SMS Settings</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Configure your SMS gateway provider credentials.</p>
              <div className="space-y-4 max-w-lg">
                <Field label="Provider">
                  <select value={sms.provider} onChange={e => setSms(p => ({ ...p, provider: e.target.value as 'Twilio' | 'MSG91' }))} className={selectClass}>
                    <option>Twilio</option>
                    <option>MSG91</option>
                  </select>
                </Field>
                <Field label="Account SID">
                  <input value={sms.account_sid} onChange={e => setSms(p => ({ ...p, account_sid: e.target.value }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={inputClass} />
                </Field>
                <Field label="Auth Token">
                  <input type="password" value={sms.auth_token} onChange={e => setSms(p => ({ ...p, auth_token: e.target.value }))} placeholder="Your auth token" className={inputClass} />
                </Field>
                <Field label="Sender ID">
                  <input value={sms.sender_id} onChange={e => setSms(p => ({ ...p, sender_id: e.target.value }))} placeholder="HUBNST" className={inputClass} />
                </Field>
              </div>
            </div>
          )}

          {/* Compliance */}
          {activeSection === 'compliance' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Compliance</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Data privacy regulations and consent management.</p>
              <div className="max-w-lg space-y-0">
                <Toggle enabled={compliance.gdpr} onToggle={() => setCompliance(p => ({ ...p, gdpr: !p.gdpr }))} label="GDPR Mode" description="Enable GDPR-compliant consent collection and data handling." />
                <Toggle enabled={compliance.ccpa} onToggle={() => setCompliance(p => ({ ...p, ccpa: !p.ccpa }))} label="CCPA Mode" description="Enable California Consumer Privacy Act compliance features." />
                <Toggle enabled={compliance.double_optin} onToggle={() => setCompliance(p => ({ ...p, double_optin: !p.double_optin }))} label="Double Opt-in" description="Require email confirmation before activating new subscribers." />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-[#ededed]">Data Retention Period</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#a3a3a3] mt-0.5">Days to retain contact and event data.</p>
                  </div>
                  <select value={compliance.retention_days} onChange={e => setCompliance(p => ({ ...p, retention_days: Number(e.target.value) }))}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#333] bg-white dark:bg-[#161616] text-slate-900 dark:text-[#ededed] outline-none focus:border-blue-500 transition font-semibold w-32">
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Notifications</h2>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mb-5">Choose which events trigger email notifications to you.</p>
              <div className="max-w-lg">
                <Toggle enabled={notifications.campaign_sent} onToggle={() => setNotifications(p => ({ ...p, campaign_sent: !p.campaign_sent }))} label="Campaign Sent" description="Notify when a campaign finishes sending to all recipients." />
                <Toggle enabled={notifications.form_submission} onToggle={() => setNotifications(p => ({ ...p, form_submission: !p.form_submission }))} label="Form Submission" description="Notify on every new lead form submission." />
                <Toggle enabled={notifications.new_lead} onToggle={() => setNotifications(p => ({ ...p, new_lead: !p.new_lead }))} label="New Lead" description="Notify when a new lead is created or imported." />
                <Toggle enabled={notifications.workflow_triggered} onToggle={() => setNotifications(p => ({ ...p, workflow_triggered: !p.workflow_triggered }))} label="Workflow Triggered" description="Notify when an automation workflow is triggered." />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-[#1f1f1f]">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 size={13} className="animate-spin" />} Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
