import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

function fmtCFA(val: unknown): string {
  const n = Number(val);
  if (isNaN(n)) return '0 F';
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function row(doc: any, label: string, value: string, bold = false): void {
  if (bold) doc.font('Helvetica-Bold');
  else doc.font('Helvetica');
  doc.fontSize(8);
  const y = doc.y;
  doc.text(label, 10, y, { width: 120, lineBreak: false });
  doc.text(value, 130, y, { width: 80, align: 'right' });
  doc.moveDown(0.25);
}

export class PdfService {
  async generateReceipt(tenantId: string, saleId: string): Promise<Buffer> {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        items: true,
        cashier: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        store: { select: { name: true, address: true, phone: true } },
        tenant: { select: { name: true, phone: true } },
      },
    });
    if (!sale) throw new AppError('Vente introuvable', 404);

    // Dynamic import to avoid TS issues with pdfkit's export= module
    const PDFDocument = (await import('pdfkit')).default as typeof import('pdfkit');

    return new Promise((resolve, reject) => {
      // Narrow thermal receipt (220pt ≈ 77mm, auto height)
      const doc = new PDFDocument({
        size: [220, 800],
        margins: { top: 8, bottom: 8, left: 10, right: 10 },
        autoFirstPage: true,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ───────────────────────────────────────────────
      doc.fontSize(13).font('Helvetica-Bold').text(sale.tenant.name, { align: 'center' });

      if (sale.store.address) {
        doc.fontSize(7).font('Helvetica').text(sale.store.address, { align: 'center' });
      }
      if (sale.store.phone) {
        doc.fontSize(7).text(`Tél: ${sale.store.phone}`, { align: 'center' });
      }

      doc.moveDown(0.4);
      doc.moveTo(10, doc.y).lineTo(210, doc.y).lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      // ── Sale info ────────────────────────────────────────────
      const dateStr = new Date(sale.createdAt).toLocaleString('fr-CI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.fontSize(8).font('Helvetica');
      doc.text(`Reçu N°: ${sale.receiptNumber}`, { lineBreak: true });
      doc.text(`Date: ${dateStr}`, { lineBreak: true });
      doc.text(`Caissier: ${sale.cashier.name}`, { lineBreak: true });
      if (sale.customer) {
        doc.text(`Client: ${sale.customer.name}`, { lineBreak: true });
        if (sale.customer.phone) {
          doc.text(`Tél client: ${sale.customer.phone}`, { lineBreak: true });
        }
      }
      doc.text(`Magasin: ${sale.store.name}`, { lineBreak: true });

      doc.moveDown(0.3);
      doc.moveTo(10, doc.y).lineTo(210, doc.y).lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      // ── Items ────────────────────────────────────────────────
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('ARTICLE', 10, doc.y, { width: 200 });
      doc.moveDown(0.15);
      doc
        .moveTo(10, doc.y)
        .lineTo(210, doc.y)
        .lineWidth(0.3)
        .dash(1, { space: 2 })
        .stroke()
        .undash();
      doc.moveDown(0.2);

      for (const item of sale.items) {
        // Product name (bold, full width)
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(item.productName, 10, doc.y, { width: 200, lineBreak: true });

        // Qty × price = total (indented)
        doc.fontSize(7).font('Helvetica');
        const detail = `  ${Number(item.quantity)} × ${fmtCFA(item.unitPrice)}`;
        const yLine = doc.y;
        doc.text(detail, 10, yLine, { width: 140, lineBreak: false });
        doc.text(fmtCFA(item.total), 130, yLine, { width: 80, align: 'right' });
        doc.moveDown(0.35);
      }

      doc.moveDown(0.1);
      doc.moveTo(10, doc.y).lineTo(210, doc.y).lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      // ── Totals ───────────────────────────────────────────────
      row(doc, 'Sous-total', fmtCFA(sale.subtotal));
      if (Number(sale.globalDiscount) > 0) {
        row(doc, 'Remise globale', `-${fmtCFA(sale.globalDiscount)}`);
      }
      doc.moveDown(0.1);
      row(doc, 'TOTAL TTC', fmtCFA(sale.totalAmount), true);
      doc.moveDown(0.1);
      row(doc, 'Montant payé', fmtCFA(sale.amountPaid));
      if (Number(sale.amountDue) > 0) {
        row(doc, 'Reste à payer', fmtCFA(sale.amountDue), true);
      }

      doc.moveDown(0.3);
      doc.moveTo(10, doc.y).lineTo(210, doc.y).lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      // ── Payment method ───────────────────────────────────────
      const payLabels: Record<string, string> = {
        CASH: 'Espèces',
        ORANGE_MONEY: 'Orange Money',
        WAVE: 'Wave',
        MTN_MONEY: 'MTN Money',
        VIREMENT: 'Virement bancaire',
        CREDIT: 'Crédit client',
      };
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`Mode: ${payLabels[sale.paymentMethod] ?? sale.paymentMethod}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text('Merci pour votre achat !', { align: 'center' });
      doc
        .fontSize(7)
        .font('Helvetica')
        .text("MatériauxPro — Abidjan, Côte d'Ivoire", { align: 'center' });

      doc.flushPages();
      doc.end();
    });
  }
}
