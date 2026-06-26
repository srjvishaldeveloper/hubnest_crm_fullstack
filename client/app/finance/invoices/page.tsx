'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { financeGetInvoices, financeCreateInvoice, financeUpdateInvoice, financeGetVendors } from '../../../services/financeService';
import api from '../../../services/api';
import {
  FileText, Search, Plus, RefreshCw, X, Download, Eye,
  Share2, Copy, Check, Link2, Printer, Mail, IndianRupee,
  Building2, Package, Info, Hash, Pencil, AlertCircle,
  Globe, ChevronRight, LayoutTemplate, Percent, RotateCcw,
  ArrowLeftRight, CheckCircle2, Filter, ArrowUpDown
} from 'lucide-react';

// ─── ZOD SCHEMAS ───────────────────────────────────────────────────────────────

const InvoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerName:  z.string().min(1, 'Customer name is required'),
  dueDate:       z.string().min(1, 'Due date is required'),
  sellerEmail:   z.string().email('Seller email is invalid').or(z.literal('')),
  customerEmail: z.string().email('Customer email is invalid').or(z.literal('')),
  sellerPhone: z.string().regex(/^$|^\+?[0-9\s\-()]{7,15}$/, 'Seller phone is invalid').optional(),
  customerPhone: z.string().regex(/^$|^\+?[0-9\s\-()]{7,15}$/, 'Customer phone is invalid').optional(),
  sellerPin: z.string().regex(/^$|^[1-9][0-9]{5}$/, 'Seller PIN must be 6 digits').optional(),
  customerPin: z.string().regex(/^$|^[1-9][0-9]{5}$/, 'Customer PIN must be 6 digits').optional(),
});

type InvoiceValidationErrors = Partial<Record<keyof z.infer<typeof InvoiceFormSchema>, string>>;

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface LineItem {
  description: string; hsn: string; qty: number; unit: string;
  rate: number; discount: number; taxable: number;
  gstType: 'CGST+SGST' | 'IGST' | 'Exempt';
  gstRate: number; cgst: number; sgst: number; igst: number; amount: number;
}

interface InvoiceFormData {
  template: string; invoiceNumber: string; invoiceDate: string;
  dueDate: string; poNumber: string;
  ewayBill?: string; challanNo?: string; challanDate?: string;
  shipSameAsBill?: boolean;
  shippingName?: string; shippingGstin?: string; shippingState?: string; shippingAddress?: string;
  sellerName: string; sellerGstin: string; sellerAddress: string;
  sellerCity: string; sellerState: string; sellerPin: string;
  sellerPhone: string; sellerEmail: string; sellerPan: string;
  customerName: string; customerGstin: string; customerAddress: string;
  customerCity: string; customerState: string; customerPin: string;
  customerPhone: string; customerEmail: string;
  placeOfSupply: string; reverseCharge: boolean;
  items: LineItem[];
  subTotal: number; totalDiscount: number; totalCgst: number;
  totalSgst: number; totalIgst: number; roundOff: number; grandTotal: number;
  bankName: string; accountNo: string; ifsc: string;
  accountHolder: string; paymentTerms: string;
  notes: string; termsAndConditions: string;
}

