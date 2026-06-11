'use client';

import { useState } from 'react';
import {
  Search, CheckCircle, Settings, X, Loader2, Plus, Zap, Globe,
  MessageSquare, Mail, ShoppingBag, BarChart2, Webhook
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  textColor: string;
  icon: string;
  fields: { key: string; label: string; type?: string }[];
}

const INTEGRATIONS: Integration[] = [
  // Communication
  { id: 'meta-ads', name: 'Meta Ads', description: 'Connect Facebook & Instagram ad campaigns to your CRM pipeline.', category: 'Communication', color: 'bg-blue-600', textColor: 'text-white', icon: '📘', fields: [{ key: 'app_id', label: 'App ID' }, { key: 'app_secret', label: 'App Secret', type: 'password' }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Send automated WhatsApp messages to leads and customers.', category: 'Communication', color: 'bg-green-500', textColor: 'text-white', icon: '💬', fields: [{ key: 'phone_number_id', label: 'Phone Number ID' }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
  { id: 'twilio', name: 'Twilio', description: 'SMS, voice, and WhatsApp messaging via Twilio infrastructure.', category: 'Communication', color: 'bg-red-600', textColor: 'text-white', icon: '📱', fields: [{ key: 'account_sid', label: 'Account SID' }, { key: 'auth_token', label: 'Auth Token', type: 'password' }, { key: 'phone_number', label: 'From Number' }] },
  { id: 'gmail', name: 'Gmail', description: 'Sync Gmail inbox and send campaign emails via Google SMTP.', category: 'Communication', color: 'bg-white border border-slate-200', textColor: 'text-slate-700', icon: '✉️', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }] },
  { id: 'google-workspace', name: 'Google Workspace', description: 'Connect Workspace for calendar, docs, and email sync.', category: 'Communication', color: 'bg-blue-500', textColor: 'text-white', icon: '🏢', fields: [{ key: 'service_account_key', label: 'Service Account JSON', type: 'password' }] },
  { id: 'outlook', name: 'Outlook', description: 'Sync Microsoft Outlook calendar and email with HubNest.', category: 'Communication', color: 'bg-blue-700', textColor: 'text-white', icon: '📧', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }, { key: 'tenant_id', label: 'Tenant ID' }] },
  { id: 'slack', name: 'Slack', description: 'Get CRM notifications and lead alerts in your Slack channels.', category: 'Communication', color: 'bg-purple-600', textColor: 'text-white', icon: '💜', fields: [{ key: 'webhook_url', label: 'Webhook URL' }, { key: 'bot_token', label: 'Bot Token', type: 'password' }] },
  { id: 'telegram', name: 'Telegram', description: 'Send automated messages and notifications via Telegram bot.', category: 'Communication', color: 'bg-sky-500', textColor: 'text-white', icon: '✈️', fields: [{ key: 'bot_token', label: 'Bot Token', type: 'password' }, { key: 'chat_id', label: 'Chat ID' }] },
  { id: 'zoom', name: 'Zoom', description: 'Schedule and track Zoom meetings directly from CRM deals.', category: 'Communication', color: 'bg-blue-500', textColor: 'text-white', icon: '📹', fields: [{ key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', type: 'password' }] },
  { id: 'google-meet', name: 'Google Meet', description: 'Generate and attach Meet links to contact interactions.', category: 'Communication', color: 'bg-green-600', textColor: 'text-white', icon: '🎥', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }] },
  // E-commerce
  { id: 'razorpay', name: 'Razorpay', description: 'Sync Razorpay payment data and customer info to your CRM.', category: 'E-commerce', color: 'bg-blue-600', textColor: 'text-white', icon: '💳', fields: [{ key: 'key_id', label: 'Key ID' }, { key: 'key_secret', label: 'Key Secret', type: 'password' }] },
  { id: 'stripe', name: 'Stripe', description: 'Connect Stripe for payment lifecycle and customer tracking.', category: 'E-commerce', color: 'bg-violet-600', textColor: 'text-white', icon: '💰', fields: [{ key: 'publishable_key', label: 'Publishable Key' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }, { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' }] },
  { id: 'shopify', name: 'Shopify', description: 'Import Shopify customers and orders into HubNest CRM.', category: 'E-commerce', color: 'bg-green-600', textColor: 'text-white', icon: '🛍️', fields: [{ key: 'shop_domain', label: 'Shop Domain' }, { key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', type: 'password' }] },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Sync WooCommerce store orders and customers to CRM.', category: 'E-commerce', color: 'bg-purple-700', textColor: 'text-white', icon: '🛒', fields: [{ key: 'store_url', label: 'Store URL' }, { key: 'consumer_key', label: 'Consumer Key' }, { key: 'consumer_secret', label: 'Consumer Secret', type: 'password' }] },
  // CRM
  { id: 'salesforce', name: 'Salesforce', description: 'Bi-directional sync with Salesforce CRM for enterprise teams.', category: 'CRM', color: 'bg-blue-500', textColor: 'text-white', icon: '☁️', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }, { key: 'instance_url', label: 'Instance URL' }] },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync HubSpot contacts, deals, and companies with HubNest.', category: 'CRM', color: 'bg-orange-500', textColor: 'text-white', icon: '🧡', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'portal_id', label: 'Portal ID' }] },
  // Analytics
  { id: 'mailchimp', name: 'Mailchimp', description: 'Sync Mailchimp audience and campaign stats to HubNest.', category: 'Analytics', color: 'bg-yellow-400', textColor: 'text-yellow-900', icon: '🐒', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'server_prefix', label: 'Server Prefix' }] },
  // Automation
  { id: 'zapier', name: 'Zapier', description: 'Connect HubNest to 5,000+ apps via Zapier automations.', category: 'Automation', color: 'bg-orange-500', textColor: 'text-white', icon: '⚡', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }] },
  { id: 'n8n', name: 'n8n', description: 'Advanced self-hosted workflow automation with n8n nodes.', category: 'Automation', color: 'bg-gray-900', textColor: 'text-white', icon: '🔀', fields: [{ key: 'instance_url', label: 'Instance URL' }, { key: 'api_key', label: 'API Key', type: 'password' }] },
  { id: 'webhooks', name: 'Webhooks', description: 'Push real-time CRM events to any custom HTTP endpoint.', category: 'Automation', color: 'bg-slate-500', textColor: 'text-white', icon: '🔗', fields: [{ key: 'endpoint_url', label: 'Endpoint URL' }, { key: 'secret', label: 'Signing Secret', type: 'password' }] },
];

