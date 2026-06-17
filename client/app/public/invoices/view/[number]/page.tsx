'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { AlertCircle, Download, Printer, CreditCard, Lock, Sparkles, CheckCircle2, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface LineItem {
  description: string; hsn: string; qty: number; unit: string;
  rate: number; discount: number; taxable: number;
  gstType: 'CGST+SGST' | 'IGST' | 'Exempt';
  gstRate: number; cgst: number; sgst: number; igst: number; amount: number;
}

interface InvoiceMeta {
  sellerName?: string; sellerGstin?: string; sellerAddress?: string;
  sellerPan?: string; sellerPhone?: string; sellerEmail?: string;
  customerGstin?: string; customerAddress?: string;
  placeOfSupply?: string; reverseCharge?: boolean;
  items?: LineItem[];
  totalCgst?: number; totalSgst?: number; totalIgst?: number;
  subTotal?: number; grandTotal?: number;
  bankName?: string; accountNo?: string; ifsc?: string;
  accountHolder?: string; paymentTerms?: string;
  userNotes?: string; termsAndConditions?: string;
  template?: string; poNumber?: string;
  ewayBill?: string;
  challanNo?: string;
  challanDate?: string;
  shipSameAsBill?: boolean;
  shippingName?: string;
  shippingAddress?: string;
  shippingGstin?: string;
  shippingState?: string;
}

