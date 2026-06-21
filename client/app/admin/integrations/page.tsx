'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plug, Check, X, Loader2, RefreshCw, ExternalLink, Key,
  Wifi, WifiOff, Settings, Shield, Zap, AlertCircle, Eye, EyeOff,
  ChevronRight, Globe, Mail, Phone, Hash, Bot, BarChart2, Users,
  CheckCircle, XCircle,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
}

interface Integration {
  provider: string;
  name: string;
  desc: string;
  category: string;
  badge?: string;
  gradient: string;
  icon: React.ReactNode;
  fields: FieldDef[];
  oauthProvider?: string;
  docsUrl?: string;
}

interface SavedIntegration {
  provider: string;
  credentials: Record<string, string>;
  enabled: boolean;
  connected_at: string;
}

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────
function MetaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973.14.603.35 1.142.637 1.605.566.946 1.365 1.494 2.267 1.494.67 0 1.174-.31 1.754-.99.278-.327.566-.78.907-1.523l.006-.013c.558-1.222 1.077-3.09 1.077-4.995 0-.26-.014-.52-.04-.76a7.4 7.4 0 0 0-.125-.8c.18-.45.42-.91.694-1.32.538-.814 1.117-1.3 1.727-1.3.38 0 .732.126 1.08.378.347.25.69.63 1.04 1.14.67.985 1.286 2.492 1.702 4.27.093.405.173.8.235 1.19.186 1.215.27 2.425.27 3.663 0 .475-.03.95-.088 1.42a5.42 5.42 0 0 1-.26 1.17c.28.063.57.095.864.095.765 0 1.5-.22 2.11-.63a4.87 4.87 0 0 0 1.57-1.7c.434-.79.703-1.7.8-2.71.05-.5.076-1.01.076-1.55 0-2.57-.644-5.197-1.835-7.186C17.318 5.31 15.603 4.03 13.635 4.03c-1.39 0-2.582.6-3.536 1.578a8.47 8.47 0 0 0-.84 1.045A6.67 6.67 0 0 0 8.41 5.6C7.463 4.625 6.28 4.03 4.915 4.03H6.915z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ─── Integration Registry ─────────────────────────────────────────────────────
const INTEGRATIONS: Integration[] = [
  {
    provider: 'meta-ads',
    name: 'Meta Business',
    desc: 'Sync Facebook & Instagram ad leads directly into your CRM. Pull leads from Lead Ads, get ad insights, and manage campaigns.',
    category: 'Advertising',
    badge: 'OAuth + API',
    gradient: 'linear-gradient(135deg, #1877F2, #0D5DBF)',
    icon: <MetaIcon size={20} />,
    oauthProvider: 'meta-ads',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAGxx...', hint: 'Long-lived token from Graph API Explorer or OAuth' },
      { key: 'business_account_id', label: 'Business Account ID', placeholder: '1234567890', hint: 'Found in Business Settings → Business Info' },
    ],
  },
  {
    provider: 'whatsapp',
    name: 'WhatsApp Business',
    desc: 'Send WhatsApp campaigns and automated messages to leads using Meta Cloud API. Supports templates, media, and interactive messages.',
    category: 'Messaging',
    badge: 'Cloud API',
    gradient: 'linear-gradient(135deg, #25D366, #128C7E)',
    icon: <WhatsAppIcon size={20} />,
    oauthProvider: 'whatsapp',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890', hint: 'From WhatsApp → Getting Started in Meta Developer Portal' },
      { key: 'access_token', label: 'Permanent Access Token', type: 'password', placeholder: 'EAAGxx...', hint: 'System User token with whatsapp_business_messaging permission' },
      { key: 'waba_id', label: 'WABA ID (optional)', placeholder: '9876543210', hint: 'WhatsApp Business Account ID for template management' },
    ],
  },
  {
    provider: 'instagram',
    name: 'Instagram Business',
    desc: 'Connect your Instagram Business account via Meta. Sync commenters from posts as leads, pull media insights, and track engagement.',
    category: 'Social',
    badge: 'OAuth + API',
    gradient: 'linear-gradient(135deg, #E1306C, #833AB4, #F77737)',
    icon: <InstagramIcon size={20} />,
    oauthProvider: 'instagram',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAGxx...', hint: 'User token with instagram_basic + instagram_manage_comments permissions' },
      { key: 'ig_user_id', label: 'Instagram Business Account ID', placeholder: '17841400000000000', hint: 'Found via Graph API Explorer → /me/accounts → instagram_business_account.id' },
    ],
  },
  {
    provider: 'smtp',
    name: 'Email (SMTP)',
    desc: 'Send transactional emails and campaign emails via your own SMTP server or Gmail App Password.',
    category: 'Email',
    badge: 'SMTP',
    gradient: 'linear-gradient(135deg, #EA4335, #C5221F)',
    icon: <Mail size={20} />,
    fields: [
      { key: 'host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Port', placeholder: '587' },
      { key: 'user', label: 'Username / Email', placeholder: 'you@gmail.com' },
      { key: 'pass', label: 'App Password', type: 'password', placeholder: '••••••••', hint: 'For Gmail: use App Password, not your login password' },
    ],
  },
  {
    provider: 'twilio',
    name: 'Twilio SMS',
    desc: 'Send SMS notifications, OTPs, and bulk SMS campaigns to leads via Twilio.',
    category: 'SMS',
    badge: 'REST API',
    gradient: 'linear-gradient(135deg, #F22F46, #CF0A23)',
    icon: <Phone size={20} />,
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxx' },
      { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: '••••••••' },
      { key: 'from_number', label: 'Twilio Phone Number', placeholder: '+1234567890' },
    ],
  },
  {
    provider: 'slack',
    name: 'Slack Alerts',
    desc: 'Push lead notifications, ticket alerts, and team updates to Slack channels in real-time.',
    category: 'Team Comms',
    badge: 'Webhook',
    gradient: 'linear-gradient(135deg, #4A154B, #611F69)',
    icon: <Hash size={20} />,
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', hint: 'From your Slack App → OAuth & Permissions' },
      { key: 'webhook_url', label: 'Webhook URL (optional)', placeholder: 'https://hooks.slack.com/...', hint: 'Incoming Webhook URL for a specific channel' },
    ],
  },
  {
    provider: 'ai',
    name: 'AI Provider',
    desc: 'Power AI Studio, lead scoring, content generation, and sentiment analysis with OpenAI or Anthropic.',
    category: 'AI',
    badge: 'LLM',
    gradient: 'linear-gradient(135deg, #10A37F, #0D8B6C)',
    icon: <Bot size={20} />,
    fields: [
      { key: 'openai_key', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-...', hint: 'From platform.openai.com → API Keys' },
      { key: 'anthropic_key', label: 'Anthropic API Key (optional)', type: 'password', placeholder: 'sk-ant-...', hint: 'From console.anthropic.com → API Keys' },
    ],
  },
];

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
  const bg = type === 'success' ? 'bg-emerald-500/90' : type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90';
  return (
    <div className={`fixed bottom-5 right-5 z-[200] px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl flex items-center gap-2 backdrop-blur-sm ${bg}`}
      style={{ animation: 'slideUp 0.3s ease-out' }}>
      {type === 'success' ? <CheckCircle size={16} /> : type === 'error' ? <XCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

// ─── Credential Modal (with OAuth + Manual tabs for Meta) ─────────────────────
function CredentialModal({
  integration,
  saved,
  onClose,
  onSaved,
  showToast,
}: {
  integration: Integration;
  saved?: SavedIntegration;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  const isMetaOAuth = !!integration.oauthProvider;
  const [tab, setTab] = useState<'oauth' | 'manual'>(isMetaOAuth ? 'oauth' : 'manual');
  const [form, setForm] = useState<Record<string, string>>(
    () => integration.fields.reduce((acc, f) => ({ ...acc, [f.key]: saved?.credentials?.[f.key] || '' }), {})
  );
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await api.post('/marketing/integrations', {
        provider: integration.provider,
        credentials: form,
        enabled: true,
      });
      setMsg({ text: 'Credentials saved successfully', type: 'success' });
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message || 'Failed to save credentials', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMsg(null);
    try {
      await api.post('/marketing/integrations', {
        provider: integration.provider,
        credentials: form,
        enabled: true,
      });
      const res = await api.post(`/marketing/integrations/${integration.provider}/test`, {});
      setMsg({ text: res.data?.data?.message || 'Connection successful!', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err?.response?.data?.message || 'Connection test failed', type: 'error' });
    } finally {
      setTesting(false);
    }
  }

  async function handleOAuth() {
    if (!integration.oauthProvider) return;
    setOauthLoading(true);
    setMsg(null);
    try {
      const res = await api.get(`/marketing/integrations/meta/oauth-url?provider=${integration.oauthProvider}&redirect=/admin/integrations`);
      const url = res.data?.data?.url;
      if (url) {
        window.open(url, '_blank', 'width=700,height=600,scrollbars=yes');
        setMsg({ text: 'Meta login opened in a new window. Complete login there, then close this dialog.', type: 'info' });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to start OAuth flow';
      if (errMsg.includes('META_APP_ID not configured')) {
        setMsg({ text: 'META_APP_ID is not set on the server. Add it to server/.env file first.', type: 'error' });
      } else {
        setMsg({ text: errMsg, type: 'error' });
      }
    } finally {
      setOauthLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]" style={{ background: integration.gradient }} />
          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: integration.gradient }}>
                {integration.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{integration.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Configure credentials securely</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab switcher for Meta OAuth providers */}
        {isMetaOAuth && (
          <div className="flex px-6 pt-3 gap-2">
            <button
              onClick={() => { setTab('oauth'); setMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                tab === 'oauth'
                  ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <FacebookIcon />
              Login with Meta
            </button>
            <button
              onClick={() => { setTab('manual'); setMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                tab === 'manual'
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border-slate-300 dark:border-white/20'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Key size={11} />
              Paste API Key
            </button>
          </div>
        )}

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* OAuth Tab */}
          {tab === 'oauth' && isMetaOAuth && (
            <>
              <div className="p-4 rounded-xl text-xs leading-relaxed space-y-2 bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20">
                <p className="font-semibold text-blue-700 dark:text-blue-300">
                  {integration.provider === 'whatsapp'
                    ? '📱 Connect WhatsApp Business via Meta'
                    : integration.provider === 'instagram'
                    ? '📸 Connect Instagram Business via Meta'
                    : '🔵 Connect Meta / Facebook via OAuth'}
                </p>
                <p className="text-blue-600/80 dark:text-blue-300/70 text-[11px]">
                  {integration.provider === 'whatsapp'
                    ? "Opens a Meta login window. Log in with your Facebook account that owns the WhatsApp Business account, grant the required permissions, and you'll be connected automatically."
                    : integration.provider === 'instagram'
                    ? 'Opens a Meta login window. Log in with the Facebook account linked to your Instagram Business profile. Grant permissions to read posts and manage comments.'
                    : 'Opens a Meta login window. Log in and grant the requested permissions (Ads, Pages, Leads). Your long-lived token is stored securely.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(integration.provider === 'whatsapp'
                    ? ['whatsapp_business_management', 'whatsapp_business_messaging']
                    : integration.provider === 'instagram'
                    ? ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_insights', 'pages_read_engagement']
                    : ['ads_read', 'ads_management', 'pages_manage_ads', 'leads_retrieval']
                  ).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">{s}</span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl text-[11px] leading-relaxed bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
                <span className="font-bold">⚠️ Prerequisite:</span> Your server must have{' '}
                <code className="font-mono px-1 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-500/20">META_APP_ID</code> and{' '}
                <code className="font-mono px-1 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-500/20">META_APP_SECRET</code>{' '}
                set in <code className="font-mono text-[10px]">server/.env</code>.{' '}
                <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                  Get them from developers.facebook.com ↗
                </a>
              </div>

              <button
                onClick={handleOAuth}
                disabled={oauthLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.99]"
                style={{ background: integration.gradient }}
              >
                {oauthLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Opening Meta Login…</>
                ) : (
                  <><ExternalLink size={15} /> Login with Meta</>
                )}
              </button>

              <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                or switch to &quot;Paste API Key&quot; tab
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
              </div>
            </>
          )}

          {/* Manual Tab */}
          {tab === 'manual' && (
            <>
              {integration.fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.type === 'password' && !shown[f.key] ? 'password' : 'text'}
                      value={form[f.key] || ''}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/15 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-white/5 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none pr-10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShown(p => ({ ...p, [f.key]: !p[f.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                      >
                        {shown[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                  {f.hint && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pl-1">{f.hint}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Message feedback */}
          {msg && (
            <div className={`text-xs px-4 py-3 rounded-xl font-medium flex items-start gap-2 ${
              msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20' :
              msg.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-500/20' :
              'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20'
            }`}>
              {msg.type === 'success' ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : msg.type === 'error' ? <XCircle size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {tab === 'manual' && (
          <div className="px-6 pb-5 flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.99]"
              style={{ background: integration.gradient }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Save Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminIntegrationsPage() {
  const [saved, setSaved] = useState<SavedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFor, setModalFor] = useState<Integration | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [insightsFetching, setInsightsFetching] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get('/marketing/integrations');
      setSaved(res.data?.data?.settings || []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
    // Handle OAuth redirect result
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('oauth');
    const provider = params.get('provider');
    const name = params.get('name');
    const oauthMsg = params.get('msg');
    if (oauthResult === 'success') {
      const providerLabel = provider === 'whatsapp' ? 'WhatsApp Business' : provider === 'instagram' ? 'Instagram Business' : 'Meta Ads';
      showToast(`${providerLabel} connected successfully${name ? ` as ${name}` : ''}`, 'success');
      window.history.replaceState({}, '', window.location.pathname);
      fetchIntegrations();
    } else if (oauthResult === 'error') {
      showToast(oauthMsg ? decodeURIComponent(oauthMsg) : 'OAuth connection failed', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchIntegrations, showToast]);

  function getSaved(provider: string): SavedIntegration | undefined {
    return saved.find(s => s.provider === provider);
  }

  async function handleOAuth(integration: Integration) {
    if (!integration.oauthProvider) return;
    setOauthLoading(integration.provider);
    try {
      const res = await api.get(`/marketing/integrations/meta/oauth-url?provider=${integration.oauthProvider}&redirect=/admin/integrations`);
      const url = res.data?.data?.url;
      if (url) window.location.href = url;
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to start OAuth flow', 'error');
    } finally {
      setOauthLoading(null);
    }
  }

  async function handleDisconnect(provider: string) {
    setDisconnecting(provider);
    try {
      await api.delete(`/marketing/integrations/${provider}`);
      showToast('Integration disconnected', 'info');
      fetchIntegrations();
    } catch {
      showToast('Failed to disconnect', 'error');
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleSyncLeads(provider: string) {
    setSyncing(provider);
    try {
      const endpointMap: Record<string, string> = {
        'meta-ads': '/marketing/meta/sync-leads',
        'instagram': '/marketing/instagram/sync-leads',
        'whatsapp': '/marketing/whatsapp/sync-contacts',
      };
      const endpoint = endpointMap[provider];
      if (!endpoint) return;
      const res = await api.post(endpoint);
      const data = res.data?.data;
      const count = data?.synced ?? 0;
      const msg = data?.message || (provider === 'whatsapp'
        ? data?.message || 'WhatsApp account synced'
        : `Synced ${count} lead${count !== 1 ? 's' : ''} from ${provider === 'instagram' ? 'Instagram' : 'Meta'}`);
      showToast(msg, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Sync failed', 'error');
    } finally {
      setSyncing(null);
    }
  }

  async function handleAdInsights() {
    setInsightsFetching(true);
    try {
      const res = await api.post('/marketing/meta/ad-insights');
      const data = res.data?.data;
      const total = data?.total ?? 0;
      showToast(`Fetched insights for ${total} campaign${total !== 1 ? 's' : ''}. Check Marketing → Analytics.`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to fetch ad insights', 'error');
    } finally {
      setInsightsFetching(false);
    }
  }

  const categoryOrder = ['Advertising', 'Social', 'Messaging', 'Email', 'SMS', 'Team Comms', 'AI'];
  const grouped = categoryOrder.map(cat => ({
    cat,
    items: INTEGRATIONS.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0);

  const connectedCount = saved.filter(s => s.enabled).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading integrations…</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plug size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Third-Party Integrations</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your tools to automate workflows, sync leads, and power campaigns.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {connectedCount}/{INTEGRATIONS.length} Connected
              </span>
            </div>
            <button
              onClick={fetchIntegrations}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Integration Cards by Category */}
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{cat}</h3>
              <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map(intg => {
                const s = getSaved(intg.provider);
                const isConnected = s?.enabled === true;
                const isOAuth = !!intg.oauthProvider;
                const isMeta = intg.provider === 'meta-ads';
                const isInstagram = intg.provider === 'instagram';
                const isWhatsApp = intg.provider === 'whatsapp';

                return (
                  <div
                    key={intg.provider}
                    className={`group relative bg-white dark:bg-[#1a1a2e] rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl ${
                      isConnected
                        ? 'border-emerald-200/60 dark:border-emerald-500/20 shadow-sm'
                        : 'border-slate-200/60 dark:border-white/[0.08] shadow-sm'
                    }`}
                  >
                    {/* Gradient accent bar */}
                    <div className="h-1 w-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: intg.gradient }} />

                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                            style={{ background: intg.gradient }}
                          >
                            {intg.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{intg.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {intg.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400">
                                  {intg.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                          isConnected
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/10'
                        }`}>
                          {isConnected ? <><CheckCircle size={10} /> Connected</> : <><WifiOff size={10} /> Not Connected</>}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{intg.desc}</p>

                      {/* Connected info */}
                      {isConnected && s?.connected_at && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mb-3">
                          <Shield size={10} />
                          Connected since {new Date(s.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}

                      {/* Docs link */}
                      {intg.docsUrl && (
                        <a
                          href={intg.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium mb-4 transition-colors"
                        >
                          <Globe size={10} /> View Documentation <ChevronRight size={10} />
                        </a>
                      )}

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 flex-wrap">
                        {isConnected ? (
                          <>
                            {(isMeta || isInstagram) && (
                              <button
                                onClick={() => handleSyncLeads(intg.provider)}
                                disabled={syncing === intg.provider}
                                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                                style={{ background: intg.gradient }}
                              >
                                {syncing === intg.provider
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Zap size={12} />}
                                Sync Leads
                              </button>
                            )}
                            {isMeta && (
                              <button
                                onClick={handleAdInsights}
                                disabled={insightsFetching}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                              >
                                {insightsFetching ? <Loader2 size={12} className="animate-spin" /> : <BarChart2 size={12} />}
                                Ad Insights
                              </button>
                            )}
                            {isWhatsApp && (
                              <button
                                onClick={() => handleSyncLeads(intg.provider)}
                                disabled={syncing === intg.provider}
                                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                                style={{ background: intg.gradient }}
                              >
                                {syncing === intg.provider
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Users size={12} />}
                                Sync Account
                              </button>
                            )}
                            <button
                              onClick={() => setModalFor(intg)}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-all"
                            >
                              <Settings size={12} /> Settings
                            </button>
                            <button
                              onClick={() => handleDisconnect(intg.provider)}
                              disabled={disconnecting === intg.provider}
                              className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 border border-red-200/50 dark:border-red-500/20 transition-all"
                            >
                              {disconnecting === intg.provider ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <>
                            {isOAuth && (
                              <button
                                onClick={() => handleOAuth(intg)}
                                disabled={oauthLoading === intg.provider}
                                className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                                style={{ background: intg.gradient }}
                              >
                                {oauthLoading === intg.provider
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <ExternalLink size={12} />}
                                Connect via OAuth
                              </button>
                            )}
                            <button
                              onClick={() => setModalFor(intg)}
                              className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <Key size={12} /> Enter API Key
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Credential Modal */}
        {modalFor && (
          <CredentialModal
            integration={modalFor}
            saved={getSaved(modalFor.provider)}
            onClose={() => setModalFor(null)}
            onSaved={() => { fetchIntegrations(); showToast('Integration saved successfully', 'success'); }}
            showToast={showToast}
          />
        )}

        {/* Toast */}
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </div>
    </>
  );
}
