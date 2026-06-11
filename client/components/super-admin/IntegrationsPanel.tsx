'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  MessageCircle,
  Mail,
  Smartphone,
  Phone,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Settings,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

const METADATA: Record<string, { label: string; icon: any; description: string }> = {
  whatsapp_api: { label: 'WhatsApp API', icon: MessageCircle, description: 'Business messaging via Meta Graph API' },
  email_service: { label: 'Email Service', icon: Mail, description: 'SMTP & Transactional email delivery' },
  sms_gateway: { label: 'SMS Gateway', icon: Smartphone, description: 'Twilio OTP & notifications gateway' },
  calling_api: { label: 'Calling API', icon: Phone, description: 'VoIP phone and call center integration' },
  payment_gateway: { label: 'Payment Gateway', icon: CreditCard, description: 'Stripe & Razorpay payment processor' },
  google_workspace: { label: 'Google Workspace', icon: Globe, description: 'Calendar sync & Drive documents storage' },
};

const INTEGRATION_FIELDS: Record<string, { label: string; key: string; type: string; placeholder: string }[]> = {
  whatsapp_api: [
    { label: 'Meta Graph API Token', key: 'metaGraphToken', type: 'text', placeholder: 'EAAGxx...' },
    { label: 'WhatsApp Business Account ID', key: 'whatsappBusinessAccountId', type: 'text', placeholder: '10987654321' },
    { label: 'Phone Number ID', key: 'phoneNumberId', type: 'text', placeholder: '1234567890' },
  ],
  email_service: [
    { label: 'SMTP Host', key: 'smtpHost', type: 'text', placeholder: 'smtp.gmail.com' },
    { label: 'SMTP Port', key: 'smtpPort', type: 'text', placeholder: '587' },
    { label: 'SMTP User', key: 'smtpUser', type: 'text', placeholder: 'user@gmail.com' },
    { label: 'SMTP Password', key: 'smtpPassword', type: 'password', placeholder: '••••••••' },
  ],
  sms_gateway: [
    { label: 'Twilio Account SID', key: 'twilioSid', type: 'text', placeholder: 'ACxxxx...' },
    { label: 'Twilio Auth Token', key: 'twilioToken', type: 'password', placeholder: '••••••••' },
    { label: 'Twilio Phone Number', key: 'twilioPhone', type: 'text', placeholder: '+1234567890' },
  ],
  calling_api: [
    { label: 'VoIP Endpoint URL', key: 'voipEndpoint', type: 'text', placeholder: 'https://api.twilio.com/...' },
    { label: 'VoIP API Key', key: 'voipApiKey', type: 'password', placeholder: '••••••••' },
  ],
  payment_gateway: [
    { label: 'Stripe Secret Key', key: 'stripeSecret', type: 'password', placeholder: 'sk_test_...' },
    { label: 'Stripe Publishable Key', key: 'stripePublish', type: 'text', placeholder: 'pk_test_...' },
    { label: 'Razorpay Key ID', key: 'razorpayId', type: 'text', placeholder: 'rzp_test_...' },
    { label: 'Razorpay Secret Key', key: 'razorpaySecret', type: 'password', placeholder: '••••••••' },
  ],
  google_workspace: [
    { label: 'Google Client ID', key: 'googleClientId', type: 'text', placeholder: 'xxxx.apps.googleusercontent.com' },
    { label: 'Google Client Secret', key: 'googleClientSecret', type: 'password', placeholder: '••••••••' },
  ],
};

const statusConfig = {
  connected: { label: 'Connected', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  disconnected: { label: 'Disconnected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', border: 'border-red-200' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', border: 'border-amber-200' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState<string>('disconnected');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/integrations');
      setIntegrations(res.data.data.integrations || []);
    } catch (err) {
      console.error('Failed to fetch integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const openConfigModal = (key: string) => {
    const integration = integrations.find((i) => i.key === key);
    if (integration) {
      setSelectedKey(key);
      setFormData(integration.config || {});
      setSelectedStatus(integration.status || 'disconnected');
      setMessage({ type: '', text: '' });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;

    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      // Automatically set status to connected if fields are completed, unless explicitly toggled
      const newStatus = selectedStatus === 'disconnected' ? 'connected' : selectedStatus;

      await api.patch(`/super-admin/integrations/${selectedKey}`, {
        status: newStatus,
        config: formData,
      });

      setMessage({ type: 'success', text: 'Credentials and settings saved successfully!' });
      await fetchIntegrations();
      setTimeout(() => setSelectedKey(null), 1500); // Auto close after success
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-3xl border border-slate-100 dark:border-[#1f1f1f] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-[#0F172A] dark:text-[#F9FAFB] text-base flex items-center gap-2">
              <Plug className="w-4 h-4 text-[#F59E0B]" />
              Integrations
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#9CA3AF] mt-0.5">Third-party service connections and status</p>
          </div>
          <button className="text-xs text-[#F59E0B] font-semibold hover:underline">Manage</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {integrations.map((integration) => {
              const meta = METADATA[integration.key] || { label: integration.name, icon: Plug, description: integration.description };
              const Icon = meta.icon;
              const statusVal = (integration.status || 'disconnected') as keyof typeof statusConfig;
              const config = statusConfig[statusVal] || statusConfig.disconnected;
              
              return (
                <motion.div
                  key={integration.key}
                  variants={item}
                  onClick={() => openConfigModal(integration.key)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-[#1f1f1f] hover:border-slate-300 hover:shadow-md transition-all duration-200 group cursor-pointer active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#161616] flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                    <Icon className="w-5 h-5 text-[#64748B] dark:text-[#9CA3AF] group-hover:text-[#F59E0B] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F9FAFB] truncate">{meta.label}</p>
                    <p className="text-[11px] text-[#94A3B8] dark:text-[#6B7280] truncate">{meta.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${config.dot} ${statusVal === 'connected' ? 'animate-pulse' : ''}`} />
                    <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {selectedKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedKey(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl z-10 border border-slate-100 dark:border-[#1f1f1f] overflow-hidden"
            >
              <button
                onClick={() => setSelectedKey(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors h-8 w-8 rounded-full hover:bg-slate-50 dark:bg-[#161616] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F172A] dark:text-[#F9FAFB]">
                    Configure {METADATA[selectedKey]?.label || selectedKey}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure secret credentials and delivery settings.
                  </p>
                </div>
              </div>

              {message.text && (
                <div className={`p-3.5 mb-5 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                {INTEGRATION_FIELDS[selectedKey]?.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 transition-colors bg-slate-50 dark:bg-[#161616]/50"
                      required
                    />
                  </div>
                )) || <p className="text-xs text-slate-400 italic">No credentials needed for this integration.</p>}

                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#0F172A] dark:text-[#F9FAFB] mb-1.5 block">
                    Integration Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#161616]/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="connected">Connected (Active)</option>
                    <option value="disconnected">Disconnected (Inactive)</option>
                    <option value="warning">Warning (Issues / Pending Verify)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedKey(null)}
                    className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:bg-[#161616] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 px-4 bg-[#F59E0B] text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
