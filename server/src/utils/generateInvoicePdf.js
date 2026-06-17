/**
 * Indian GST Tax Invoice PDF generator — pure Node.js, no external deps.
 * Returns a Buffer containing a valid PDF/1.4 document.
 */

const TEMPLATE_COLORS = {
  modern:   '#2563eb',
  classic:  '#1e3a5f',
  emerald:  '#059669',
  saffron:  '#d97706',
  maroon:   '#9f1239',
  slate:    '#475569',
  violet:   '#7c3aed',
  teal:     '#0d9488',
  sunset:   '#ea580c',
  indigo:   '#4338ca',
  rose:     '#e11d48',
  forest:   '#166534',
  navy:     '#1e3a5f',
  copper:   '#92400e',
  graphite: '#1f2937',
};

function hexToRgbPdf(hex) {
  const h = (hex || '#2563eb').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function esc(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function fmtINR(amount) {
  const n = parseFloat(amount) || 0;
  return 'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
}

function numberToWords(num) {
  if (!num || num === 0) return 'Zero Rupees Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+convert(n%100000) : '');
    return convert(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+convert(n%10000000) : '');
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees)*100);
  let result = convert(rupees)+' Rupees';
  if (paise > 0) result += ' and '+convert(paise)+' Paise';
  return result+' Only';
}

/**
 * @param {Object} invoice
 * @param {string} invoice.invoiceNumber
 * @param {string} invoice.customerName   – bill-to name
 * @param {string} invoice.sellerName     – your company
 * @param {string} invoice.sellerGstin
 * @param {string} invoice.sellerAddress
 * @param {string} invoice.customerGstin
 * @param {string} invoice.customerAddress
 * @param {number} invoice.subTotal
 * @param {number} invoice.totalCgst
 * @param {number} invoice.totalSgst
 * @param {number} invoice.totalIgst
 * @param {number} invoice.grandTotal
 * @param {string} invoice.status
 * @param {string} invoice.issuedDate
 * @param {string} invoice.dueDate
 * @param {Array}  invoice.items          – [{description, hsn, qty, unit, rate, taxable, cgst, sgst, igst, amount}]
 * @param {string} invoice.bankName
 * @param {string} invoice.accountNo
 * @param {string} invoice.ifsc
 * @param {string} invoice.notes
 * @returns {Buffer}
 */