interface Invoice {
  id: string; invoice_number: string; customer_name: string;
  amount: number; tax: number; total: number; status: string;
  due_date: string; paid_date: string | null; created_at: string;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Nos','Kg','Ltr','Mtr','Sqft','Box','Set','Pcs','Hrs','Days','Month'];
const PAYMENT_TERMS = ['Immediate','Net 7','Net 15','Net 30','Net 45','Net 60','Due on Receipt'];

const TEMPLATES = [
  { id: 'modern',   label: 'Modern Blue',  color: '#2563eb' },
  { id: 'classic',  label: 'Classic Navy', color: '#1e3a5f' },
  { id: 'emerald',  label: 'Green Pro',    color: '#059669' },
  { id: 'saffron',  label: 'Saffron',      color: '#d97706' },
  { id: 'maroon',   label: 'Maroon Elite', color: '#9f1239' },
  { id: 'slate',    label: 'Slate Gray',   color: '#475569' },
  { id: 'violet',   label: 'Violet Pro',   color: '#7c3aed' },
  { id: 'teal',     label: 'Teal Fresh',   color: '#0d9488' },
  { id: 'sunset',   label: 'Sunset',       color: '#ea580c' },
  { id: 'indigo',   label: 'Indigo Dark',  color: '#4338ca' },
  { id: 'rose',     label: 'Rose Gold',    color: '#e11d48' },
  { id: 'forest',   label: 'Forest Green', color: '#166534' },
  { id: 'navy',     label: 'Navy Classic', color: '#1e3a5f' },
  { id: 'copper',   label: 'Copper Craft', color: '#92400e' },
  { id: 'graphite', label: 'Graphite',     color: '#1f2937' },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

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

function emptyItem(): LineItem {
  return { description:'', hsn:'', qty:1, unit:'Nos', rate:0, discount:0, taxable:0, gstType:'CGST+SGST', gstRate:18, cgst:0, sgst:0, igst:0, amount:0 };
}

function calcItem(item: LineItem): LineItem {
  const taxable = +(item.qty * item.rate * (1 - item.discount/100)).toFixed(2);
  const gstAmt  = +(taxable * item.gstRate / 100).toFixed(2);
  const cgst    = item.gstType === 'CGST+SGST' ? +(gstAmt/2).toFixed(2) : 0;
  const sgst    = item.gstType === 'CGST+SGST' ? +(gstAmt/2).toFixed(2) : 0;
  const igst    = item.gstType === 'IGST'       ? gstAmt : 0;
  const amount  = +(taxable + (item.gstType === 'Exempt' ? 0 : gstAmt)).toFixed(2);
  return { ...item, taxable, cgst, sgst, igst, amount };
}

function calcTotals(items: LineItem[]) {
  const subTotal      = items.reduce((s,i) => s+i.taxable, 0);
  const totalDiscount = items.reduce((s,i) => s + i.qty*i.rate*(i.discount/100), 0);
  const totalCgst     = items.reduce((s,i) => s+i.cgst, 0);
  const totalSgst     = items.reduce((s,i) => s+i.sgst, 0);
  const totalIgst     = items.reduce((s,i) => s+i.igst, 0);
  const raw           = subTotal + totalCgst + totalSgst + totalIgst;
  const roundOff      = +(Math.round(raw) - raw).toFixed(2);
  const grandTotal    = +(raw + roundOff).toFixed(2);
  return { subTotal:+subTotal.toFixed(2), totalDiscount:+totalDiscount.toFixed(2), totalCgst:+totalCgst.toFixed(2), totalSgst:+totalSgst.toFixed(2), totalIgst:+totalIgst.toFixed(2), roundOff, grandTotal };
}

function defaultForm(prefill?: Partial<InvoiceFormData>): InvoiceFormData {
  const today = new Date().toISOString().split('T')[0];
  const due   = new Date(Date.now()+30*864e5).toISOString().split('T')[0];
  const items = [emptyItem()];
  return {
    template:'modern', invoiceNumber:`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100).padStart(3,'0')}`,
    invoiceDate:today, dueDate:due, poNumber:'',
    ewayBill:'', challanNo:'', challanDate:'',
    shipSameAsBill:true, shippingName:'', shippingAddress:'', shippingGstin:'', shippingState:'Maharashtra',
    sellerName:'', sellerGstin:'', sellerAddress:'', sellerCity:'', sellerState:'Maharashtra', sellerPin:'', sellerPhone:'', sellerEmail:'', sellerPan:'',
    customerName:'', customerGstin:'', customerAddress:'', customerCity:'', customerState:'Maharashtra', customerPin:'', customerPhone:'', customerEmail:'',
    placeOfSupply:'Maharashtra', reverseCharge:false,
    items, ...calcTotals(items),
    bankName:'', accountNo:'', ifsc:'', accountHolder:'', paymentTerms:'Net 30',
    notes:'Thank you for your business!',
    termsAndConditions:'Goods once sold will not be taken back.\nInterest @ 18% p.a. if payment delayed.\nSubject to local jurisdiction.',
    ...prefill,
  };
}

// ─── INVOICE PREVIEW ───────────────────────────────────────────────────────────

function InvoicePreview({ form, printRef }: { form: InvoiceFormData; printRef: React.RefObject<HTMLDivElement | null> }) {
  const accent = TEMPLATES.find(t => t.id === form.template)?.color || '#2563eb';
  const hasCgstSgst = form.items.some(i => i.gstType === 'CGST+SGST' && i.cgst > 0);
  const hasIgst     = form.items.some(i => i.gstType === 'IGST'       && i.igst > 0);

  return (
    <div ref={printRef} className="keep-light bg-white text-[#1a1a1a] text-[11px] leading-snug w-full" style={{ fontFamily: 'Arial,sans-serif' }}>
      {/* Header */}
      <div style={{ background: accent }} className="px-6 py-4 flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-black tracking-wide uppercase">{form.sellerName || 'Your Company'}</h1>
          {form.sellerGstin && <p className="text-white/80 text-[10px] mt-0.5">GSTIN: {form.sellerGstin}</p>}
          {form.sellerPan   && <p className="text-white/80 text-[10px]">PAN: {form.sellerPan}</p>}
          <p className="text-white/70 text-[10px] mt-1">{[form.sellerAddress,form.sellerCity,form.sellerState,form.sellerPin].filter(Boolean).join(', ')}</p>
          {form.sellerPhone && <p className="text-white/70 text-[10px]">Ph: {form.sellerPhone}{form.sellerEmail ? ` | ${form.sellerEmail}` : ''}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-white text-3xl font-black uppercase tracking-widest">TAX INVOICE</h2>
          <div className="mt-2 space-y-0.5">
            <p className="text-white/90 text-[11px]"><span className="font-bold">Invoice No:</span> {form.invoiceNumber}</p>
            <p className="text-white/90 text-[11px]"><span className="font-bold">Date:</span> {form.invoiceDate ? new Date(form.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}</p>
            <p className="text-white/90 text-[11px]"><span className="font-bold">Due Date:</span> {form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}</p>
            {form.poNumber && <p className="text-white/90 text-[11px]"><span className="font-bold">P.O.:</span> {form.poNumber}</p>}
          </div>
        </div>
      </div>

      {/* Bill To / Ship To / Supply Details */}
      <div className="grid grid-cols-3 border-b border-gray-300">
        {!form.shipSameAsBill && form.shippingAddress ? (
          <>
            <div className="px-5 py-3 border-r border-gray-300">
              <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Bill To</p>
              <p className="font-bold text-sm">{form.customerName || 'Customer Name'}</p>
              {form.customerGstin   && <p className="text-[10px] text-gray-600">GSTIN: {form.customerGstin}</p>}
              <p className="text-[10px] text-gray-600">{[form.customerAddress,form.customerCity,form.customerState,form.customerPin].filter(Boolean).join(', ')}</p>
            </div>
            <div className="px-5 py-3 border-r border-gray-300">
              <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Ship To</p>
              <p className="font-bold text-sm">{form.shippingName || form.customerName}</p>
              {form.shippingGstin   && <p className="text-[10px] text-gray-600">GSTIN: {form.shippingGstin}</p>}
              <p className="text-[10px] text-gray-600">{form.shippingAddress}</p>
            </div>
          </>
        ) : (
          <div className="col-span-2 px-5 py-3 border-r border-gray-300">
            <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Bill To</p>
            <p className="font-bold text-sm">{form.customerName || 'Customer Name'}</p>
            {form.customerGstin   && <p className="text-[10px] text-gray-600">GSTIN: {form.customerGstin}</p>}
            <p className="text-[10px] text-gray-600">{[form.customerAddress,form.customerCity,form.customerState,form.customerPin].filter(Boolean).join(', ')}</p>
            {form.customerPhone   && <p className="text-[10px] text-gray-600">Ph: {form.customerPhone}</p>}
          </div>
        )}
        <div className="px-5 py-3">
          <p className="font-black uppercase text-[10px] mb-1" style={{ color: accent }}>Supply Details</p>
          <p className="text-[10px]"><span className="font-bold">Place of Supply:</span> {form.placeOfSupply}</p>
          <p className="text-[10px]"><span className="font-bold">Reverse Charge:</span> {form.reverseCharge ? 'Yes' : 'No'}</p>
          {form.paymentTerms && <p className="text-[10px]"><span className="font-bold">Payment Terms:</span> {form.paymentTerms}</p>}
          {form.ewayBill && <p className="text-[10px]"><span className="font-bold">E-Way Bill:</span> {form.ewayBill}</p>}
          {form.challanNo && <p className="text-[10px]"><span className="font-bold">Challan No:</span> {form.challanNo}{form.challanDate ? ` (${form.challanDate})` : ''}</p>}
        </div>
      </div>

      {/* Items Table */}
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
          {form.items.map((item, idx) => (
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

      {/* Totals + Bank */}
      <div className="grid grid-cols-2 border-t-2 border-gray-300">
        <div className="px-5 py-3 border-r border-gray-300 space-y-3">
          {(form.bankName||form.accountNo) && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Bank Details</p>
              {form.accountHolder && <p className="text-[10px]"><span className="font-bold">A/c Name:</span> {form.accountHolder}</p>}
              {form.bankName      && <p className="text-[10px]"><span className="font-bold">Bank:</span> {form.bankName}</p>}
              {form.accountNo     && <p className="text-[10px]"><span className="font-bold">A/c No:</span> {form.accountNo}</p>}
              {form.ifsc          && <p className="text-[10px]"><span className="font-bold">IFSC:</span> {form.ifsc}</p>}
            </div>
          )}
          {form.notes && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Notes</p>
              <p className="text-[10px] text-gray-600 whitespace-pre-line">{form.notes}</p>
            </div>
          )}
          {form.termsAndConditions && (
            <div>
              <p className="font-black text-[10px] uppercase mb-1" style={{ color: accent }}>Terms & Conditions</p>
              <p className="text-[10px] text-gray-500 whitespace-pre-line">{form.termsAndConditions}</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3">
          <table className="w-full text-[11px]">
            <tbody>
              <tr><td className="py-0.5 text-gray-600">Sub Total</td><td className="py-0.5 text-right">{fmtINR(form.subTotal)}</td></tr>
              {form.totalDiscount>0 && <tr><td className="py-0.5 text-gray-600">Discount</td><td className="py-0.5 text-right text-red-600">- {fmtINR(form.totalDiscount)}</td></tr>}
              {form.totalCgst>0     && <tr><td className="py-0.5 text-gray-600">Total CGST</td><td className="py-0.5 text-right">{fmtINR(form.totalCgst)}</td></tr>}
              {form.totalSgst>0     && <tr><td className="py-0.5 text-gray-600">Total SGST</td><td className="py-0.5 text-right">{fmtINR(form.totalSgst)}</td></tr>}
              {form.totalIgst>0     && <tr><td className="py-0.5 text-gray-600">Total IGST</td><td className="py-0.5 text-right">{fmtINR(form.totalIgst)}</td></tr>}
              {form.roundOff!==0    && <tr><td className="py-0.5 text-gray-600">Round Off</td><td className="py-0.5 text-right">{form.roundOff>=0?'+':''}{fmtINR(form.roundOff)}</td></tr>}
              <tr style={{ borderTop:`2px solid ${accent}` }}>
                <td className="py-2 font-black text-sm" style={{ color:accent }}>Grand Total</td>
                <td className="py-2 text-right font-black text-sm" style={{ color:accent }}>{fmtINR(form.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 p-2 rounded border text-[9px] text-gray-600 italic" style={{ borderColor:accent+'44', background:accent+'08' }}>
            <span className="font-bold">Amount in Words: </span>{numberToWords(form.grandTotal)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-300 flex items-end justify-between">
        <p className="text-[9px] text-gray-400">Computer-generated invoice. Generated by HubNest CRM.</p>
        <div className="text-right">
          <p className="text-[10px] font-bold">{form.sellerName}</p>
          <p className="text-[9px] text-gray-500 mt-6 border-t border-gray-400 pt-1">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

// ─── LINE ITEM ROW ──────────────────────────────────────────────────────────────

function ItemRow({ item, idx, onChange, onRemove }: { item:LineItem; idx:number; onChange:(i:number,item:LineItem)=>void; onRemove:(i:number)=>void }) {
  const set = (field: keyof LineItem, value: any) => onChange(idx, calcItem({ ...item, [field]: value }));
  const inp = 'w-full border border-gray-200 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-blue-400 bg-white';
  return (
    <tr className="border-b border-gray-100 hover:bg-blue-50/30 group">
      <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{idx+1}</td>
      <td className="px-1 py-1.5 min-w-[130px]"><input className={inp} value={item.description} onChange={e=>set('description',e.target.value)} placeholder="Description" /></td>
      <td className="px-1 py-1.5 w-16"><input className={inp} value={item.hsn} onChange={e=>set('hsn',e.target.value)} placeholder="HSN" /></td>
      <td className="px-1 py-1.5 w-12"><input type="number" min={0} className={inp+' text-right'} value={item.qty} onChange={e=>set('qty',+e.target.value)} /></td>
      <td className="px-1 py-1.5 w-14"><select className={inp} value={item.unit} onChange={e=>set('unit',e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></td>
      <td className="px-1 py-1.5 w-20"><input type="number" min={0} step={0.01} className={inp+' text-right'} value={item.rate} onChange={e=>set('rate',+e.target.value)} /></td>
      <td className="px-1 py-1.5 w-10"><input type="number" min={0} max={100} className={inp+' text-right'} value={item.discount} onChange={e=>set('discount',+e.target.value)} /></td>
      <td className="px-2 py-1.5 w-20 text-right text-[11px] font-medium">{fmtINR(item.taxable)}</td>
      <td className="px-1 py-1.5 w-22"><select className={inp} value={item.gstType} onChange={e=>set('gstType',e.target.value as any)}><option value="CGST+SGST">CGST+SGST</option><option value="IGST">IGST</option><option value="Exempt">Exempt</option></select></td>
      <td className="px-1 py-1.5 w-14"><select className={inp} value={item.gstRate} onChange={e=>set('gstRate',+e.target.value)} disabled={item.gstType==='Exempt'}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></td>
      <td className="px-2 py-1.5 w-16 text-right text-[11px] text-indigo-600">{item.gstType==='CGST+SGST'?fmtINR(item.cgst):'—'}</td>
      <td className="px-2 py-1.5 w-16 text-right text-[11px] text-indigo-600">{item.gstType==='CGST+SGST'?fmtINR(item.sgst):'—'}</td>
      <td className="px-2 py-1.5 w-16 text-right text-[11px] text-violet-600">{item.gstType==='IGST'?fmtINR(item.igst):'—'}</td>
      <td className="px-2 py-1.5 w-20 text-right text-[11px] font-bold">{fmtINR(item.amount)}</td>
      <td className="px-1 py-1.5 w-8">
        <button onClick={()=>onRemove(idx)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition"><X className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

// ─── CREATE / EDIT MODAL ────────────────────────────────────────────────────────

function InvoiceModal({ initial, editId, onClose, onSaved }: {
  initial?: Partial<InvoiceFormData>; editId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm]       = useState<InvoiceFormData>(() => defaultForm(initial));
  const [step, setStep]       = useState<'template'|'form'|'preview'>(initial ? 'form' : 'template');
  const [submitting, setSub]  = useState(false);
  const [copiedLink, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<InvoiceValidationErrors>({});
  const printRef = useRef<HTMLDivElement>(null);
  const isEdit   = !!editId;

  /* ── Vendor picker ── */
  const [vendors, setVendors] = useState<Array<{ id:string; name:string; email:string|null; phone:string|null; address:string|null }>>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  useEffect(() => {
    financeGetVendors({ status:'Active', limit:100 })
      .then(res => setVendors(res.vendors || []))
      .catch(() => {});
  }, []);

  function applyVendor(vendorId: string) {
    setSelectedVendorId(vendorId);
    if (!vendorId) return;
    const v = vendors.find(x => x.id === vendorId);
    if (!v) return;
    setForm(f => ({
      ...f,
      customerName: v.name,
      customerEmail: v.email || f.customerEmail,
      customerPhone: v.phone || f.customerPhone,
      customerAddress: v.address || f.customerAddress,
    }));
  }

  function sf<K extends keyof InvoiceFormData>(key: K, val: InvoiceFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  // Keep shipping in sync with billing whenever "Same as Billing" is checked
  useEffect(() => {
    if (!form.shipSameAsBill) return;
    setForm(prev => ({
      ...prev,
      shippingName: prev.customerName,
      shippingAddress: [prev.customerAddress, prev.customerCity, prev.customerPin].filter(Boolean).join(', '),
      shippingGstin: prev.customerGstin,
      shippingState: prev.customerState,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.shipSameAsBill, form.customerName, form.customerAddress, form.customerCity, form.customerPin, form.customerGstin, form.customerState]);

  function updateItem(idx: number, item: LineItem) {
    const items = form.items.map((it,i) => i===idx ? item : it);
    setForm(f => ({ ...f, items, ...calcTotals(items) }));
  }
  function addItem()       { const items=[...form.items, emptyItem()]; setForm(f=>({...f, items, ...calcTotals(items)})); }
  function removeItem(idx: number) {
    if (form.items.length===1) return;
    const items=form.items.filter((_,i)=>i!==idx); setForm(f=>({...f, items, ...calcTotals(items)}));
  }

  async function handleSave() {
    setSaveError(null);
    // Zod validation
    const parsed = InvoiceFormSchema.safeParse({
      invoiceNumber: form.invoiceNumber,
      customerName:  form.customerName,
      dueDate:       form.dueDate,
      sellerEmail:   form.sellerEmail   || '',
      customerEmail: form.customerEmail || '',
      sellerPhone:   form.sellerPhone   || '',
      customerPhone: form.customerPhone || '',
      sellerPin:     form.sellerPin     || '',
      customerPin:   form.customerPin   || '',
    });
    if (!parsed.success) {
      const errors: InvoiceValidationErrors = {};
      parsed.error.issues.forEach((e) => {
        const key = String(e.path[0]) as keyof InvoiceValidationErrors;
        if (!errors[key]) errors[key] = e.message;
      });
      setValidationErrors(errors);
      if (step !== 'form') setStep('form');
      return;
    }
    setValidationErrors({});
    try {
      setSub(true);
      const meta = JSON.stringify({
        sellerName: form.sellerName, sellerGstin: form.sellerGstin,
        sellerAddress: [form.sellerAddress, form.sellerCity, form.sellerState, form.sellerPin].filter(Boolean).join(', '),
        sellerPan: form.sellerPan, sellerPhone: form.sellerPhone, sellerEmail: form.sellerEmail,
        customerGstin: form.customerGstin, customerEmail: form.customerEmail, customerPhone: form.customerPhone,
        customerAddress: [form.customerAddress, form.customerCity, form.customerState, form.customerPin].filter(Boolean).join(', '),
        placeOfSupply: form.placeOfSupply, reverseCharge: form.reverseCharge,
        items: form.items,
        totalCgst: form.totalCgst, totalSgst: form.totalSgst, totalIgst: form.totalIgst,
        subTotal: form.subTotal, grandTotal: form.grandTotal,
        bankName: form.bankName, accountNo: form.accountNo, ifsc: form.ifsc,
        accountHolder: form.accountHolder, paymentTerms: form.paymentTerms,
        userNotes: form.notes, termsAndConditions: form.termsAndConditions,
        template: form.template, poNumber: form.poNumber,
        ewayBill: form.ewayBill || '', challanNo: form.challanNo || '', challanDate: form.challanDate || '',
        shipSameAsBill: form.shipSameAsBill || false, shippingName: form.shippingName || '',
        shippingAddress: form.shippingAddress || '', shippingGstin: form.shippingGstin || '',
        shippingState: form.shippingState || '',
      });
      const payload = {
        invoice_number: form.invoiceNumber,
        customer_name:  form.customerName,
        amount:         form.subTotal,
        tax:            form.totalCgst + form.totalSgst + form.totalIgst,
        total:          form.grandTotal,
        due_date:       form.dueDate,
        notes:          meta,
        ...(isEdit ? {} : { status: 'Draft' }),
      };
      if (isEdit) {
        await financeUpdateInvoice(editId!, payload);
      } else {
        await financeCreateInvoice(payload);
      }
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save invoice. Please try again.';
      setSaveError(msg);
    } finally { setSub(false); }
  }

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('','_blank','width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${form.invoiceNumber}</title><script src="https://cdn.tailwindcss.com"></script><style>*{font-family:Arial,sans-serif}body{background:#fff}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(()=>{ win.print(); win.close(); }, 1500);
  }

  async function handleDownloadPdf() {
    handlePrint();
  }

  function handleCopyLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/public/invoices/view/${form.invoiceNumber}`);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  const inp   = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 bg-white dark:bg-[#1a1a1a] dark:border-[#333] placeholder:text-slate-400 transition';
  const lbl   = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1';
  const tplColor = TEMPLATES.find(t=>t.id===form.template)?.color || '#2563eb';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 backdrop-blur-sm py-4 px-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
        className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#333] shadow-2xl w-full max-w-6xl flex flex-col"
        style={{ minHeight:'90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#0f0f0f] shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: tplColor }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white">{isEdit ? 'Edit Invoice' : 'New Tax Invoice'}</h2>
              <p className="text-[10px] text-slate-500">Indian GST · CGST/SGST/IGST</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            {(['template','form','preview'] as const).map((s,i)=>(
              <button key={s} onClick={()=>setStep(s)}
                className={`px-3 py-1.5 rounded-lg transition capitalize ${step===s ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                style={step===s ? { background: tplColor } : {}}
              >
                {i+1}. {s==='template'?'Template':s==='form'?'Details':'Preview'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-[#2a2a2a] rounded-xl text-slate-400 transition"><X className="w-5 h-5" /></button>
        </div>

        {/* ── STEP 1: Template ── */}
        {step==='template' && (
          <div className="flex-1 overflow-auto p-6">
            <p className="text-xs text-slate-500 mb-5">Choose a design. All templates support full GST fields.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={()=>{ sf('template',tpl.id); setStep('form'); }}
                  className={`group relative rounded-xl overflow-hidden border-2 transition hover:shadow-lg ${form.template===tpl.id?'border-blue-500 shadow-md':'border-slate-200 dark:border-[#333]'}`}>
                  <div className="aspect-[3/4] flex flex-col overflow-hidden">
                    <div className="h-10 flex items-center px-2 gap-1.5" style={{ background:tpl.color }}>
                      <div className="flex-1 space-y-0.5"><div className="h-1.5 bg-white/50 rounded"/><div className="h-1 bg-white/30 rounded w-2/3"/></div>
                    </div>
                    <div className="flex-1 bg-white p-1.5 space-y-1">
                      <div className="h-1 bg-gray-200 rounded w-3/4"/>
                      <div className="border border-gray-200 rounded">{[1,2,3].map(i=><div key={i} className="h-1.5 border-b border-gray-100 px-1 flex gap-1 items-center"><div className="flex-1 bg-gray-100 rounded h-0.5"/><div className="w-3 h-0.5 bg-gray-200 rounded"/></div>)}</div>
                      <div className="flex justify-end"><div className="w-8 h-2 rounded" style={{ background:tpl.color+'44' }}/></div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-[#2a2a2a] bg-white dark:bg-[#161616]">
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{tpl.label}</p>
                  </div>
                  {form.template===tpl.id && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div>}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={()=>setStep('form')} className="flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-xl transition" style={{ background: tplColor }}>
                Continue <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Form ── */}
        {step==='form' && (
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Invoice meta */}
            <section>
              <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-amber-500"/>Invoice Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={lbl}>Invoice Number *</label>
                  <input className={inp+(validationErrors.invoiceNumber?' border-red-400':'')} value={form.invoiceNumber} onChange={e=>{ sf('invoiceNumber',e.target.value); setValidationErrors(v=>({...v,invoiceNumber:undefined})); }}/>
                  {validationErrors.invoiceNumber && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.invoiceNumber}</p>}
                </div>
                <div><label className={lbl}>Invoice Date *</label><input type="date" className={inp} value={form.invoiceDate} onChange={e=>sf('invoiceDate',e.target.value)}/></div>
                <div>
                  <label className={lbl}>Due Date *</label>
                  <input type="date" className={inp+(validationErrors.dueDate?' border-red-400':'')} value={form.dueDate} onChange={e=>{ sf('dueDate',e.target.value); setValidationErrors(v=>({...v,dueDate:undefined})); }}/>
                  {validationErrors.dueDate && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.dueDate}</p>}
                </div>
                <div><label className={lbl}>P.O. / Ref No.</label><input className={inp} value={form.poNumber} onChange={e=>sf('poNumber',e.target.value)} placeholder="Optional"/></div>
                <div><label className={lbl}>E-Way Bill No.</label><input className={inp} value={form.ewayBill || ''} onChange={e=>sf('ewayBill',e.target.value)} placeholder="Optional"/></div>
                <div><label className={lbl}>Challan Number</label><input className={inp} value={form.challanNo || ''} onChange={e=>sf('challanNo',e.target.value)} placeholder="Optional"/></div>
                <div><label className={lbl}>Challan Date</label><input type="date" className={inp} value={form.challanDate || ''} onChange={e=>sf('challanDate',e.target.value)}/></div>
              </div>
            </section>

            {/* Seller */}
            <section>
              <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-blue-500"/>Your Company (Seller)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Company Name *</label><input className={inp} value={form.sellerName} onChange={e=>sf('sellerName',e.target.value)} placeholder="Company Pvt Ltd"/></div>
                <div><label className={lbl}>GSTIN</label><input className={inp} value={form.sellerGstin} onChange={e=>sf('sellerGstin',e.target.value.toUpperCase())} placeholder="27AABCU9603R1ZX" maxLength={15}/></div>
                <div><label className={lbl}>PAN</label><input className={inp} value={form.sellerPan} onChange={e=>sf('sellerPan',e.target.value.toUpperCase())} maxLength={10}/></div>
                <div className="col-span-2 md:col-span-3"><label className={lbl}>Address</label><input className={inp} value={form.sellerAddress} onChange={e=>sf('sellerAddress',e.target.value)}/></div>
                <div><label className={lbl}>City</label><input className={inp} value={form.sellerCity} onChange={e=>sf('sellerCity',e.target.value)}/></div>
                <div><label className={lbl}>State</label><select className={inp} value={form.sellerState} onChange={e=>sf('sellerState',e.target.value)}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div>
                  <label className={lbl}>PIN</label>
                  <input className={inp+(validationErrors.sellerPin?' border-red-400':'')} value={form.sellerPin} onChange={e=>{ sf('sellerPin',e.target.value); setValidationErrors(v=>({...v,sellerPin:undefined})); }} maxLength={6} placeholder="400001"/>
                  {validationErrors.sellerPin && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.sellerPin}</p>}
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp+(validationErrors.sellerPhone?' border-red-400':'')} value={form.sellerPhone} onChange={e=>{ sf('sellerPhone',e.target.value); setValidationErrors(v=>({...v,sellerPhone:undefined})); }} placeholder="+91 98765 43210"/>
                  {validationErrors.sellerPhone && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.sellerPhone}</p>}
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" className={inp+(validationErrors.sellerEmail?' border-red-400':'')} value={form.sellerEmail} onChange={e=>{ sf('sellerEmail',e.target.value); setValidationErrors(v=>({...v,sellerEmail:undefined})); }} placeholder="company@example.com"/>
                  {validationErrors.sellerEmail && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.sellerEmail}</p>}
                </div>
              </div>
            </section>

            {/* Vendor Quick-Fill */}
            {vendors.length > 0 && (
              <section className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-950/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  <h4 className="text-xs font-black text-violet-700 dark:text-violet-400 uppercase tracking-wider">Fill from Vendor</h4>
                  <span className="text-[9px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{vendors.length} vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedVendorId} onChange={e => applyVendor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-violet-300 dark:border-violet-500/30 rounded-xl bg-white dark:bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-violet-500 transition font-medium">
                    <option value="">— Select a vendor to auto-fill customer details —</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}{v.email ? ` · ${v.email}` : ''}</option>
                    ))}
                  </select>
                  {selectedVendorId && (
                    <button type="button" onClick={() => { setSelectedVendorId(''); }}
                      className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {selectedVendorId && (
                  <p className="mt-2 text-[10px] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Customer details filled from vendor. You can still edit them below.
                  </p>
                )}
              </section>
            )}

            {/* Customer */}
            <section>
              <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Package className="w-3.5 h-3.5 text-emerald-500"/>Customer (Bill To)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Customer Name *</label>
                  <input className={inp+(validationErrors.customerName?' border-red-400':'')} value={form.customerName} onChange={e=>{ sf('customerName',e.target.value); setValidationErrors(v=>({...v,customerName:undefined})); }} placeholder="Customer Pvt Ltd"/>
                  {validationErrors.customerName && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.customerName}</p>}
                </div>
                <div><label className={lbl}>GSTIN</label><input className={inp} value={form.customerGstin} onChange={e=>sf('customerGstin',e.target.value.toUpperCase())} maxLength={15}/></div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={inp+(validationErrors.customerPhone?' border-red-400':'')} value={form.customerPhone} onChange={e=>{ sf('customerPhone',e.target.value); setValidationErrors(v=>({...v,customerPhone:undefined})); }} placeholder="+91 98765 43210"/>
                  {validationErrors.customerPhone && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.customerPhone}</p>}
                </div>
                <div className="col-span-2 md:col-span-3"><label className={lbl}>Address</label><input className={inp} value={form.customerAddress} onChange={e=>sf('customerAddress',e.target.value)}/></div>
                <div><label className={lbl}>City</label><input className={inp} value={form.customerCity} onChange={e=>sf('customerCity',e.target.value)}/></div>
                <div><label className={lbl}>State</label><select className={inp} value={form.customerState} onChange={e=>sf('customerState',e.target.value)}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div>
                  <label className={lbl}>PIN</label>
                  <input className={inp+(validationErrors.customerPin?' border-red-400':'')} value={form.customerPin} onChange={e=>{ sf('customerPin',e.target.value); setValidationErrors(v=>({...v,customerPin:undefined})); }} maxLength={6} placeholder="400001"/>
                  {validationErrors.customerPin && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.customerPin}</p>}
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" className={inp+(validationErrors.customerEmail?' border-red-400':'')} value={form.customerEmail} onChange={e=>{ sf('customerEmail',e.target.value); setValidationErrors(v=>({...v,customerEmail:undefined})); }} placeholder="customer@example.com"/>
                  {validationErrors.customerEmail && <p className="text-[9px] text-red-500 mt-0.5">{validationErrors.customerEmail}</p>}
                </div>
                <div><label className={lbl}>Place of Supply</label><select className={inp} value={form.placeOfSupply} onChange={e=>sf('placeOfSupply',e.target.value)}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.reverseCharge} onChange={e=>sf('reverseCharge',e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600"/>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reverse Charge</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Shipping Details */}
            <section className="border-t border-slate-100 dark:border-[#2a2a2a] pt-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-500"/>Shipping Details (Ship To)
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.shipSameAsBill || false} onChange={e => {
                    const checked = e.target.checked;
                    setForm(prev => ({
                      ...prev,
                      shipSameAsBill: checked,
                      ...(checked ? {
                        shippingName: prev.customerName,
                        shippingAddress: [prev.customerAddress, prev.customerCity, prev.customerPin].filter(Boolean).join(', '),
                        shippingGstin: prev.customerGstin,
                        shippingState: prev.customerState,
                      } : {}),
                    }));
                  }} className="w-4 h-4 rounded border-slate-300 text-blue-600"/>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Same as Billing Address</span>
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Consignee / Shipping Name</label><input className={inp} value={form.shippingName || ''} onChange={e=>sf('shippingName',e.target.value)} disabled={form.shipSameAsBill}/></div>
                <div><label className={lbl}>Shipping GSTIN</label><input className={inp} value={form.shippingGstin || ''} onChange={e=>sf('shippingGstin',e.target.value.toUpperCase())} maxLength={15} disabled={form.shipSameAsBill}/></div>
                <div><label className={lbl}>Shipping State</label><select className={inp} value={form.shippingState || 'Maharashtra'} onChange={e=>sf('shippingState',e.target.value)} disabled={form.shipSameAsBill}>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="col-span-2 md:col-span-3"><label className={lbl}>Shipping Address</label><input className={inp} value={form.shippingAddress || ''} onChange={e=>sf('shippingAddress',e.target.value)} disabled={form.shipSameAsBill}/></div>
              </div>
            </section>

            {/* Items */}
            <section>
              <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-violet-500"/>Items / Services</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#2a2a2a]">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      {['#','Description','HSN','Qty','Unit','Rate','Disc%','Taxable','GST Type','GST%','CGST','SGST','IGST','Amount',''].map((h,i)=>(
                        <th key={i} className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item,idx)=><ItemRow key={idx} item={item} idx={idx} onChange={updateItem} onRemove={removeItem}/>)}
                  </tbody>
                </table>
              </div>
              <button onClick={addItem} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"><Plus className="w-4 h-4"/>Add Line Item</button>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-72 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                    {[
                      { label:'Sub Total', val:fmtINR(form.subTotal) },
                      ...(form.totalDiscount>0 ? [{ label:'Discount', val:'- '+fmtINR(form.totalDiscount) }] : []),
                      ...(form.totalCgst>0  ? [{ label:'CGST', val:fmtINR(form.totalCgst) }] : []),
                      ...(form.totalSgst>0  ? [{ label:'SGST', val:fmtINR(form.totalSgst) }] : []),
                      ...(form.totalIgst>0  ? [{ label:'IGST', val:fmtINR(form.totalIgst) }] : []),
                      ...(form.roundOff!==0 ? [{ label:'Round Off', val:(form.roundOff>=0?'+':'')+fmtINR(form.roundOff) }] : []),
                    ].map((r,i)=>(
                      <div key={i} className="flex justify-between px-4 py-2">
                        <span className="text-xs text-slate-500">{r.label}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{r.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3" style={{ background: tplColor }}>
                      <span className="text-xs font-black text-white">Grand Total</span>
                      <span className="text-sm font-black text-white">{fmtINR(form.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bank + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-teal-500"/>Bank Details</h4>
                <div className="space-y-2">
                  <div><label className={lbl}>Account Holder</label><input className={inp} value={form.accountHolder} onChange={e=>sf('accountHolder',e.target.value)}/></div>
                  <div><label className={lbl}>Bank Name</label><input className={inp} value={form.bankName} onChange={e=>sf('bankName',e.target.value)}/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={lbl}>Account No</label><input className={inp} value={form.accountNo} onChange={e=>sf('accountNo',e.target.value)}/></div>
                    <div><label className={lbl}>IFSC</label><input className={inp} value={form.ifsc} onChange={e=>sf('ifsc',e.target.value.toUpperCase())}/></div>
                  </div>
                  <div><label className={lbl}>Payment Terms</label><select className={inp} value={form.paymentTerms} onChange={e=>sf('paymentTerms',e.target.value)}>{PAYMENT_TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Info className="w-3.5 h-3.5 text-rose-500"/>Notes & Terms</h4>
                <div className="space-y-2">
                  <div><label className={lbl}>Notes</label><textarea rows={3} className={inp+' resize-none'} value={form.notes} onChange={e=>sf('notes',e.target.value)}/></div>
                  <div><label className={lbl}>Terms & Conditions</label><textarea rows={4} className={inp+' resize-none'} value={form.termsAndConditions} onChange={e=>sf('termsAndConditions',e.target.value)}/></div>
                </div>
              </section>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-[#2a2a2a]">
              <button onClick={()=>setStep('template')} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition">← Templates</button>
              <button onClick={()=>setStep('preview')} className="flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-xl transition" style={{ background: tplColor }}>
                Preview <Eye className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step==='preview' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#0f0f0f] flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <button onClick={()=>setStep('form')} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition">← Edit</button>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"><Printer className="w-3.5 h-3.5"/>Print</button>
                <button onClick={handleDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"><Download className="w-3.5 h-3.5"/>Download PDF</button>
                <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                  {copiedLink ? <><Check className="w-3.5 h-3.5 text-emerald-500"/>Copied!</> : <><Link2 className="w-3.5 h-3.5"/>Copy Link</>}
                </button>
                <button onClick={()=>{
                  const s=encodeURIComponent(`Invoice ${form.invoiceNumber}`);
                  const b=encodeURIComponent(`Dear ${form.customerName},\n\nPlease find invoice ${form.invoiceNumber} for ${fmtINR(form.grandTotal)}.\nDue: ${form.dueDate}\n\nRegards,\n${form.sellerName}`);
                  window.open(`mailto:${form.customerEmail}?subject=${s}&body=${b}`);
                }} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"><Mail className="w-3.5 h-3.5"/>Email</button>
                <button onClick={handleSave} disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-xl text-xs font-bold transition disabled:opacity-60 shadow" style={{ background: tplColor }}>
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                  {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Invoice'}
                </button>
              </div>
            </div>
            {/* Save error banner */}
            {saveError && (
              <div className="px-6 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs text-red-700 font-semibold shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/>
                {saveError}
                <button onClick={()=>setSaveError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5"/></button>
              </div>
            )}
            {/* Public link bar */}
            <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 shrink-0 flex-wrap">
              <Globe className="w-3.5 h-3.5 shrink-0"/>
              <span className="font-medium">Public link:</span>
              <code className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                {typeof window!=='undefined'?window.location.origin:''}/public/invoices/view/{form.invoiceNumber}
              </code>
              <button onClick={handleCopyLink} className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition">
                {copiedLink ? <><Check className="w-3 h-3 text-emerald-500"/>Copied</> : <><Copy className="w-3 h-3"/>Copy</>}
              </button>
            </div>
            {/* Preview */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-[#0a0a0a]">
              <div className="max-w-[860px] mx-auto shadow-2xl rounded overflow-hidden border border-slate-300 dark:border-[#333]">
                <InvoicePreview form={form} printRef={printRef}/>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── RETURN / CREDIT NOTE MODAL ────────────────────────────────────────────────

interface ReturnItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

function ReturnModal({ inv, onClose, onCreated }: { inv: Invoice; onClose: () => void; onCreated: () => void }) {
  const [noteType, setNoteType]   = useState<'Credit Note'|'Debit Note'>('Credit Note');
  const [reason,   setReason]     = useState('');
  const [items,    setItems]      = useState<ReturnItem[]>([{ description: '', qty: 1, rate: 0, amount: 0 }]);
  const [notes,    setNotes]      = useState('');
  const [saving,   setSaving]     = useState(false);
  const [err,      setErr]        = useState('');
  const [done,     setDone]       = useState(false);
  const [noteNum,  setNoteNum]    = useState('');

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const maxAmount   = parseFloat(String(inv.total));

  function updateItem(idx: number, field: keyof ReturnItem, val: string | number) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'qty' || field === 'rate') {
        updated.amount = +(updated.qty * updated.rate).toFixed(2);
      }
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', qty: 1, rate: 0, amount: 0 }]);
  }

  function removeItem(idx: number) {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setErr('');
    if (!reason.trim()) { setErr('Please enter a reason for the return.'); return; }
    if (totalAmount <= 0) { setErr('Total return amount must be greater than zero.'); return; }
    if (totalAmount > maxAmount) { setErr(`Return amount (₹${totalAmount.toFixed(2)}) cannot exceed invoice total (₹${maxAmount.toFixed(2)}).`); return; }
    const emptyItem = items.find(i => !i.description.trim());
    if (emptyItem) { setErr('All return items must have a description.'); return; }
    try {
      setSaving(true);
      const res = await api.post(`/finance/invoices/${inv.id}/credit-notes`, {
        type: noteType,
        reason: reason.trim(),
        items,
        amount: totalAmount,
        notes: notes.trim() || null,
      });
      setNoteNum(res.data?.data?.note?.note_number || '');
      setDone(true);
      onCreated();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create note.');
    } finally {
      setSaving(false);
    }
  }

  const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 bg-white placeholder:text-slate-400 transition';

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} onClick={e=>e.stopPropagation()}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-black text-slate-800">{noteType} Issued</h3>
            <p className="text-xs text-slate-500 mt-1">Note #{noteNum} created for {fmtINR(totalAmount)}</p>
          </div>
          <button onClick={onClose} className="w-full py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition">Done</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
        onClick={e=>e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-white"/>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Invoice Return</h3>
              <p className="text-[10px] text-slate-400">#{inv.invoice_number} · {fmtINR(parseFloat(String(inv.total)))}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 transition"><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Note type */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Note Type</label>
            <div className="flex gap-2">
              {(['Credit Note', 'Debit Note'] as const).map(t => (
                <button key={t} onClick={() => setNoteType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition ${noteType === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <ArrowLeftRight className="w-3 h-3"/>{t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {noteType === 'Credit Note' ? 'You owe the customer money back (goods returned / overcharge).' : 'Customer owes you additional money (short-charged / extra charges).'}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason *</label>
            <input className={inp} placeholder="e.g. Defective item returned, Wrong quantity shipped..." value={reason} onChange={e => setReason(e.target.value)}/>
          </div>

          {/* Return items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Return Items</label>
              <button onClick={addItem} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-3 h-3"/>Add Row
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-slate-500">Description</th>
                    <th className="px-2 py-2 text-right font-bold text-slate-500 w-14">Qty</th>
                    <th className="px-2 py-2 text-right font-bold text-slate-500 w-20">Rate (₹)</th>
                    <th className="px-2 py-2 text-right font-bold text-slate-500 w-20">Amount</th>
                    <th className="w-8"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <input className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-blue-400"
                          placeholder="Item description" value={it.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={1} className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-right focus:outline-none focus:border-blue-400"
                          value={it.qty} onChange={e => updateItem(idx, 'qty', Math.max(1, parseInt(e.target.value)||1))}/>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={0} step={0.01} className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-right focus:outline-none focus:border-blue-400"
                          value={it.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value)||0)}/>
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-slate-700">₹{it.amount.toFixed(2)}</td>
                      <td className="pr-2">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><X className="w-3 h-3"/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-semibold">Total Return Amount</span>
                <span className={`text-xs font-black ${totalAmount > maxAmount ? 'text-red-600' : 'text-slate-800'}`}>{fmtINR(totalAmount)}</span>
              </div>
            </div>
            {totalAmount > maxAmount && (
              <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3"/>Exceeds invoice total of {fmtINR(maxAmount)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Additional Notes</label>
            <textarea rows={2} className={inp + ' resize-none'} placeholder="Optional internal notes..."
              value={notes} onChange={e => setNotes(e.target.value)}/>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0"/>{err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || totalAmount <= 0 || totalAmount > maxAmount}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <RotateCcw className="w-3.5 h-3.5"/>}
            {saving ? 'Issuing...' : `Issue ${noteType}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SHARE MODAL ───────────────────────────────────────────────────────────────

function ShareModal({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pubLink = `${origin}/public/invoices/view/${inv.invoice_number}`;

  function copy() { navigator.clipboard.writeText(pubLink); setCopied(true); setTimeout(()=>setCopied(false),2500); }
  function emailShare() {
    const s = encodeURIComponent(`Invoice ${inv.invoice_number} from ${inv.customer_name}`);
    const b = encodeURIComponent(`Hi,\n\nPlease find invoice ${inv.invoice_number} for ₹${parseFloat(String(inv.total)).toLocaleString('en-IN',{minimumFractionDigits:2})}.\n\nView your invoice online: ${pubLink}\n\nDue Date: ${new Date(inv.due_date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}\n\nThank you!`);
    window.open(`mailto:?subject=${s}&body=${b}`); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
        onClick={e=>e.stopPropagation()}
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center"><Share2 className="w-4 h-4 text-white"/></div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Share Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-400 transition"><X className="w-4 h-4"/></button>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Public Link — Anyone with this link can view</p>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2.5">
            <Globe className="w-4 h-4 text-blue-500 shrink-0"/>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate flex-1 select-all">{pubLink}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={copy}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition border-2 ${copied ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            {copied ? <><Check className="w-4 h-4"/>Copied!</> : <><Copy className="w-4 h-4"/>Copy Link</>}
          </button>
          <button onClick={emailShare}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border-2 border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
            <Mail className="w-4 h-4"/> Email
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
          <p className="text-[9px] text-slate-400 text-center">Invoice #{inv.invoice_number} · {inv.customer_name}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── INVOICES LIST ──────────────────────────────────────────────────────────────

function InvoicesContent() {
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalGstDb, setTotalGstDb]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]               = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [shareInv, setShareInv]       = useState<Invoice | null>(null);
  const [returnInv, setReturnInv]     = useState<Invoice | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Open add modal from URL param, then clear it so refresh won't re-open
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
      // Remove ?action=add from URL without reloading
      router.replace('/finance/invoices', { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await financeGetInvoices({ status:statusFilter||undefined, search:searchQuery||undefined, page, limit:20 });
      setInvoices(res.invoices); setTotal(res.total);
      setTotalGstDb(res.totalGst || 0);
    } catch { setError('Failed to load invoices.'); }
    finally { setLoading(false); }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(id: string, invoiceNumber: string, viewOnly = false) {
    if (viewOnly) {
      window.open(`/public/invoices/view/${invoiceNumber}`, '_blank');
    } else {
      window.open(`/public/invoices/view/${invoiceNumber}?print=true`, '_blank');
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    const updates: Record<string,string> = { status:newStatus };
    if (newStatus==='Paid') updates.paid_date = new Date().toISOString().split('T')[0];
    try { await financeUpdateInvoice(id,updates); load(); } catch {}
  }

  const statusColor = (s:string) => ({
    Paid:'bg-emerald-100 text-emerald-700', Overdue:'bg-red-100 text-red-700',
    Sent:'bg-blue-100 text-blue-700', Cancelled:'bg-slate-100 text-slate-600',
    Draft:'bg-amber-100 text-amber-700',
  }[s] || 'bg-amber-100 text-amber-700');

  const canEdit = (s:string) => s !== 'Paid' && s !== 'Cancelled';

  // Stats
  const draftCount    = invoices.filter(i=>i.status==='Draft').length;
  const overdueCount  = invoices.filter(i=>i.status==='Overdue').length;
  const paidTotal     = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+parseFloat(String(i.total)),0);
  const pendingTotal  = invoices.filter(i=>['Sent','Overdue'].includes(i.status)).reduce((s,i)=>s+parseFloat(String(i.total)),0);
  const totalGst      = invoices.reduce((s,i)=>s+parseFloat(String(i.tax || 0)),0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Tax Invoices</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Indian GST · CGST/SGST/IGST · Tally-style</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()}
              className="pl-9 pr-4 py-2 border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 w-44 bg-[var(--card)] text-[var(--foreground)]"/>
            <Search className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)]">
            <option value="">All Statuses</option>
            {['Draft','Sent','Paid','Overdue','Cancelled'].map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">
            <Filter className="w-4 h-4"/> Filter
          </button>
          <button className="flex items-center gap-2 p-2 border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors">
            <ArrowUpDown className="w-4 h-4"/> Sort
          </button>
          <button onClick={()=>{ setEditInvoice(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition active:scale-95">
            <Plus className="w-3.5 h-3.5"/> New Invoice
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:'Total Invoices', val:total,              color:'text-blue-600',   bg:'bg-blue-50',    icon: FileText },
          { label:'Paid Amount',    val:fmtINR(paidTotal),  color:'text-emerald-600',bg:'bg-emerald-50', icon: IndianRupee },
          { label:'GST Amount',     val:fmtINR(totalGstDb), color:'text-violet-600', bg:'bg-violet-50',  icon: Percent },
          { label:'Pending Amount', val:fmtINR(pendingTotal),color:'text-amber-600', bg:'bg-amber-50',   icon: IndianRupee },
          { label:'Overdue',        val:overdueCount,       color:'text-red-600',    bg:'bg-red-50',     icon: AlertCircle },
        ].map((s,i)=>(
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`}/>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
              <p className="text-base font-extrabold text-[var(--foreground)] mt-0.5">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.05}}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)]">
                {['Invoice #','Customer','Taxable','GST','Total','Due Date','Status','Actions'].map((h,i)=>(
                  <th key={i} className={`p-4 font-semibold ${['Taxable','GST','Total'].includes(h)?'text-right':h==='Actions'?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium text-[var(--foreground)]">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto"/>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">Loading...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto"/><p className="text-xs text-red-500 mt-2">{error}</p>
                </td></tr>
              ) : invoices.length===0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2"/>
                  <p className="text-xs text-[var(--muted-foreground)] font-semibold">No invoices found.</p>
                  <button onClick={()=>setShowModal(true)} className="mt-3 text-xs font-bold text-amber-500 hover:text-amber-700 underline">Create first invoice</button>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[var(--accent)] transition">
                  <td className="p-4 font-bold text-amber-600">{inv.invoice_number}</td>
                  <td className="p-4">{inv.customer_name}</td>
                  <td className="p-4 text-right">₹{parseFloat(String(inv.amount)).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td className="p-4 text-right text-[var(--muted-foreground)]">₹{parseFloat(String(inv.tax)).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td className="p-4 text-right font-bold">₹{parseFloat(String(inv.total)).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">{new Date(inv.due_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${statusColor(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* View PDF */}
                      <button onClick={()=>handleDownload(inv.id,inv.invoice_number,true)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition" title="View PDF"><Eye className="w-4 h-4"/></button>
                      {/* Download PDF */}
                      <button onClick={()=>handleDownload(inv.id,inv.invoice_number,false)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition" title="Download PDF"><Download className="w-4 h-4"/></button>
                      {/* Edit (pre-paid only) */}
                      {canEdit(inv.status) && (
                        <button onClick={()=>{ setEditInvoice(inv); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition" title="Edit Invoice"><Pencil className="w-4 h-4"/></button>
                      )}
                      {/* Return / Credit Note (paid only) */}
                      {inv.status === 'Paid' && (
                        <button onClick={()=>setReturnInv(inv)}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition" title="Return / Credit Note"><RotateCcw className="w-4 h-4"/></button>
                      )}
                      {/* Share */}
                      <button onClick={()=>setShareInv(inv)}
                        className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-500 transition" title="Share"><Share2 className="w-4 h-4"/></button>
                      {/* Status update */}
                      {inv.status!=='Paid' && inv.status!=='Cancelled' && (
                        <select value="" onChange={e=>e.target.value&&handleStatusUpdate(inv.id,e.target.value)}
                          className="p-1.5 border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--muted-foreground)] bg-[var(--card)]">
                          <option value="">Update…</option>
                          {inv.status==='Draft' && <option value="Sent">Mark Sent</option>}
                          <option value="Paid">Mark Paid</option>
                          <option value="Overdue">Mark Overdue</option>
                          <option value="Cancelled">Cancel</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
          <span>Showing {invoices.length} of {total} invoices</span>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Previous</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={invoices.length<20} className="px-3 py-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] disabled:opacity-50">Next</button>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <InvoiceModal
            key={editInvoice?.id||'new'}
            editId={editInvoice?.id}
            initial={editInvoice ? {
              invoiceNumber: editInvoice.invoice_number,
              customerName:  editInvoice.customer_name,
              dueDate:       editInvoice.due_date?.split('T')[0] || '',
              invoiceDate:   editInvoice.created_at?.split('T')[0] || '',
              subTotal:      parseFloat(String(editInvoice.amount)),
              grandTotal:    parseFloat(String(editInvoice.total)),
            } : undefined}
            onClose={()=>{ setShowModal(false); setEditInvoice(null); }}
            onSaved={()=>{
              setShowModal(false);
              setEditInvoice(null);
              setStatusFilter('');
              setSearchQuery('');
              setPage(1);
              setTimeout(() => load(), 0);
            }}
          />
        )}
        {shareInv && (
          <ShareModal key={shareInv.id} inv={shareInv} onClose={()=>setShareInv(null)}/>
        )}
        {returnInv && (
          <ReturnModal key={`return-${returnInv.id}`} inv={returnInv}
            onClose={()=>setReturnInv(null)}
            onCreated={()=>{
              setStatusFilter('');
              setSearchQuery('');
              setPage(1);
              setTimeout(() => load(), 0);
            }}/>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"/></div>}>
      <InvoicesContent/>
    </Suspense>
  );
}
