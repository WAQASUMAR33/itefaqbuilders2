/**
 * Generates a PDF from a report page's table data and shares it via WhatsApp.
 *
 * Uses jsPDF + jspdf-autotable to build the PDF from extracted DOM data.
 * This avoids html2canvas entirely, which has known issues with CSS Level 4
 * color functions (lab, oklch) used by MUI v7.
 *
 * - Mobile browsers: native Web Share API — WhatsApp appears in the share sheet.
 * - Desktop browsers: auto-downloads the PDF, then opens WhatsApp Web with a
 *   pre-filled message so the user can attach the downloaded file.
 *
 * @param {string} elementId   - id of the wrapping report container
 * @param {object} options
 * @param {string} options.filename  - PDF file name
 * @param {string} options.title     - Report title shown in the PDF and WhatsApp message
 * @param {string} [options.message] - Custom WhatsApp message text (optional)
 */
export async function shareReportViaWhatsApp(elementId, options = {}) {
  const { filename = 'report.pdf', title = 'Report', message = null } = options;

  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // ── Dynamic imports (browser-only) ────────────────────────────────────────
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default ?? autoTableModule;

  // ── Extract company header from the print-only section ────────────────────
  // Report pages have a <div class="hidden print:block ..."> for the company header
  // SVG elements have className as SVGAnimatedString (not a plain string), so guard with typeof
  const getCls = el => (typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? ''));
  const printSection = [...element.querySelectorAll('[class]')].find(el => {
    const cls = getCls(el);
    return cls.includes('hidden') && cls.includes('print:block');
  });

  const companyName =
    printSection?.querySelector('h1')?.textContent?.trim() ||
    'Ittefaq Iron and Cement Store';

  const allParagraphs = printSection
    ? [...printSection.querySelectorAll('p')]
    : [];

  const addressLine = allParagraphs[0]?.textContent?.trim() ||
    'Address: Parianwali | Phone: +92 346 7560306';

  // Date range / subtitle (2nd and 3rd <p> in the print section)
  const subtitleLine = allParagraphs
    .slice(1)
    .map(p => p.textContent.trim())
    .filter(Boolean)
    .join('   ');

  // ── Extract table data ────────────────────────────────────────────────────
  const table = element.querySelector('table');

  const tableHeaders = table
    ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim())
    : [];

  const tableBody = table
    ? [...table.querySelectorAll('tbody tr')].map(tr =>
        [...tr.querySelectorAll('td')].map(td => td.textContent.trim())
      )
    : [];

  const tableFoot = table
    ? [...table.querySelectorAll('tfoot tr')].map(tr =>
        [...tr.querySelectorAll('td, th')].map(td => td.textContent.trim())
      )
    : [];

  // ── Create PDF ────────────────────────────────────────────────────────────
  // Use landscape for wide tables (many columns)
  const colCount = tableHeaders.length;
  const orientation = colCount > 7 ? 'landscape' : 'portrait';
  const fontSize = colCount > 8 ? 6.5 : colCount > 6 ? 7.5 : 8.5;

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 13;
  let y = margin;

  // Company name
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(33, 33, 33);
  pdf.text(companyName, pageW / 2, y, { align: 'center' });
  y += 6;

  // Address / phone
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text(addressLine, pageW / 2, y, { align: 'center' });
  y += 5;

  // Report title
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 118, 210);
  pdf.text(title, pageW / 2, y, { align: 'center' });
  y += 5;

  // Subtitle (date range, customer name, etc.)
  if (subtitleLine) {
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(subtitleLine, pageW / 2, y, { align: 'center' });
    y += 4;
  }

  // Generated timestamp
  pdf.setFontSize(7.5);
  pdf.setTextColor(160, 160, 160);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: 'center' });
  y += 4;

  // Horizontal rule
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;

  // ── Table ─────────────────────────────────────────────────────────────────
  if (tableHeaders.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [tableHeaders],
      body: tableBody,
      foot: tableFoot.length > 0 ? tableFoot : undefined,
      margin: { left: margin, right: margin, bottom: 15 },
      styles: {
        fontSize,
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
        overflow: 'ellipsize',
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [45, 45, 45],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize,
      },
      footStyles: {
        fillColor: [235, 235, 235],
        textColor: [33, 33, 33],
        fontStyle: 'bold',
        fontSize,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: () => {
        // Page number at bottom center
        const totalPages = pdf.internal.getNumberOfPages();
        const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.setFontSize(7.5);
        pdf.setTextColor(160, 160, 160);
        pdf.text(
          `Page ${currentPage} of ${totalPages}`,
          pageW / 2,
          pageH - 7,
          { align: 'center' }
        );
      },
    });
  }

  const blob = pdf.output('blob');
  const pdfFile = new File([blob], filename, { type: 'application/pdf' });

  // ── Mobile: native share sheet (WhatsApp appears as option) ───────────────
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title,
        text: message || `${title} - ${new Date().toLocaleDateString()}`,
      });
      return;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return; // user cancelled — not an error
      // fall through to desktop download approach
    }
  }

  // ── Desktop: download PDF then open WhatsApp Web ───────────────────────────
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

  const waMsg =
    message ||
    `*${title}*\nGenerated: ${new Date().toLocaleString()}\n\nThe PDF report has been downloaded to your device. Please attach it when sharing.`;

  window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank');
}

