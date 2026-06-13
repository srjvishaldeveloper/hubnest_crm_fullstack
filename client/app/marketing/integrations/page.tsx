'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, CheckCircle, Settings, X, Loader2, Zap,
  ExternalLink, AlertTriangle, Info,
  Shield, RefreshCw, Key, Copy, Eye, EyeOff, Link2, Wifi,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'url' | 'textarea';
  placeholder?: string;
  hint?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  gradient: string;
  iconBg: string;
  icon: string | React.ReactNode;
  fields: FieldDef[];
  docsUrl?: string;
  badge?: string;
  featured?: boolean;
}

interface SavedIntegration {
  provider: string;
  credentials: Record<string, string>;
  enabled: boolean;
  connected_at: string;
}

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────
function MetaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973.14.603.35 1.142.637 1.605.566.946 1.365 1.494 2.267 1.494.67 0 1.174-.31 1.754-.99.278-.327.566-.78.907-1.523l.006-.013c.558-1.222 1.077-3.09 1.077-4.995 0-.26-.014-.52-.04-.76a7.4 7.4 0 0 0-.125-.8c.18-.45.42-.91.694-1.32.538-.814 1.117-1.3 1.727-1.3.38 0 .732.126 1.08.378.347.25.69.63 1.04 1.14.67.985 1.286 2.492 1.702 4.27.093.405.173.8.235 1.19.186 1.215.27 2.425.27 3.663 0 .475-.03.95-.088 1.42a5.42 5.42 0 0 1-.26 1.17c.28.063.57.095.864.095.765 0 1.5-.22 2.11-.63a4.87 4.87 0 0 0 1.57-1.7c.434-.79.703-1.7.8-2.71.05-.5.076-1.01.076-1.55 0-2.57-.644-5.197-1.835-7.186C17.318 5.31 15.603 4.03 13.635 4.03c-1.39 0-2.582.6-3.536 1.578a8.47 8.47 0 0 0-.84 1.045A6.67 6.67 0 0 0 8.41 5.6C7.463 4.625 6.28 4.03 4.915 4.03H6.915zm6.72 0c1.968 0 3.683 1.28 4.871 3.113 1.34 2.065 2.044 4.74 2.044 7.306 0 .706-.07 1.369-.21 1.973-.14.603-.35 1.142-.637 1.605-.566.946-1.365 1.494-2.267 1.494-.67 0-1.174-.31-1.754-.99-.278-.327-.566-.78-.907-1.523l-.006-.013c-.558-1.222-1.077-3.09-1.077-4.995 0-.26.014-.52.04-.76.028-.27.07-.54.125-.8a7.27 7.27 0 0 0-.694-1.32c-.538-.814-1.117-1.3-1.727-1.3-.38 0-.732.126-1.08.378-.347.25-.69.63-1.04 1.14-.67.985-1.286 2.492-1.702 4.27-.093.405-.173.8-.235 1.19-.186 1.215-.27 2.425-.27 3.663 0 .475.03.95.088 1.42.06.42.154.816.26 1.17a4.7 4.7 0 0 1-.864.095c-.765 0-1.5-.22-2.11-.63a4.87 4.87 0 0 1-1.57-1.7c-.434-.79-.703-1.7-.8-2.71-.05-.5-.076-1.01-.076-1.55 0-2.57.644-5.197 1.835-7.186C10.332 5.31 12.047 4.03 14.015 4.03h-.38z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ─── Integration definitions ──────────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  // ─ Featured ─
  {
    id: 'meta-ads',
    name: 'Meta Business',
    description: 'Connect Facebook & Instagram ad accounts for campaign targeting, Lead Ads sync, and analytics.',
    longDescription: 'Link your Meta Business account to create, manage, and track ad campaigns directly from HubNest. Sync leads from Facebook Lead Ads automatically into your CRM pipeline.',
    category: 'Featured',
    gradient: 'from-blue-600 to-indigo-700',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    icon: <MetaIcon size={22} />,
    featured: true,
    badge: 'OAuth',
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/',
    fields: [
      { key: 'app_id', label: 'Meta App ID', placeholder: '1234567890', hint: 'Found in Meta for Developers › App › Settings › Basic' },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'EAAGxx...', hint: 'Keep confidential — never expose client-side.' },
      { key: 'access_token', label: 'User / Page Access Token', type: 'password', placeholder: 'EAAGxx...', hint: 'Long-lived page access token from Meta Graph API Explorer' },
      { key: 'business_account_id', label: 'Business Account ID', placeholder: '10987654321', hint: 'Your Meta Business Manager account ID' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send rich WhatsApp campaigns, automated messages, and OTP to contacts using Meta Cloud API.',
    longDescription: 'Use the WhatsApp Cloud API (Meta) to send template messages, notifications, and two-way conversations. Plugs directly into the campaign sending pipeline for WhatsApp channel campaigns.',
    category: 'Featured',
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-gradient-to-br from-green-400 to-emerald-600',
    icon: <WhatsAppIcon size={22} />,
    featured: true,
    badge: 'Cloud API',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890', hint: 'Found in WhatsApp › API Setup in Meta Developer console' },
      { key: 'waba_id', label: 'WhatsApp Business Account ID', placeholder: '10987654321', hint: 'Your WABA ID from Meta Business Manager' },
      { key: 'access_token', label: 'Permanent Access Token', type: 'password', placeholder: 'EAAGxx...', hint: 'Generate a permanent token in System User settings for production use' },
      { key: 'verify_token', label: 'Webhook Verify Token', placeholder: 'my_webhook_secret', hint: 'A secret string you create to verify webhook callbacks from Meta' },
    ],
  },
  // ─ Communication ─
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice, and WhatsApp messaging via Twilio infrastructure.',
    category: 'Communication',
    gradient: 'from-red-500 to-rose-600',
    iconBg: 'bg-red-500',
    icon: '📱',
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxx' },
      { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: '••••••••' },
      { key: 'phone_number', label: 'From Number', placeholder: '+1234567890', hint: 'Twilio verified phone number' },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Sync Gmail inbox and send campaign emails via Google SMTP.',
    category: 'Communication',
    gradient: 'from-slate-100 to-gray-200',
    iconBg: 'bg-white border border-slate-200',
    icon: '✉️',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'xxxx.apps.googleusercontent.com' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get CRM notifications and lead alerts in your Slack channels.',
    category: 'Communication',
    gradient: 'from-purple-600 to-violet-700',
    iconBg: 'bg-purple-600',
    icon: '💬',
    fields: [
      { key: 'webhook_url', label: 'Incoming Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...' },
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
    ],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Schedule and track Zoom meetings directly from CRM deals.',
    category: 'Communication',
    gradient: 'from-blue-500 to-sky-600',
    iconBg: 'bg-blue-500',
    icon: '📹',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxx' },
      { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
  // ─ E-commerce ─
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Sync payment data and customer info from Razorpay to your CRM.',
    category: 'E-commerce',
    gradient: 'from-blue-600 to-blue-800',
    iconBg: 'bg-blue-700',
    icon: '💳',
    fields: [
      { key: 'key_id', label: 'Key ID', placeholder: 'rzp_live_...' },
      { key: 'key_secret', label: 'Key Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Connect Stripe for payment lifecycle and customer tracking.',
    category: 'E-commerce',
    gradient: 'from-violet-600 to-purple-700',
    iconBg: 'bg-violet-600',
    icon: '💰',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: '••••••••' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Import Shopify customers and orders into HubNest CRM.',
    category: 'E-commerce',
    gradient: 'from-green-600 to-emerald-700',
    iconBg: 'bg-green-600',
    icon: '🛍️',
    fields: [
      { key: 'shop_domain', label: 'Shop Domain', placeholder: 'my-store.myshopify.com' },
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxx' },
      { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
  // ─ Analytics ─
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync Mailchimp audience and campaign stats to HubNest.',
    category: 'Analytics',
    gradient: 'from-yellow-400 to-orange-400',
    iconBg: 'bg-yellow-400',
    icon: '🐒',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: '••••••••-us1' },
      { key: 'server_prefix', label: 'Server Prefix', placeholder: 'us1' },
    ],
  },
  // ─ Automation ─
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect HubNest to 5,000+ apps via Zapier automations.',
    category: 'Automation',
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'bg-orange-500',
    icon: '⚡',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: '••••••••' },
    ],
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Push real-time CRM events to any custom HTTP endpoint.',
    category: 'Automation',
    gradient: 'from-slate-500 to-slate-700',
    iconBg: 'bg-slate-500',
    icon: '🔗',
    fields: [
      { key: 'endpoint_url', label: 'Endpoint URL', type: 'url', placeholder: 'https://your-server.com/hook' },
      { key: 'secret', label: 'Signing Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
];

const CATEGORIES = ['All', 'Featured', 'Communication', 'E-commerce', 'Analytics', 'Automation'];

function isMasked(v: string) { return v === '••••••••••••'; }

// ─── Connect Modal ────────────────────────────────────────────────────────────
function ConnectModal({
  integration,
  existingCreds,
  onClose,
  onSave,
}: {
  integration: Integration;
  existingCreds: Record<string, string>;
  onClose: () => void;
  onSave: (provider: string, creds: Record<string, string>) => Promise<void>;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    integration.fields.forEach(f => { init[f.key] = existingCreds[f.key] || ''; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(integration.id, fields); onClose(); }
    finally { setSaving(false); }
  };

  const toggleReveal = (key: string) => setRevealed(p => ({ ...p, [key]: !p[key] }));
  const copyField = async (key: string, val: string) => {
    await navigator.clipboard.writeText(val).catch(() => null);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161616] rounded-3xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${integration.gradient} rounded-t-3xl p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                {typeof integration.icon === 'string'
                  ? <span className="text-xl">{integration.icon}</span>
                  : integration.icon}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{integration.name}</h2>
                <p className="text-xs text-white/70">{integration.category}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Description */}
          <div className="flex gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{integration.longDescription || integration.description}</p>
          </div>

          {/* Docs link */}
          {integration.docsUrl && (
            <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> View API Documentation
            </a>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {integration.fields.map(f => {
              const isSecret = f.type === 'password';
              const isRevealed = revealed[f.key];
              const val = fields[f.key] || '';
              const hasMasked = isMasked(val);
              return (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider flex items-center gap-1">
                    {isSecret && <Key className="w-3 h-3" />}
                    {f.label}
                  </label>
                  <div className="relative">
                    <input
                      type={isSecret && !isRevealed ? 'password' : 'text'}
                      value={val}
                      onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={hasMasked ? '(unchanged — enter new value to update)' : (f.placeholder || `Enter ${f.label}`)}
                      className="w-full text-sm p-3 pr-20 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 font-mono transition"
                    />
                    {isSecret && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button type="button" onClick={() => toggleReveal(f.key)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition">
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {val && !hasMasked && (
                          <button type="button" onClick={() => copyField(f.key, val)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            <Copy className={`w-3.5 h-3.5 ${copied === f.key ? 'text-green-500' : 'text-slate-400'}`} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {f.hint && (
                    <p className="text-[11px] text-slate-400 dark:text-[#666] leading-relaxed flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      {f.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Security note */}
          <div className="flex gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Credentials are stored securely per your workspace. Secrets are masked in the UI and never returned in plain text after saving.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-2xl transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 py-2.5 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-sm bg-gradient-to-r ${integration.gradient} hover:opacity-90 disabled:opacity-60`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Featured Hero Card ────────────────────────────────────────────────────────
function FeaturedCard({
  integration,
  savedData,
  onConnect,
  onDisconnect,
  onTest,
  testResult,
  testing,
}: {
  integration: Integration;
  savedData?: SavedIntegration;
  onConnect: (i: Integration) => void;
  onDisconnect: (id: string) => void;
  onTest: (id: string) => void;
  testResult?: { success: boolean; message: string };
  testing: boolean;
}) {
  const isConnected = !!savedData?.enabled;

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white dark:bg-[#161616] shadow-sm transition-shadow hover:shadow-md ${isConnected ? 'border-green-200 dark:border-green-900/40' : 'border-slate-200/60 dark:border-[#1f1f1f]'}`}>
      <div className={`h-1.5 w-full bg-gradient-to-r ${integration.gradient}`} />
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${integration.iconBg}`}>
              {typeof integration.icon === 'string'
                ? <span className="text-2xl">{integration.icon}</span>
                : integration.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#ededed]">{integration.name}</h3>
                {integration.badge && (
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full tracking-wider uppercase bg-gradient-to-r ${integration.gradient} text-white`}>
                    {integration.badge}
                  </span>
                )}
                {isConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-green-600 rounded-full border border-green-200 dark:border-green-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5 leading-relaxed max-w-xs">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {integration.docsUrl && (
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {isConnected && (
              <>
                <button onClick={() => onTest(integration.id)} disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition">
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                  Test
                </button>
                <button onClick={() => onConnect(integration)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition">
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Long desc */}
        {integration.longDescription && (
          <p className="text-xs text-slate-400 dark:text-[#666] leading-relaxed border-t border-slate-100 dark:border-[#1f1f1f] pt-3">
            {integration.longDescription}
          </p>
        )}

        {/* Test result */}
        {testResult && (
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {testResult.message}
          </div>
        )}

        {/* Action */}
        {isConnected ? (
          <button onClick={() => onDisconnect(integration.id)}
            className="w-full py-2.5 text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl transition border border-red-100 dark:border-red-900/30">
            Disconnect
          </button>
        ) : (
          <button onClick={() => onConnect(integration)}
            className={`w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${integration.gradient} hover:opacity-90 rounded-2xl transition shadow-sm flex items-center justify-center gap-2`}>
            <Link2 className="w-4 h-4" /> Connect {integration.name}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Regular Card ─────────────────────────────────────────────────────────────
function IntegrationCard({
  integration,
  savedData,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  savedData?: SavedIntegration;
  onConnect: (i: Integration) => void;
  onDisconnect: (id: string) => void;
}) {
  const isConnected = !!savedData?.enabled;
  return (
    <div className={`bg-white dark:bg-[#161616] rounded-2xl border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow ${isConnected ? 'border-green-200 dark:border-green-900/40' : 'border-slate-200/60 dark:border-[#1f1f1f]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${integration.iconBg}`}>
            {typeof integration.icon === 'string'
              ? <span className="text-lg">{integration.icon}</span>
              : <span className="scale-75 block">{integration.icon}</span>}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">{integration.name}</p>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full mt-0.5 border border-green-100 dark:border-green-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
            )}
          </div>
        </div>
        {isConnected && (
          <button onClick={() => onConnect(integration)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0">
            <Settings className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-[#a3a3a3] leading-relaxed">{integration.description}</p>
      <div className="mt-auto">
        {isConnected ? (
          <button onClick={() => onDisconnect(integration.id)}
            className="w-full py-2 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-xl transition">
            Disconnect
          </button>
        ) : (
          <button onClick={() => onConnect(integration)}
            className={`w-full py-2 text-xs font-semibold text-white bg-gradient-to-r ${integration.gradient} hover:opacity-90 rounded-xl transition shadow-sm`}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [savedMap, setSavedMap] = useState<Record<string, SavedIntegration>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Integration | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      const r = await api.get('/marketing/integrations');
      const list: SavedIntegration[] = r.data?.data?.settings || [];
      const map: Record<string, SavedIntegration> = {};
      list.forEach((i: SavedIntegration) => { map[i.provider] = i; });
      setSavedMap(map);
    } catch {
      // API may not be migrated yet — start empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

  const handleSave = async (provider: string, credentials: Record<string, string>) => {
    await api.post('/marketing/integrations', { provider, credentials, enabled: true });
    await loadIntegrations();
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this integration? Your credentials will be removed.')) return;
    try { await api.delete(`/marketing/integrations/${id}`); } catch { /* optimistic */ }
    setSavedMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResults(p => { const n = { ...p }; delete n[id]; return n; });
    try {
      const r = await api.post(`/marketing/integrations/${id}/test`);
      setTestResults(p => ({ ...p, [id]: r.data?.data || { success: false, message: 'No response' } }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Connection test failed';
      setTestResults(p => ({ ...p, [id]: { success: false, message: msg } }));
    } finally {
      setTesting(null); }
  };

  const connectedCount = Object.keys(savedMap).length;
  const featured = INTEGRATIONS.filter(i => i.category === 'Featured');
  const showFeatured = (category === 'All' || category === 'Featured') && !search;

  const searchResults = search
    ? INTEGRATIONS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    : [];

  const grouped = ['Communication', 'E-commerce', 'Analytics', 'Automation'].reduce((acc, cat) => {
    if (category !== 'All' && category !== cat) return acc;
    const items = INTEGRATIONS.filter(i => i.category === cat && (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())));
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Integrations</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Connect messaging platforms and tools to power your campaigns</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : (
            <>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-2xl">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-[10px] font-medium text-green-600/70">Connected</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 leading-none">{connectedCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl">
                <Zap className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-[10px] font-medium text-orange-500/70">Available</p>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400 leading-none">{INTEGRATIONS.length}</p>
                </div>
              </div>
            </>
          )}
          <button onClick={loadIntegrations} className="p-2 rounded-xl border border-slate-200 dark:border-[#1f1f1f] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations…"
            className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#161616] border border-slate-200/60 dark:border-[#1f1f1f] rounded-2xl p-1 shadow-sm">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${category === c ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured: Meta & WhatsApp ── */}
      {showFeatured && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full uppercase tracking-wider">Featured</span>
            <h2 className="text-sm font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">Meta & WhatsApp — Campaign Channels</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {featured.map(integration => (
              <FeaturedCard
                key={integration.id}
                integration={integration}
                savedData={savedMap[integration.id]}
                onConnect={i => setModal(i)}
                onDisconnect={handleDisconnect}
                onTest={handleTest}
                testResult={testResults[integration.id]}
                testing={testing === integration.id}
              />
            ))}
          </div>

          {/* Meta OAuth info banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#ededed] mb-1">Meta OAuth Redirect URI</h3>
                <p className="text-xs text-slate-600 dark:text-[#a3a3a3] leading-relaxed mb-2">
                  Add the following URL to your Meta App's Valid OAuth Redirect URIs in the App Dashboard:
                </p>
                <code className="block px-3 py-2 bg-white dark:bg-[#0d0d0d] rounded-xl font-mono text-xs text-indigo-600 dark:text-indigo-400 border border-blue-200 dark:border-blue-900/30 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/auth/meta/callback
                </code>
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Open Meta for Developers <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Search results ── */}
      {search && (
        searchResults.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f]">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No integrations found for "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map(integration => (
              <IntegrationCard key={integration.id} integration={integration} savedData={savedMap[integration.id]}
                onConnect={i => setModal(i)} onDisconnect={handleDisconnect} />
            ))}
          </div>
        )
      )}

      {/* ── Grouped categories ── */}
      {!search && Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(integration => (
              <IntegrationCard key={integration.id} integration={integration} savedData={savedMap[integration.id]}
                onConnect={i => setModal(i)} onDisconnect={handleDisconnect} />
            ))}
          </div>
        </section>
      ))}

      {/* ── Modal ── */}
      {modal && (
        <ConnectModal
          integration={modal}
          existingCreds={savedMap[modal.id]?.credentials || {}}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
