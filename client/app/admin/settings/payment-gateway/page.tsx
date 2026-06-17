'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { 
  CreditCard, Key, Eye, EyeOff, Copy, Check, 
  Trash2, RefreshCw, AlertCircle, ShieldAlert, Sparkles, CheckCircle2 
} from 'lucide-react';
import api from '../../../../services/api'; // Assuming axios instance is here, or standard fetch/axios wrapper

interface GatewayStatus {
  gateway: 'stripe' | 'razorpay';
  is_active: boolean;
  is_verified: boolean;
  has_webhook: boolean;
}

export default function PaymentGatewaySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [gateways, setGateways] = useState<GatewayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Stripe form state
  const [stripePub, setStripePub] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [stripeWebhook, setStripeWebhook] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeCopied, setStripeCopied] = useState(false);

  // Razorpay form state
  const [razorpayId, setRazorpayId] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');
  const [razorpayWebhook, setRazorpayWebhook] = useState('');
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpayCopied, setRazorpayCopied] = useState(false);

  // Masking toggles (key -> visibility boolean)
  const [revealStates, setRevealStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  async function fetchGatewayStatus() {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/api/v1/tenant/payment-gateway/status');
      if (response.data.success) {
        setGateways(response.data.data.gateways || []);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch gateway statuses');
    } finally {
      setLoading(false);
    }
  }

  // 5-second reveal helper
  const handleReveal = (key: string) => {
    setRevealStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setRevealStates((prev) => ({ ...prev, [key]: false }));
    }, 5000);
  };

  const handleCopyWebhook = (url: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stripeStatus = gateways.find(g => g.gateway === 'stripe');
  const razorpayStatus = gateways.find(g => g.gateway === 'razorpay');

  const stripeWebhookUrl = `${apiBaseUrl}/api/v1/webhooks/stripe/${tenantId}`;
  const razorpayWebhookUrl = `${apiBaseUrl}/api/v1/webhooks/razorpay/${tenantId}`;

  const handleConnectStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post('/api/v1/tenant/payment-gateway/connect', {
        gateway: 'stripe',
        publishableKey: stripePub,
        keySecret: stripeSecret,
        webhookSecret: stripeWebhook
      });
      if (res.data.success) {
        setSuccessMessage('Stripe connected and verified successfully!');
        setStripePub('');
        setStripeSecret('');
        setStripeWebhook('');
        fetchGatewayStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to connect Stripe');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleConnectRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    setRazorpayLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post('/api/v1/tenant/payment-gateway/connect', {
        gateway: 'razorpay',
        keyId: razorpayId,
        keySecret: razorpaySecret,
        webhookSecret: razorpayWebhook
      });
      if (res.data.success) {
        setSuccessMessage('Razorpay connected and verified successfully!');
        setRazorpayId('');
        setRazorpaySecret('');
        setRazorpayWebhook('');
        fetchGatewayStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to connect Razorpay');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleDisconnect = async (gateway: 'stripe' | 'razorpay') => {
    if (!confirm(`Are you sure you want to disconnect ${gateway === 'stripe' ? 'Stripe' : 'Razorpay'}?`)) {
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.delete(`/api/v1/tenant/payment-gateway/${gateway}`);
      if (res.data.success) {
        setSuccessMessage(`${gateway === 'stripe' ? 'Stripe' : 'Razorpay'} disconnected successfully`);
        fetchGatewayStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || `Failed to disconnect ${gateway}`);
    }
  };

  if (user?.role === 'Super Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Super Admin is restricted from accessing tenant payment configurations for security compliance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" /> Payment Gateway Integration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect payment processors for customer invoices. Keys are securely stored and encrypted via AES-256.
          </p>
        </div>
        <button 
          onClick={fetchGatewayStatus} 
          disabled={loading}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition font-medium text-slate-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stripe Gateway Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Gateway</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Stripe Checkout</h3>
                <p className="text-xs text-slate-500 mt-1">Accept cards, wallets, and bank transfers worldwide.</p>
              </div>
              <div className="flex items-center gap-2">
                {stripeStatus?.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    Not Configured
                  </span>
                )}
              </div>
            </div>

            {stripeStatus?.is_active && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Webhook Endpoint Details</h4>
                <p className="text-[11px] text-slate-500">Configure Stripe webhooks to process payments in the background:</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
                  <input 
                    type="text" 
                    readOnly 
                    value={stripeWebhookUrl} 
                    className="flex-1 bg-transparent text-slate-700 text-xs font-mono select-all outline-none" 
                  />
                  <button 
                    onClick={() => handleCopyWebhook(stripeWebhookUrl, setStripeCopied)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition shrink-0"
                  >
                    {stripeCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Stripe event required: <code>payment_intent.succeeded</code></span>
                </div>
              </div>
            )}

            <form onSubmit={handleConnectStripe} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Stripe Publishable Key</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['stripe_pub'] ? 'text' : 'password'}
                    placeholder="pk_test_..."
                    value={stripePub}
                    onChange={(e) => setStripePub(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('stripe_pub')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['stripe_pub'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Stripe Secret Key</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['stripe_sec'] ? 'text' : 'password'}
                    placeholder="sk_test_..."
                    value={stripeSecret}
                    onChange={(e) => setStripeSecret(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('stripe_sec')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['stripe_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Stripe Webhook Secret (Recommended)</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['stripe_web'] ? 'text' : 'password'}
                    placeholder="whsec_..."
                    value={stripeWebhook}
                    onChange={(e) => setStripeWebhook(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('stripe_web')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['stripe_web'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={stripeLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {stripeLoading ? 'Testing & Saving...' : 'Connect Stripe'}
              </button>
            </form>
          </div>

          {stripeStatus?.is_active && (
            <div className="bg-red-50/40 border-t border-red-100 p-4 flex justify-between items-center">
              <span className="text-xs text-red-600 font-semibold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Disconnect Stripe</span>
              <button 
                onClick={() => handleDisconnect('stripe')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Razorpay Gateway Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">Gateway</span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Razorpay Checkout</h3>
                <p className="text-xs text-slate-500 mt-1">Accept payments via UPI, Cards, Netbanking and Wallets.</p>
              </div>
              <div className="flex items-center gap-2">
                {razorpayStatus?.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    Not Configured
                  </span>
                )}
              </div>
            </div>

            {razorpayStatus?.is_active && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Webhook Endpoint Details</h4>
                <p className="text-[11px] text-slate-500">Configure Razorpay webhooks to process payments in the background:</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
                  <input 
                    type="text" 
                    readOnly 
                    value={razorpayWebhookUrl} 
                    className="flex-1 bg-transparent text-slate-700 text-xs font-mono select-all outline-none" 
                  />
                  <button 
                    onClick={() => handleCopyWebhook(razorpayWebhookUrl, setRazorpayCopied)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition shrink-0"
                  >
                    {razorpayCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Razorpay events required: <code>order.paid</code>, <code>payment.captured</code></span>
                </div>
              </div>
            )}

            <form onSubmit={handleConnectRazorpay} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Razorpay Key ID</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['rzp_id'] ? 'text' : 'password'}
                    placeholder="rzp_test_..."
                    value={razorpayId}
                    onChange={(e) => setRazorpayId(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('rzp_id')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['rzp_id'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Razorpay Key Secret</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['rzp_sec'] ? 'text' : 'password'}
                    value={razorpaySecret}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('rzp_sec')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['rzp_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Razorpay Webhook Secret (Recommended)</label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                  <input
                    type={revealStates['rzp_web'] ? 'text' : 'password'}
                    placeholder="Webhook secret configured in Razorpay dashboard"
                    value={razorpayWebhook}
                    onChange={(e) => setRazorpayWebhook(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleReveal('rzp_web')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {revealStates['rzp_web'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={razorpayLoading}
                className="w-full py-2 bg-[#F5A623] hover:bg-[#E0961B] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {razorpayLoading ? 'Testing & Saving...' : 'Connect Razorpay'}
              </button>
            </form>
          </div>

          {razorpayStatus?.is_active && (
            <div className="bg-red-50/40 border-t border-red-100 p-4 flex justify-between items-center">
              <span className="text-xs text-red-600 font-semibold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Disconnect Razorpay</span>
              <button 
                onClick={() => handleDisconnect('razorpay')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
