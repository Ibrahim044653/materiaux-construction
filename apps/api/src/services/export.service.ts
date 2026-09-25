import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';

function fmtCFA(val: unknown): number {
  return Math.round(Number(val) || 0);
}

function headerStyle(worksheet: ExcelJS.Worksheet): void {
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };
  });
}

export class ExportService {
  async exportSales(
    tenantId: string,
    opts: {
      storeId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<Buffer> {
    const where = {
      tenantId,
      ...(opts.storeId && { storeId: opts.storeId }),
      ...((opts.startDate || opts.endDate) && {
        createdAt: {
          ...(opts.startDate && { gte: new Date(opts.startDate) }),
          ...(opts.endDate && { lte: new Date(opts.endDate + 'T23:59:59') }),
        },
      }),
    };

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        store: { select: { name: true } },
        items: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MatériauxPro';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Ventes');
    ws.columns = [
      { header: 'N° Reçu', key: 'receiptNumber', width: 22 },
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Magasin', key: 'store', width: 20 },
      { header: 'Caissier', key: 'cashier', width: 20 },
      { header: 'Client', key: 'customer', width: 20 },
      { header: 'Nb articles', key: 'itemCount', width: 12 },
      { header: 'Sous-total (F)', key: 'subtotal', width: 16 },
      { header: 'Remise (F)', key: 'discount', width: 14 },
      { header: 'Total TTC (F)', key: 'total', width: 16 },
      { header: 'Payé (F)', key: 'paid', width: 14 },
      { header: 'Crédit (F)', key: 'credit', width: 14 },
      { header: 'Paiement', key: 'payment', width: 16 },
      { header: 'Statut', key: 'status', width: 14 },
    ];
    headerStyle(ws);

    const payLabels: Record<string, string> = {
      CASH: 'Espèces',
      ORANGE_MONEY: 'Orange Money',
      WAVE: 'Wave',
      MTN_MONEY: 'MTN Money',
      VIREMENT: 'Virement',
      CREDIT: 'Crédit',
    };
    const statusLabels: Record<string, string> = {
      COMPLETED: 'Complété',
      PENDING_CREDIT: 'Crédit en cours',
      CANCELLED: 'Annulé',
      RETURNED: 'Retourné',
    };

    for (const s of sales) {
      ws.addRow({
        receiptNumber: s.receiptNumber,
        date: new Date(s.createdAt).toLocaleString('fr-CI'),
        store: (s.store as { name: string }).name,
        cashier: (s.cashier as { name: string }).name,
        customer: (s.customer as { name: string } | null)?.name ?? '',
        itemCount: s.items.length,
        subtotal: fmtCFA(s.subtotal),
        discount: fmtCFA(s.globalDiscount),
        total: fmtCFA(s.totalAmount),
        paid: fmtCFA(s.amountPaid),
        credit: fmtCFA(s.amountDue),
        payment: payLabels[s.paymentMethod] ?? s.paymentMethod,
        status: statusLabels[s.status] ?? s.status,
      });
    }

    // Number format for FCFA columns
    ['subtotal', 'discount', 'total', 'paid', 'credit'].forEach((key) => {
      const col = ws.getColumn(key);
      col.numFmt = '#,##0';
      col.alignment = { horizontal: 'right' };
    });

    ws.autoFilter = { from: 'A1', to: `M1` };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportStock(tenantId: string, opts: { storeId?: string }): Promise<Buffer> {
    const entries = await prisma.stockEntry.findMany({
      where: {
        tenantId,
        ...(opts.storeId && { storeId: opts.storeId }),
      },
      include: {
        product: {
          select: {
            name: true,
            reference: true,
            category: true,
            buyPrice: true,
            sellPrice: true,
            unit: true,
          },
        },
        store: { select: { name: true } },
      },
      orderBy: [{ product: { category: 'asc' } }, { product: { name: 'asc' } }],
      take: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MatériauxPro';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Stock');
    ws.columns = [
      { header: 'Référence', key: 'ref', width: 16 },
      { header: 'Produit', key: 'name', width: 30 },
      { header: 'Catégorie', key: 'cat', width: 16 },
      { header: 'Magasin', key: 'store', width: 20 },
      { header: 'Unité', key: 'unit', width: 10 },
      { header: 'Quantité', key: 'qty', width: 12 },
      { header: 'Seuil alerte', key: 'threshold', width: 14 },
      { header: 'Prix achat (F)', key: 'buyPrice', width: 16 },
      { header: 'Prix vente (F)', key: 'sellPrice', width: 16 },
      { header: 'Valeur stock (F)', key: 'value', width: 18 },
      { header: 'En alerte', key: 'alert', width: 10 },
    ];
    headerStyle(ws);

    for (const e of entries) {
      const qty = Number(e.quantity);
      const buyPrice = Number(e.product.buyPrice);
      const stockValue = Math.round(qty * buyPrice);
      const isAlert = qty <= Number(e.alertThreshold);

      const rowData = ws.addRow({
        ref: e.product.reference,
        name: e.product.name,
        cat: e.product.category,
        store: (e.store as { name: string }).name,
        unit: e.product.unit,
        qty,
        threshold: Number(e.alertThreshold),
        buyPrice: fmtCFA(e.product.buyPrice),
        sellPrice: fmtCFA(e.product.sellPrice),
        value: stockValue,
        alert: isAlert ? 'OUI' : '',
      });

      if (isAlert) {
        rowData.getCell('alert').font = { color: { argb: 'FFDC2626' }, bold: true };
        rowData.getCell('qty').font = { color: { argb: 'FFDC2626' } };
      }
    }

    ['buyPrice', 'sellPrice', 'value'].forEach((key) => {
      ws.getColumn(key).numFmt = '#,##0';
      ws.getColumn(key).alignment = { horizontal: 'right' };
    });
    ws.getColumn('qty').alignment = { horizontal: 'center' };
    ws.getColumn('threshold').alignment = { horizontal: 'center' };

    ws.autoFilter = { from: 'A1', to: 'K1' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportCustomers(tenantId: string): Promise<Buffer> {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { creditBalance: 'desc' },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, totalAmount: true },
        },
        _count: { select: { sales: true } },
      },
      take: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MatériauxPro';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Créances Clients');
    ws.columns = [
      { header: 'Nom', key: 'name', width: 25 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Créance (F)', key: 'credit', width: 16 },
      { header: 'Nb achats', key: 'salesCount', width: 12 },
      { header: 'Dernier achat', key: 'lastSale', width: 20 },
      { header: 'Montant dernier', key: 'lastAmount', width: 18 },
      { header: 'Statut', key: 'status', width: 14 },
    ];
    headerStyle(ws);

    for (const c of customers) {
      const lastSale = (c.sales as Array<{ createdAt: Date; totalAmount: unknown }>)[0];
      const creditVal = fmtCFA(c.creditBalance);
      const row = ws.addRow({
        name: c.name,
        phone: c.phone ?? '',
        email: c.email ?? '',
        address: c.address ?? '',
        credit: creditVal,
        salesCount: (c._count as { sales: number }).sales,
        lastSale: lastSale ? new Date(lastSale.createdAt).toLocaleDateString('fr-CI') : '',
        lastAmount: lastSale ? fmtCFA(lastSale.totalAmount) : '',
        status: creditVal > 0 ? 'En dette' : 'À jour',
      });

      if (creditVal > 0) {
        row.getCell('credit').font = { color: { argb: 'FFDC2626' }, bold: true };
        row.getCell('status').font = { color: { argb: 'FFDC2626' } };
      } else {
        row.getCell('status').font = { color: { argb: 'FF16A34A' } };
      }
    }

    ws.getColumn('credit').numFmt = '#,##0';
    ws.getColumn('credit').alignment = { horizontal: 'right' };
    ws.getColumn('lastAmount').numFmt = '#,##0';
    ws.getColumn('lastAmount').alignment = { horizontal: 'right' };

    ws.autoFilter = { from: 'A1', to: 'I1' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