const CATEGORIES = ['All', 'Communication', 'E-commerce', 'CRM', 'Analytics', 'Automation'];

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [connected, setConnected] = useState<Record<string, Record<string, string>>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [modal, setModal] = useState<Integration | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [settingsModal, setSettingsModal] = useState<Integration | null>(null);

  function openConnect(integration: Integration) {
    const existingFields: Record<string, string> = {};
    integration.fields.forEach(f => { existingFields[f.key] = (connected[integration.id] || {})[f.key] || ''; });
    setFields(existingFields);
    setModal(integration);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setConnected(prev => ({ ...prev, [modal.id]: fields }));
    setModal(null);
    setFields({});
    setSaving(false);
  }

  function handleDisconnect(id: string) {
    if (!confirm('Disconnect this integration?')) return;
    setConnected(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const connectedCount = Object.keys(connected).length;

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === 'All' || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = CATEGORIES.filter(c => c !== 'All').reduce((acc, cat) => {
    const items = filtered.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#ededed]">Integrations</h1>
          <p className="text-sm text-slate-500 dark:text-[#a3a3a3] mt-0.5">Connect your favorite tools to HubNest CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">{connectedCount} Connected</span>
          </div>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm px-4 py-2.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..."
            className="bg-transparent text-sm text-slate-700 dark:text-[#ededed] outline-none w-full placeholder:text-slate-400" />
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#161616] border border-slate-200/60 dark:border-[#1f1f1f] rounded-2xl p-1 shadow-sm">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${category === c ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-[#a3a3a3] hover:text-slate-700 dark:hover:text-[#ededed]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm">
          <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-[#a3a3a3]">No integrations match your search</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wider mb-4">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((integration) => {
                  const isConnected = !!connected[integration.id];
                  return (
                    <div key={integration.id} className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${integration.color} ${integration.textColor}`}>
                            {integration.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-[#ededed]">{integration.name}</p>
                            {isConnected && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full mt-0.5">
                                <CheckCircle className="w-2.5 h-2.5" /> Connected
                              </span>
                            )}
                          </div>
                        </div>
                        {isConnected && (
                          <button onClick={() => { setSettingsModal(integration); openConnect(integration); }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0">
                            <Settings className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#a3a3a3] leading-relaxed">{integration.description}</p>
                      <div className="mt-auto">
                        {isConnected ? (
                          <button onClick={() => handleDisconnect(integration.id)}
                            className="w-full py-2 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-xl transition">
                            Disconnect
                          </button>
                        ) : (
                          <button onClick={() => openConnect(integration)}
                            className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/60 dark:border-[#1f1f1f] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${modal.color} ${modal.textColor}`}>
                  {modal.icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-[#ededed]">
                    {connected[modal.id] ? 'Update' : 'Connect'} {modal.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{modal.category}</p>
                </div>
              </div>
              <button onClick={() => { setModal(null); setSettingsModal(null); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleConnect} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3]">{modal.description}</p>
              {modal.fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-[#a3a3a3] uppercase tracking-wide">{f.label}</label>
                  <input
                    required
                    type={f.type || 'text'}
                    value={fields[f.key] || ''}
                    onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.type === 'password' ? '••••••••••••' : `Enter ${f.label}`}
                    className="w-full text-sm p-2.5 bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#1f1f1f] rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-[#ededed] placeholder:text-slate-400 font-mono" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setModal(null); setSettingsModal(null); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {connected[modal.id] ? 'Update' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