interface PublicInvoice {
  invoice_number: string; customer_name: string;
  amount: number; tax: number; total: number;
  status: string; due_date: string; created_at: string;
  paid_date: string | null; tenant_name: string;
  notes: string | null;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, string> = {
  modern: '#2563eb', classic: '#1e3a5f', emerald: '#059669', saffron: '#d97706',
  maroon: '#9f1239', slate: '#475569', violet: '#7c3aed', teal: '#0d9488',
  sunset: '#ea580c', indigo: '#4338ca', rose: '#e11d48', forest: '#166534',
  navy: '#1e3a5f', copper: '#92400e', graphite: '#1f2937',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(num: number): string {
  if (!num) return 'Zero Rupees Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function cv(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+cv(n%100) : '');
    if (n < 100000) return cv(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+cv(n%1000) : '');
    if (n < 10000000) return cv(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+cv(n%100000) : '');
    return cv(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+cv(n%10000000) : '');
  }
  const r = Math.floor(num), p = Math.round((num-r)*100);
  return cv(r)+' Rupees'+(p > 0 ? ' and '+cv(p)+' Paise' : '')+' Only';
}

// ─── INVOICE PREVIEW ─────────────────────────────────────────────────────────

function InvoicePreview({ inv, meta, printRef }: {
  inv: PublicInvoice; meta: InvoiceMeta; printRef: React.RefObject<HTMLDivElement | null>;
}) {
  const accent = TEMPLATES[meta.template || 'modern'] || '#2563eb';
  const items = meta.items || [];
  const hasCgstSgst = items.some(i => i.gstType === 'CGST+SGST' && i.cgst > 0);
  const hasIgst     = items.some(i => i.gstType === 'IGST'       && i.igst > 0);

  const subTotal    = meta.subTotal    ?? parseFloat(String(inv.amount));
  const totalCgst   = meta.totalCgst   ?? 0;
  const totalSgst   = meta.totalSgst   ?? 0;
  const totalIgst   = meta.totalIgst   ?? 0;
  const grandTotal  = meta.grandTotal  ?? parseFloat(String(inv.total));
  const totalDiscount = items.reduce((s, i) => s + i.qty * i.rate * (i.discount / 100), 0);
  const raw = subTotal + totalCgst + totalSgst + totalIgst;
  const roundOff = +(Math.round(raw) - raw).toFixed(2);

  const invoiceDate = inv.created_at
    ? new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={printRef} className="bg-white text-[#1a1a1a] text-[11px] leading-snug w-full" style={{ fontFamily: 'Arial,sans-serif' }}>
      {/* Header */}
      <div style={{ background: accent }} className="px-6 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-black tracking-wide uppercase">{meta.sellerName || inv.tenant_name || 'Company'}</h1>
          {meta.sellerGstin && <p className="text-white/80 text-[10px] mt-0.5">GSTIN: {meta.sellerGstin}</p>}
          {meta.sellerPan   && <p className="text-white/80 text-[10px]">PAN: {meta.sellerPan}</p>}
          {meta.sellerAddress && <p className="text-white/70 text-[10px] mt-1">{meta.sellerAddress}</p>}
          {meta.sellerPhone && <p className="text-white/70 text-[10px]">Ph: {meta.sellerPhone}{meta.sellerEmail ? ` | ${meta.sellerEmail}` : ''}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-white text-3xl font-black uppercase tracking-widest">TAX INVOICE</h2>
          <div className="mt-2 space-y-0.5">
            <p className="text-white/90 text-[11px]"><span className="font-bold">Invoice No:</span> {inv.invoice_number}</p>
            <p className="text-white/90 text-[11px]"><span className="font-bold">Date:</span> {invoiceDate}</p>
            <p className="text-white/90 text-[11px]"><span className="font-bold">Due Date:</span> {dueDate}</p>
            {meta.poNumber && <p className="text-white/90 text-[11px]"><span className="font-bold">P.O.:</span> {meta.poNumber}</p>}
          </div>
        </div>
      </div>

      {/* Bill To / Ship To / Supply Details */}
      <div className="grid grid-cols-3 border-b border-gray-300">
        {!meta.shipSameAsBill && meta.shippingAddress ? (
          <>
            <div className="px-5 py-3 border-r border-gray-300">
              <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Bill To</p>
              <p className="font-bold text-sm">{inv.customer_name}</p>
              {meta.customerGstin   && <p className="text-[10px] text-gray-600">GSTIN: {meta.customerGstin}</p>}
              {meta.customerAddress && <p className="text-[10px] text-gray-600">{meta.customerAddress}</p>}
            </div>
            <div className="px-5 py-3 border-r border-gray-300">
              <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Ship To</p>
              <p className="font-bold text-sm">{meta.shippingName || inv.customer_name}</p>
              {meta.shippingGstin   && <p className="text-[10px] text-gray-600">GSTIN: {meta.shippingGstin}</p>}
              {meta.shippingAddress && <p className="text-[10px] text-gray-600">{meta.shippingAddress}</p>}
            </div>
          </>
        ) : (
          <div className="col-span-2 px-5 py-3 border-r border-gray-300">
            <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Bill To</p>
            <p className="font-bold text-sm">{inv.customer_name}</p>
            {meta.customerGstin   && <p className="text-[10px] text-gray-600">GSTIN: {meta.customerGstin}</p>}
            {meta.customerAddress && <p className="text-[10px] text-gray-600">{meta.customerAddress}</p>}
          </div>
        )}
        <div className="px-5 py-3">
          <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Supply Details</p>
          {meta.placeOfSupply && <p className="text-[10px]"><span className="font-bold">Place of Supply:</span> {meta.placeOfSupply}</p>}
          <p className="text-[10px]"><span className="font-bold">Reverse Charge:</span> {meta.reverseCharge ? 'Yes' : 'No'}</p>
          {meta.paymentTerms   && <p className="text-[10px]"><span className="font-bold">Payment Terms:</span> {meta.paymentTerms}</p>}
          {meta.ewayBill && <p className="text-[10px]"><span className="font-bold">E-Way Bill:</span> {meta.ewayBill}</p>}
          {meta.challanNo && <p className="text-[10px]"><span className="font-bold">Challan No:</span> {meta.challanNo}{meta.challanDate ? ` (${meta.challanDate})` : ''}</p>}
          <p className="text-[10px] mt-1">
            <span className={`font-bold px-1.5 py-0.5 rounded text-white text-[9px]`} style={{ background: accent }}>{inv.status}</span>
          </p>
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 ? (
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr style={{ background: accent }}>
              {['#','Description','HSN/SAC','Qty','Unit','Rate','Disc%','Taxable',
                ...(hasCgstSgst ? ['CGST','SGST'] : []),
                ...(hasIgst     ? ['IGST']         : []),
                'Amount'].map((h,i) => (
                <th key={i} className="text-white text-left px-2 py-1.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={idx%2===0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-2 py-1 text-center text-gray-500 border-b border-gray-200">{idx+1}</td>
                <td className="px-2 py-1 border-b border-gray-200 font-medium">{item.description || '—'}</td>
                <td className="px-2 py-1 text-center border-b border-gray-200 text-gray-500">{item.hsn||'—'}</td>
                <td className="px-2 py-1 text-center border-b border-gray-200">{item.qty}</td>
                <td className="px-2 py-1 text-center border-b border-gray-200 text-gray-500">{item.unit}</td>
                <td className="px-2 py-1 text-right border-b border-gray-200">{item.rate.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                <td className="px-2 py-1 text-right border-b border-gray-200 text-gray-500">{item.discount>0 ? `${item.discount}%` : '—'}</td>
                <td className="px-2 py-1 text-right border-b border-gray-200">{item.taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                {hasCgstSgst && <td className="px-2 py-1 text-right border-b border-gray-200">{item.gstType==='CGST+SGST' ? `${item.gstRate/2}% ${item.cgst.toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'}</td>}
                {hasCgstSgst && <td className="px-2 py-1 text-right border-b border-gray-200">{item.gstType==='CGST+SGST' ? `${item.gstRate/2}% ${item.sgst.toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'}</td>}
                {hasIgst     && <td className="px-2 py-1 text-right border-b border-gray-200">{item.gstType==='IGST' ? `${item.gstRate}% ${item.igst.toLocaleString('en-IN',{minimumFractionDigits:2})}` : '—'}</td>}
                <td className="px-2 py-1 text-right border-b border-gray-200 font-bold">{item.amount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-5 py-4 border-b border-gray-300">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-600">Software Subscription / Services</span>
            <span className="font-bold">{fmtINR(subTotal)}</span>
          </div>
        </div>
      )}

      {/* Totals + Bank */}
      <div className="grid grid-cols-2 border-t-2 border-gray-300">
        <div className="px-5 py-3 border-r border-gray-300 space-y-3">
          {(meta.bankName || meta.accountNo) && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Bank Details</p>
              {meta.accountHolder && <p className="text-[10px]"><span className="font-bold">A/c Name:</span> {meta.accountHolder}</p>}
              {meta.bankName      && <p className="text-[10px]"><span className="font-bold">Bank:</span> {meta.bankName}</p>}
              {meta.accountNo     && <p className="text-[10px]"><span className="font-bold">A/c No:</span> {meta.accountNo}</p>}
              {meta.ifsc          && <p className="text-[10px]"><span className="font-bold">IFSC:</span> {meta.ifsc}</p>}
            </div>
          )}
          {meta.userNotes && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Notes</p>
              <p className="text-[10px] text-gray-600 whitespace-pre-line">{meta.userNotes}</p>
            </div>
          )}
          {meta.termsAndConditions && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Terms & Conditions</p>
              <p className="text-[10px] text-gray-500 whitespace-pre-line">{meta.termsAndConditions}</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3">
          <table className="w-full text-[11px]">
            <tbody>
              <tr><td className="py-0.5 text-gray-600">Sub Total</td><td className="py-0.5 text-right">{fmtINR(subTotal)}</td></tr>
              {totalDiscount>0 && <tr><td className="py-0.5 text-gray-600">Discount</td><td className="py-0.5 text-right text-red-600">- {fmtINR(totalDiscount)}</td></tr>}
              {totalCgst>0     && <tr><td className="py-0.5 text-gray-600">Total CGST</td><td className="py-0.5 text-right">{fmtINR(totalCgst)}</td></tr>}
              {totalSgst>0     && <tr><td className="py-0.5 text-gray-600">Total SGST</td><td className="py-0.5 text-right">{fmtINR(totalSgst)}</td></tr>}
              {totalIgst>0     && <tr><td className="py-0.5 text-gray-600">Total IGST</td><td className="py-0.5 text-right">{fmtINR(totalIgst)}</td></tr>}
              {roundOff!==0    && <tr><td className="py-0.5 text-gray-600">Round Off</td><td className="py-0.5 text-right">{roundOff>=0?'+':''}{fmtINR(roundOff)}</td></tr>}
              <tr style={{ borderTop:`2px solid ${accent}` }}>
                <td className="py-2 font-black text-sm" style={{ color:accent }}>Grand Total</td>
                <td className="py-2 text-right font-black text-sm" style={{ color:accent }}>{fmtINR(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 p-2 rounded border text-[9px] text-gray-600 italic" style={{ borderColor:accent+'44', background:accent+'08' }}>
            <span className="font-bold">Amount in Words: </span>{numberToWords(grandTotal)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-300 flex items-end justify-between">
        <p className="text-[9px] text-gray-400">Computer-generated invoice. Generated by HubNest CRM.</p>
        <div className="text-right">
          <p className="text-[10px] font-bold">{meta.sellerName || inv.tenant_name}</p>
          <p className="text-[9px] text-gray-500 mt-6 border-t border-gray-400 pt-1">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

// Helper to load external scripts dynamically
function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PublicInvoiceViewPage() {
  const params = useParams<{ number: string }>();
  const [inv, setInv]     = useState<PublicInvoice | null>(null);
  const [meta, setMeta]   = useState<InvoiceMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Payment UI State
  const [paymentConfig, setPaymentConfig] = useState<{ gateways: { gateway: string; publishableKey?: string; keyId?: string }[] } | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [stripeElements, setStripeElements] = useState<any>(null);
  const [stripeCard, setStripeCard] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!params.number) return;
    axios.get(`${API_BASE}/finance/invoices/public/${params.number}`)
      .then(r => {
        const data: PublicInvoice = r.data.data;
        setInv(data);
        if (data.notes) {
          try { setMeta(JSON.parse(data.notes)); } catch { /* plain text */ }
        }
      })
      .catch(() => setError('Invoice not found or unavailable.'))
      .finally(() => setLoading(false));

    axios.get(`${API_BASE}/finance/invoices/public/${params.number}/payment-config`)
      .then(r => {
        setPaymentConfig(r.data.data);
      })
      .catch(() => { /* Payment gateway configurations optional */ });
  }, [params.number]);

  // Handle Stripe scripts initialization when Stripe is selected in modal
  useEffect(() => {
    if (selectedGateway === 'stripe' && paymentConfig && showPayModal) {
      const stripeConfig = paymentConfig.gateways.find(g => g.gateway === 'stripe');
      if (stripeConfig?.publishableKey) {
        loadScript('https://js.stripe.com/v3/').then(async (loaded) => {
          if (!loaded) {
            setPaymentError('Failed to load Stripe SDK');
            return;
          }
          const stripe = (window as any).Stripe(stripeConfig.publishableKey);
          setStripeInstance(stripe);
          
          try {
            // Get Stripe elements instance
            const elements = stripe.elements();
            setStripeElements(elements);
            
            setTimeout(() => {
              const card = elements.create('card', {
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#32325d',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#fa755a', iconColor: '#fa755a' },
                }
              });
              card.mount('#stripe-card-element');
              setStripeCard(card);
            }, 100);
          } catch (err: any) {
            setPaymentError('Failed to initialize Stripe elements UI.');
          }
        });
      }
    }
  }, [selectedGateway, paymentConfig, showPayModal]);

  const handleOpenPayModal = () => {
    setPaymentSuccess(false);
    setPaymentError('');
    setPaying(false);
    
    if (paymentConfig?.gateways && paymentConfig.gateways.length > 0) {
      // Automatically pre-select first gateway if only 1 connected
      if (paymentConfig.gateways.length === 1) {
        setSelectedGateway(paymentConfig.gateways[0].gateway);
      } else {
        setSelectedGateway('');
      }
      setShowPayModal(true);
    } else {
      alert('No payment gateway is configured by this company yet.');
    }
  };

  const handleStripePay = async () => {
    if (!stripeInstance || !stripeCard || !paymentConfig || !inv) return;
    setPaying(true);
    setPaymentError('');
    try {
      // 1. Create client-side Stripe Payment Intent
      const intentRes = await axios.post(`${API_BASE}/finance/invoices/public/${params.number}/create-payment-intent`);
      const clientSecret = intentRes.data.data.clientSecret;

      // 2. Prompt client Stripe Elements payment checkout
      const result = await stripeInstance.confirmCardPayment(clientSecret, {
        payment_method: {
          card: stripeCard,
          billing_details: { name: inv.customer_name }
        }
      });

      if (result.error) {
        setPaymentError(result.error.message || 'Payment failed');
        setPaying(false);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // 3. Verify checkout on server
        await axios.post(`${API_BASE}/finance/invoices/public/${params.number}/payment-verify`, {
          gateway: 'stripe',
          gateway_order_id: result.paymentIntent.id
        });
        setPaymentSuccess(true);
        setInv(prev => prev ? { ...prev, status: 'Paid', paid_date: new Date().toISOString() } : null);
        setTimeout(() => setShowPayModal(false), 2000);
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Payment processing failed');
      setPaying(false);
    }
  };

  const handleRazorpayPay = async () => {
    setPaying(true);
    setPaymentError('');
    try {
      const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!loaded) {
        setPaymentError('Failed to load Razorpay checkout script');
        setPaying(false);
        return;
      }

      // 1. Create client-side Razorpay order
      const orderRes = await axios.post(`${API_BASE}/finance/invoices/public/${params.number}/create-order`);
      const { orderId, amount, currency, razorpayKeyId } = orderRes.data.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: inv?.tenant_name || 'HubNest Invoice Payment',
        description: `Invoice ${inv?.invoice_number}`,
        order_id: orderId,
        handler: async function (response: any) {
          setPaying(true);
          try {
            // 3. Verify signature on server
            await axios.post(`${API_BASE}/finance/invoices/public/${params.number}/payment-verify`, {
              gateway: 'razorpay',
              gateway_payment_id: response.razorpay_payment_id,
              gateway_order_id: response.razorpay_order_id,
              gateway_signature: response.razorpay_signature
            });
            setPaymentSuccess(true);
            setInv(prev => prev ? { ...prev, status: 'Paid', paid_date: new Date().toISOString() } : null);
            setTimeout(() => setShowPayModal(false), 2000);
          } catch (err: any) {
            setPaymentError('Payment signature verification failed.');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: inv?.customer_name
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setPaying(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to start Razorpay payment');
      setPaying(false);
    }
  };

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('','_blank','width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv?.invoice_number}</title><script src="https://cdn.tailwindcss.com"></script><style>*{font-family:Arial,sans-serif}body{background:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 1500);
  }

  async function handleDownload() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('','_blank','width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv?.invoice_number}</title><script src="https://cdn.tailwindcss.com"></script><style>*{font-family:Arial,sans-serif}body{background:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 1500);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent inline-block"/>
        <p className="text-sm text-slate-500 mt-3">Loading invoice...</p>
      </div>
    </div>
  );

  if (error || !inv) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400"/>
        </div>
        <h1 className="text-lg font-black text-slate-800 mb-2">Invoice Not Found</h1>
        <p className="text-sm text-slate-500">{error || 'This invoice link may be invalid or the invoice has been deleted.'}</p>
      </div>
    </div>
  );

  const showPayNowButton = inv.status !== 'Paid' && paymentConfig?.gateways && paymentConfig.gateways.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 relative">
      <div className="max-w-[900px] mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">INV</span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{inv.tenant_name}</p>
              <p className="text-[10px] text-slate-400">Tax Invoice · {inv.invoice_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition">
              <Printer className="w-3.5 h-3.5"/>Print
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition">
              <Download className="w-3.5 h-3.5"/>Download PDF
            </button>
            {showPayNowButton && (
              <button 
                onClick={handleOpenPayModal} 
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl text-xs font-black text-white shadow-md shadow-emerald-500/20 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5"/>Pay Now
              </button>
            )}
          </div>
        </div>

        {/* Invoice preview */}
        <div className="shadow-2xl rounded overflow-hidden border border-slate-300 bg-white">
          <InvoicePreview inv={inv} meta={meta} printRef={printRef} />
        </div>

        <p className="text-center text-[10px] text-slate-300 mt-6 font-medium">Powered by HubNest CRM</p>
      </div>

      {/* Pay Now Modal overlay */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md">Invoice Payment</span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Pay Invoice {inv.invoice_number}</h3>
              <p className="text-xs text-slate-500 mt-1">Select a gateway below to complete your payment.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Due</p>
                <p className="text-2xl font-black text-slate-950 mt-1">{fmtINR(inv.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
            </div>

            {paymentError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                <span className="font-bold text-sm">Payment Successful!</span>
                <p className="text-[11px] text-emerald-600 mt-0.5">Thank you for your payment. Invoice status updated to Paid.</p>
              </div>
            )}

            {!paymentSuccess && (
              <div className="space-y-4">
                {/* Gateway Selector */}
                {paymentConfig && paymentConfig.gateways.length > 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {paymentConfig.gateways.map(g => (
                      <button
                        key={g.gateway}
                        onClick={() => {
                          setSelectedGateway(g.gateway);
                          setPaymentError('');
                        }}
                        className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 font-bold text-xs capitalize ${
                          selectedGateway === g.gateway
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-slate-400" />
                        <span>{g.gateway === 'stripe' ? 'Stripe Checkout' : 'Razorpay UPI'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Gateway payment containers */}
                {selectedGateway === 'stripe' && (
                  <div className="space-y-4 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Credit / Debit Card</label>
                    <div id="stripe-card-element" className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 min-h-[44px]"></div>
                    <button
                      onClick={handleStripePay}
                      disabled={paying}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {paying ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span> : null}
                      <span>Pay {fmtINR(inv.total)}</span>
                    </button>
                  </div>
                )}

                {selectedGateway === 'razorpay' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-slate-500 leading-relaxed">Razorpay handles payments securely via UPI, Netbanking, wallets, and credit cards.</p>
                    <button
                      onClick={handleRazorpayPay}
                      disabled={paying}
                      className="w-full py-3 bg-[#F5A623] hover:bg-[#E0961B] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {paying ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span> : null}
                      <span>Proceed with Razorpay</span>
                    </button>
                  </div>
                )}

                {paying && (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-[10px] font-semibold gap-1.5 pt-2 animate-pulse">
                    <span>Processing transaction safely. Please do not refresh.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