function generateInvoicePdf(invoice) {
  const inv = invoice || {};

  // Unpack metadata from notes if it is a JSON string
  let meta = {};
  if (typeof inv.notes === 'string') {
    try {
      meta = JSON.parse(inv.notes);
    } catch (e) {
      // Not JSON
    }
  }

  const invoiceNumber  = inv.invoiceNumber  || inv.invoice_number  || 'N/A';
  const customerName   = inv.customerName   || inv.customer_name   || inv.tenant || inv.tenantName || 'N/A';
  
  const template       = inv.template       || meta.template       || 'modern';
  const accentHex      = TEMPLATE_COLORS[template] || TEMPLATE_COLORS.modern;
  const primaryColor   = hexToRgbPdf(accentHex);

  const sellerName     = inv.sellerName     || meta.sellerName     || inv.tenantName || 'Your Company';
  const sellerGstin    = inv.sellerGstin    || meta.sellerGstin    || '';
  const sellerAddress  = inv.sellerAddress  || meta.sellerAddress  || '';
  const customerGstin  = inv.customerGstin  || meta.customerGstin  || '';
  const customerAddress= inv.customerAddress|| meta.customerAddress|| '';
  const sellerState    = inv.sellerState    || meta.sellerState    || '';
  const customerState  = inv.customerState  || meta.customerState    || '';
  const placeOfSupply  = inv.placeOfSupply  || meta.placeOfSupply  || '';

  const subTotal       = parseFloat(inv.subTotal    || inv.amount || meta.subTotal || 0);
  const taxTotal       = parseFloat(inv.tax         || inv.taxTotal || 0);

  // Check if we are inter-state (IGST) or intra-state (CGST + SGST)
  let isInterState = false;
  if (placeOfSupply && sellerState) {
    isInterState = placeOfSupply.toLowerCase().trim() !== sellerState.toLowerCase().trim();
  } else if (customerState && sellerState) {
    isInterState = customerState.toLowerCase().trim() !== sellerState.toLowerCase().trim();
  } else if (sellerGstin && customerGstin) {
    const sCode = sellerGstin.trim().substring(0, 2);
    const cCode = customerGstin.trim().substring(0, 2);
    if (sCode && cCode && /^\d+$/.test(sCode) && /^\d+$/.test(cCode)) {
      isInterState = sCode !== cCode;
    }
  }

  const calculatedGstRate = subTotal > 0 ? Math.round((taxTotal / subTotal) * 100) : 18;

  let rawItems = [];
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    rawItems = inv.items;
  } else if (Array.isArray(meta.items) && meta.items.length > 0) {
    rawItems = meta.items;
  } else {
    // Fallback item
    rawItems = [{
      description: 'Services Rendered',
      hsn: '',
      qty: 1,
      unit: 'Nos',
      rate: subTotal,
      taxable: subTotal,
      cgst: 0,
      sgst: 0,
      igst: 0,
      amount: subTotal + taxTotal
    }];
  }

  // Ensure items have correct GST details
  const items = rawItems.map(item => {
    const it = { ...item };
    it.qty = parseFloat(it.qty) || 1;
    it.rate = parseFloat(it.rate) || 0;
    it.discount = parseFloat(it.discount) || 0;
    if (it.taxable === undefined || it.taxable === null) {
      it.taxable = it.qty * it.rate * (1 - it.discount / 100);
    }
    it.taxable = parseFloat(it.taxable) || 0;

    if (!it.gstType) {
      it.gstType = isInterState ? 'IGST' : 'CGST+SGST';
    }
    if (it.gstRate === undefined || it.gstRate === null) {
      it.gstRate = calculatedGstRate;
    }

    const itemCgst = parseFloat(it.cgst) || 0;
    const itemSgst = parseFloat(it.sgst) || 0;
    const itemIgst = parseFloat(it.igst) || 0;

    if (itemCgst === 0 && itemSgst === 0 && itemIgst === 0 && taxTotal > 0 && it.gstType !== 'Exempt') {
      const gstAmt = it.taxable * (it.gstRate / 100);
      if (it.gstType === 'IGST') {
        it.igst = gstAmt;
        it.cgst = 0;
        it.sgst = 0;
      } else {
        it.cgst = gstAmt / 2;
        it.sgst = gstAmt / 2;
        it.igst = 0;
      }
    } else {
      it.cgst = itemCgst;
      it.sgst = itemSgst;
      it.igst = itemIgst;
    }

    if (it.amount === undefined || it.amount === null || it.amount === 0) {
      it.amount = it.taxable + (it.cgst + it.sgst + it.igst);
    }
    it.amount = parseFloat(it.amount) || 0;
    return it;
  });

  // Calculate totals from items
  let sumCgst = items.reduce((sum, it) => sum + it.cgst, 0);
  let sumSgst = items.reduce((sum, it) => sum + it.sgst, 0);
  let sumIgst = items.reduce((sum, it) => sum + it.igst, 0);

  if (sumCgst === 0 && sumSgst === 0 && sumIgst === 0 && taxTotal > 0) {
    if (isInterState) {
      sumIgst = taxTotal;
    } else {
      sumCgst = taxTotal / 2;
      sumSgst = taxTotal / 2;
    }
  }

  const totalCgst      = parseFloat(inv.totalCgst   || meta.totalCgst   || sumCgst);
  const totalSgst      = parseFloat(inv.totalSgst   || meta.totalSgst   || sumSgst);
  const totalIgst      = parseFloat(inv.totalIgst   || meta.totalIgst   || sumIgst);
  const grandTotal     = parseFloat(inv.grandTotal  || inv.total  || meta.grandTotal || subTotal + taxTotal);

  const poNumber        = inv.poNumber        || meta.poNumber        || '';
  const ewayBill        = inv.ewayBill        || meta.ewayBill        || '';
  const challanNo       = inv.challanNo       || meta.challanNo       || '';
  const challanDate     = inv.challanDate     || meta.challanDate     || '';
  const shipSameAsBill  = meta.shipSameAsBill !== undefined ? meta.shipSameAsBill : true;
  const shippingName    = inv.shippingName    || meta.shippingName    || '';
  const shippingAddress = inv.shippingAddress || meta.shippingAddress || '';
  const shippingGstin   = inv.shippingGstin   || meta.shippingGstin   || '';
  const shippingState   = inv.shippingState   || meta.shippingState   || '';

  const status         = String(inv.status          || 'DRAFT').toUpperCase();
  const issuedDate     = fmtDate(inv.issuedDate     || inv.created_at);
  const dueDate        = fmtDate(inv.dueDate        || inv.due_date);
  const bankName       = inv.bankName   || meta.bankName   || '';
  const accountNo      = inv.accountNo  || meta.accountNo  || '';
  const ifsc           = inv.ifsc       || meta.ifsc       || '';
  const notes          = inv.notes      && !inv.notes.startsWith('{') ? inv.notes : (meta.userNotes || 'Thank you for your business!');

  // ── Build PDF content stream ─────────────────────────────────────────────────
  // Page size: A4 = 595 × 841 pt
  const W = 595, H = 841;
  const L = 40, R = W - 40; // margins
  const lines = [];

  // ── Header band (filled rect) ────────────────────────────────────────────────
  lines.push(`${primaryColor} rg`);
  lines.push(`${L} 790 ${W - L*2} 42 re f`);
  lines.push('1 1 1 rg'); // white text

  lines.push('BT /F2 18 Tf');
  lines.push(`${L+8} 803 Td (TAX INVOICE) Tj ET`);

  lines.push('BT /F1 8 Tf');
  lines.push(`350 812 Td (Invoice No: ${esc(invoiceNumber)}) Tj ET`);
  lines.push('BT /F1 8 Tf');
  lines.push(`350 801 Td (Date: ${esc(issuedDate)}) Tj ET`);
  lines.push('BT /F1 8 Tf');
  lines.push(`350 790 Td (Due: ${esc(dueDate)}) Tj ET`);

  // Status badge
  const statusX = R - 60;
  let badgeBg = '0.95 0.61 0.07'; // amber
  let badgeText = '0 0 0'; // black
  if (status === 'PAID') {
    badgeBg = '0.063 0.616 0.345'; // green
    badgeText = '1 1 1'; // white
  } else if (status === 'OVERDUE') {
    badgeBg = '0.863 0.149 0.149'; // red
    badgeText = '1 1 1';
  } else if (status === 'SENT') {
    badgeBg = '0.145 0.455 0.863'; // blue
    badgeText = '1 1 1';
  } else if (status === 'CANCELLED') {
    badgeBg = '0.424 0.478 0.537'; // slate gray
    badgeText = '1 1 1';
  }
  lines.push(`${badgeBg} rg`);
  lines.push(`${statusX} 793 55 14 re f`);
  lines.push(`${badgeText} rg`);
  lines.push(`BT /F2 7 Tf ${statusX+4} 797 Td (${esc(status)}) Tj ET`);

  // ── Seller + Customer blocks ─────────────────────────────────────────────────
  const hasShipTo = shippingAddress && shippingAddress.trim() !== '' && !shipSameAsBill;

  lines.push('0.95 0.95 0.95 rg');
  if (hasShipTo) {
    // 3-column layout: FROM, BILL TO, SHIP TO (card height: 58, starting at y=726)
    lines.push(`${L} 726 165 58 re f`);
    lines.push(`${L+175} 726 165 58 re f`);
    lines.push(`${L+350} 726 165 58 re f`);
  } else {
    // 2-column layout (standard) (card height: 58, starting at y=726)
    lines.push(`${L} 726 240 58 re f`);
    lines.push(`${L+250} 726 240 58 re f`);
  }
  lines.push('0 0 0 rg');

  // Seller (Box 1)
  lines.push(`BT /F2 7 Tf ${L+4} 774 Td (FROM) Tj ET`);
  lines.push(`BT /F2 8 Tf ${L+4} 764 Td (${esc(sellerName)}) Tj ET`);
  if (sellerGstin)  lines.push(`BT /F1 7 Tf ${L+4} 754 Td (GSTIN: ${esc(sellerGstin)}) Tj ET`);
  if (sellerAddress) lines.push(`BT /F1 6 Tf ${L+4} 746 Td (${esc(sellerAddress.slice(0,40))}) Tj ET`);

  // Customer (Box 2 / Box 3)
  if (hasShipTo) {
    const bx = L + 179;
    lines.push(`BT /F2 7 Tf ${bx} 774 Td (BILL TO) Tj ET`);
    lines.push(`BT /F2 8 Tf ${bx} 764 Td (${esc(customerName)}) Tj ET`);
    if (customerGstin)   lines.push(`BT /F1 7 Tf ${bx} 754 Td (GSTIN: ${esc(customerGstin)}) Tj ET`);
    if (customerAddress) lines.push(`BT /F1 6 Tf ${bx} 746 Td (${esc(customerAddress.slice(0,40))}) Tj ET`);

    const sx = L + 354;
    lines.push(`BT /F2 7 Tf ${sx} 774 Td (SHIP TO) Tj ET`);
    lines.push(`BT /F2 8 Tf ${sx} 764 Td (${esc(shippingName || customerName)}) Tj ET`);
    if (shippingGstin)   lines.push(`BT /F1 7 Tf ${sx} 754 Td (GSTIN: ${esc(shippingGstin)}) Tj ET`);
    if (shippingAddress) lines.push(`BT /F1 6 Tf ${sx} 746 Td (${esc(shippingAddress.slice(0,40))}) Tj ET`);
  } else {
    const bx = L + 254;
    lines.push(`BT /F2 7 Tf ${bx} 774 Td (BILL TO) Tj ET`);
    lines.push(`BT /F2 8 Tf ${bx} 764 Td (${esc(customerName)}) Tj ET`);
    if (customerGstin)   lines.push(`BT /F1 7 Tf ${bx} 754 Td (GSTIN: ${esc(customerGstin)}) Tj ET`);
    if (customerAddress) lines.push(`BT /F1 6 Tf ${bx} 746 Td (${esc(customerAddress.slice(0,55))}) Tj ET`);

    // Render PO/Challan/E-way info in Box 2
    if (poNumber || ewayBill || challanNo) {
      let extraInfo = '';
      if (poNumber) extraInfo += `PO: ${poNumber}  `;
      if (ewayBill) extraInfo += `E-Way: ${ewayBill}  `;
      if (challanNo) extraInfo += `Challan: ${challanNo}`;
      lines.push(`BT /F1 6 Tf ${bx} 734 Td (${esc(extraInfo.trim())}) Tj ET`);
    }
  }

  // ── Items table header ───────────────────────────────────────────────────────
  let y = 712;
  lines.push(`${primaryColor} rg`);
  lines.push(`${L} ${y-2} ${W-L*2} 14 re f`);
  lines.push('1 1 1 rg');
  lines.push(`BT /F2 7 Tf ${L+2} ${y+4} Td (#) Tj ET`);
  lines.push(`BT /F2 7 Tf ${L+16} ${y+4} Td (Description) Tj ET`);
  lines.push(`BT /F2 7 Tf 260 ${y+4} Td (HSN) Tj ET`);
  lines.push(`BT /F2 7 Tf 295 ${y+4} Td (Qty) Tj ET`);
  lines.push(`BT /F2 7 Tf 320 ${y+4} Td (Rate) Tj ET`);
  lines.push(`BT /F2 7 Tf 365 ${y+4} Td (Taxable) Tj ET`);
  lines.push(`BT /F2 7 Tf 415 ${y+4} Td (CGST) Tj ET`);
  lines.push(`BT /F2 7 Tf 450 ${y+4} Td (SGST) Tj ET`);
  lines.push(`BT /F2 7 Tf 490 ${y+4} Td (IGST) Tj ET`);
  lines.push(`BT /F2 7 Tf 527 ${y+4} Td (Amount) Tj ET`);

  // ── Item rows ────────────────────────────────────────────────────────────────
  lines.push('0 0 0 rg');
  y -= 14;
  items.forEach((item, idx) => {
    const bg = idx % 2 === 0 ? '0.98 0.98 0.98' : '1 1 1';
    lines.push(`${bg} rg`);
    lines.push(`${L} ${y-3} ${W-L*2} 14 re f`);
    lines.push('0 0 0 rg');
    const desc = esc(String(item.description || '').slice(0, 35));
    lines.push(`BT /F1 7 Tf ${L+2} ${y+4} Td (${idx+1}) Tj ET`);
    lines.push(`BT /F1 7 Tf ${L+16} ${y+4} Td (${desc}) Tj ET`);
    lines.push(`BT /F1 7 Tf 260 ${y+4} Td (${esc(item.hsn||'')}) Tj ET`);
    lines.push(`BT /F1 7 Tf 295 ${y+4} Td (${esc(String(item.qty||1))}) Tj ET`);
    lines.push(`BT /F1 7 Tf 318 ${y+4} Td (${esc(fmtINR(item.rate||0))}) Tj ET`);
    lines.push(`BT /F1 7 Tf 363 ${y+4} Td (${esc(fmtINR(item.taxable||0))}) Tj ET`);
    lines.push(`BT /F1 7 Tf 413 ${y+4} Td (${esc(fmtINR(item.cgst||0))}) Tj ET`);
    lines.push(`BT /F1 7 Tf 448 ${y+4} Td (${esc(fmtINR(item.sgst||0))}) Tj ET`);
    lines.push(`BT /F1 7 Tf 488 ${y+4} Td (${esc(fmtINR(item.igst||0))}) Tj ET`);
    lines.push(`BT /F2 7 Tf 525 ${y+4} Td (${esc(fmtINR(item.amount||0))}) Tj ET`);
    y -= 14;
  });

  // ── Totals ───────────────────────────────────────────────────────────────────
  y -= 4;
  const totRows = [
    ['Sub Total', fmtINR(subTotal)],
    ...(totalCgst > 0  ? [['Total CGST', fmtINR(totalCgst)]] : []),
    ...(totalSgst > 0  ? [['Total SGST', fmtINR(totalSgst)]] : []),
    ...(totalIgst > 0  ? [['Total IGST', fmtINR(totalIgst)]] : []),
    ...(taxTotal > 0 && totalCgst === 0 && totalSgst === 0 && totalIgst === 0
       ? [['Total Tax', fmtINR(taxTotal)]] : []),
  ];
  totRows.forEach(([label, val]) => {
    lines.push('0.95 0.95 0.95 rg');
    lines.push(`360 ${y-3} ${W-L-360} 13 re f`);
    lines.push('0 0 0 rg');
    lines.push(`BT /F1 8 Tf 365 ${y+2} Td (${esc(label)}) Tj ET`);
    lines.push(`BT /F1 8 Tf 490 ${y+2} Td (${esc(val)}) Tj ET`);
    y -= 13;
  });

  // Grand total row
  lines.push(`${primaryColor} rg`);
  lines.push(`360 ${y-3} ${W-L-360} 15 re f`);
  lines.push('1 1 1 rg');
  lines.push(`BT /F2 9 Tf 365 ${y+3} Td (GRAND TOTAL) Tj ET`);
  lines.push(`BT /F2 9 Tf 480 ${y+3} Td (${esc(fmtINR(grandTotal))}) Tj ET`);
  y -= 20;

  // Amount in words
  lines.push('0 0 0 rg');
  const words = numberToWords(grandTotal);
  lines.push(`BT /F1 8 Tf ${L} ${y} Td (Amount in Words: ${esc(words)}) Tj ET`);
  y -= 20;

  // ── Bank details + Notes side by side ─────────────────────────────────────
  if (bankName || accountNo || notes) {
    lines.push('0.9 0.9 0.9 RG 0.5 w');
    lines.push(`${L} ${y+4} m ${R} ${y+4} l S`);
    y -= 8;

    if (bankName || accountNo) {
      lines.push(`BT /F2 8 Tf ${L} ${y} Td (Bank Details) Tj ET`);
      y -= 12;
      if (bankName)  lines.push(`BT /F1 8 Tf ${L} ${y} Td (Bank: ${esc(bankName)}) Tj ET`);
      y -= 11;
      if (accountNo) lines.push(`BT /F1 8 Tf ${L} ${y} Td (A/c: ${esc(accountNo)}) Tj ET`);
      y -= 11;
      if (ifsc)      lines.push(`BT /F1 8 Tf ${L} ${y} Td (IFSC: ${esc(ifsc)}) Tj ET`);
      y -= 11;
    }

    if (notes) {
      lines.push(`BT /F2 8 Tf 320 ${y+33} Td (Notes) Tj ET`);
      lines.push(`BT /F1 7 Tf 320 ${y+22} Td (${esc(notes.slice(0,80))}) Tj ET`);
    }
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  lines.push(`${primaryColor} rg`);
  lines.push(`${L} 28 ${W-L*2} 18 re f`);
  lines.push('1 1 1 rg');
  lines.push(`BT /F1 7 Tf ${L+6} 34 Td (This is a computer-generated invoice. No signature required. Generated by HubNest CRM.) Tj ET`);
  lines.push('0 0 0 rg');

  // ── Assemble PDF ─────────────────────────────────────────────────────────────
  const contentStream = lines.join('\n');
  const streamBytes = Buffer.from(contentStream, 'latin1');

  const objects = [];
  const offsets = [];
  function addObj(content) {
    const idx = objects.length + 1;
    objects.push({ idx, content });
    return idx;
  }

  addObj(`<< /Type /Catalog /Pages 2 0 R >>`);
  addObj(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  addObj(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
    `/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`
  );
  addObj(`<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`);
  addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

  const parts = [Buffer.from('%PDF-1.4\n', 'latin1')];
  for (const obj of objects) {
    offsets.push(parts.reduce((s, b) => s + b.length, 0));
    parts.push(Buffer.from(`${obj.idx} 0 obj\n${obj.content}\nendobj\n`, 'latin1'));
  }

  const xrefOffset = parts.reduce((s, b) => s + b.length, 0);
  const xrefLines = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
  for (const off of offsets) {
    xrefLines.push(String(off).padStart(10, '0') + ' 00000 n \n');
  }
  parts.push(Buffer.from(xrefLines.join(''), 'latin1'));
  parts.push(Buffer.from(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    'latin1'
  ));

  return Buffer.concat(parts);
}

module.exports = { generateInvoicePdf };