/**
 * Captures the already-rendered bill/receipt DOM element and shares it as a
 * PDF via WhatsApp.
 *
 * Uses html2canvas to screenshot the rendered invoice (which preserves the
 * exact Urdu layout, fonts, and two-column summary). Before rendering,
 * MUI v7 stylesheets that contain CSS Level 4 color functions (lab/oklch)
 * are removed from the cloned document so html2canvas doesn't choke on them.
 * The invoice element itself uses plain colours and is unaffected.
 *
 * @param {string} elementId          - id of the rendered invoice container
 * @param {object} [options]
 * @param {string} [options.filename]      - PDF file name
 * @param {string} [options.title]         - WhatsApp message title
 * @param {string} [options.saleId]        - Sale ID for the WA message
 * @param {string} [options.customerName]  - Customer name for the WA message
 * @param {string} [options.message]       - Override the entire WA message
 */
export async function shareReceiptViaWhatsApp(elementId, options = {}) {
  const {
    filename = 'receipt.pdf',
    title = 'Sales Receipt',
    saleId = '',
    customerName = '',
    phone = '',
    message = null,
  } = options;

  // Normalize phone for wa.me: strip everything except digits, ensure country code
  // Pakistani numbers: 03XX-XXXXXXX → 923XXXXXXXXX
  const normalizePhone = (raw) => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '92' + digits.slice(1); // 0xxx → 92xxx
    return digits;
  };
  const waPhone = normalizePhone(phone);

  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const { jsPDF } = await import('jspdf');
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default ?? html2canvasModule;

  // Capture the rendered invoice.
  // onclone: strip any <style> tags that use lab()/oklch() — those come from
  // MUI v7 design tokens and are not understood by html2canvas's CSS parser.
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('style').forEach(style => {
        if (style.textContent.includes('lab(') || style.textContent.includes('oklch(')) {
          style.remove();
        }
      });
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const canvasW = canvas.width;
  const canvasH = canvas.height;

  // Fit image to A4 width; height scales proportionally (may exceed A4 for
  // long receipts — jsPDF accepts arbitrary page heights)
  const pdfW = 210;
  const pdfH = (canvasH / canvasW) * pdfW;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfW, Math.max(pdfH, 297)],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);

  // ── Share ─────────────────────────────────────────────────────────────────
  const blob = pdf.output('blob');
  const pdfFile = new File([blob], filename, { type: 'application/pdf' });

  const waMsg =
    message ||
    `*${title}*${saleId ? `\nInvoice #${saleId}` : ''}${customerName ? ` for ${customerName}` : ''}\nDate: ${new Date().toLocaleDateString()}`;

  // ── Try Meta Cloud API first (auto-sends PDF directly to customer) ─────────
  if (waPhone) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: waPhone,
          pdfBase64: base64,
          filename,
          caption: waMsg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { sent: true }; // fully automatic — PDF delivered to customer
      }
      // If API not configured yet (500), fall through to wa.me link
      if (res.status !== 500) {
        throw new Error(data.error || 'WhatsApp send failed');
      }
    } catch (apiErr) {
      // Only fall through if it's a "not configured" error, otherwise re-throw
      if (!apiErr.message?.includes('not configured')) throw apiErr;
    }
  }

  // ── Fallback: native share sheet (no phone) ────────────────────────────────
  if (!waPhone && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title,
        text: message || `${title} - ${new Date().toLocaleDateString()}`,
      });
      return;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return;
    }
  }

  // ── Last resort: download PDF + open wa.me link ────────────────────────────
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
  window.open(waUrl, '_blank');

  return { downloaded: true };
}

/** Official WhatsApp logo SVG path — used for the share button icon */
export const WHATSAPP_SVG_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';
