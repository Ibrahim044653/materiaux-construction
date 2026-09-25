import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

type DateRange = { storeId?: string; from?: string; to?: string };
type SalesOpts = DateRange & { groupBy: 'day' | 'week' | 'month' };

function buildDateFilter(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to + 'T23:59:59') }),
  };
}

export class ReportService {
  async salesReport(tenantId: string, opts: SalesOpts) {
    const dateFilter = buildDateFilter(opts.from, opts.to);
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const [sales, summary] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, receiptNumber: true, createdAt: true,
          totalAmount: true, amountPaid: true, amountDue: true,
          paymentMethod: true,
          cashier: { select: { name: true } },
          store: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.sale.aggregate({
        where,
        _sum: { totalAmount: true, amountPaid: true, amountDue: true },
        _count: true,
      }),
    ]);

    // Grouper par période
    const grouped: Record<string, { date: string; count: number; totalAmount: number; amountPaid: number }> = {};
    for (const sale of sales) {
      let key: string;
      if (opts.groupBy === 'month') {
        key = sale.createdAt.toISOString().slice(0, 7);
      } else if (opts.groupBy === 'week') {
        const d = new Date(sale.createdAt);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().slice(0, 10);
      } else {
        key = sale.createdAt.toISOString().slice(0, 10);
      }
      if (!grouped[key]) grouped[key] = { date: key, count: 0, totalAmount: 0, amountPaid: 0 };
      grouped[key].count++;
      grouped[key].totalAmount += Number(sale.totalAmount);
      grouped[key].amountPaid += Number(sale.amountPaid);
    }

    return {
      summary: {
        count: summary._count,
        totalAmount: summary._sum.totalAmount?.toString() ?? '0',
        amountPaid: summary._sum.amountPaid?.toString() ?? '0',
        amountDue: summary._sum.amountDue?.toString() ?? '0',
      },
      byPeriod: Object.values(grouped),
      byPaymentMethod: await this.salesByPaymentMethod(tenantId, opts),
      sales,
    };
  }

  private async salesByPaymentMethod(tenantId: string, opts: DateRange) {
    const dateFilter = buildDateFilter(opts.from, opts.to);
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(dateFilter && { createdAt: dateFilter }),
    };
    const result = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { totalAmount: true },
      _count: true,
    });
    return result.map((r) => ({
      method: r.paymentMethod,
      count: r._count,
      total: r._sum.totalAmount?.toString() ?? '0',
    }));
  }

  async stockReport(tenantId: string, storeId?: string) {
    const entries = await prisma.stockEntry.findMany({
      where: { tenantId, ...(storeId && { storeId }) },
      include: {
        product: { select: { name: true, reference: true, category: true, buyPrice: true, sellPrice: true, unit: true, isActive: true } },
        store: { select: { name: true } },
      },
      orderBy: { product: { category: 'asc' } },
    });

    let totalValueBuy = new Prisma.Decimal(0);
    let totalValueSell = new Prisma.Decimal(0);
    const slowMoving: typeof entries = [];

    for (const entry of entries) {
      totalValueBuy = totalValueBuy.plus(entry.quantity.times(entry.product.buyPrice));
      totalValueSell = totalValueSell.plus(entry.quantity.times(entry.product.sellPrice));
    }

    // Produits à rotation lente (aucun mouvement en 30j)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeProductIds = await prisma.saleItem.findMany({
      where: { sale: { tenantId, createdAt: { gte: thirtyDaysAgo } } },
      select: { productId: true },
      distinct: ['productId'],
    }).then((r) => new Set(r.map((i) => i.productId)));

    for (const entry of entries) {
      if (!activeProductIds.has(entry.productId) && entry.quantity.gt(0)) {
        slowMoving.push(entry);
      }
    }

    return {
      entries,
      totalValueBuy: totalValueBuy.toString(),
      totalValueSell: totalValueSell.toString(),
      slowMovingCount: slowMoving.length,
      slowMoving: slowMoving.slice(0, 20),
      criticalStock: entries.filter((e) => e.quantity.lte(e.alertThreshold)),
    };
  }

  async treasuryReport(tenantId: string, opts: DateRange) {
    const dateFilter = buildDateFilter(opts.from, opts.to);
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const [salesAgg, customerPayments, purchaseOrders] = await Promise.all([
      prisma.sale.aggregate({ where, _sum: { amountPaid: true, totalAmount: true } }),
      prisma.customerPayment.aggregate({
        where: { tenantId, ...(dateFilter && { createdAt: dateFilter }) },
        _sum: { amount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId,
          status: 'RECEIVED',
          ...(opts.storeId && { storeId: opts.storeId }),
          ...(dateFilter && { receivedAt: buildDateFilter(opts.from, opts.to) }),
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const recettes = new Prisma.Decimal(salesAgg._sum.amountPaid?.toString() ?? '0')
      .plus(customerPayments._sum.amount?.toString() ?? '0');
    const depenses = new Prisma.Decimal(purchaseOrders._sum.totalAmount?.toString() ?? '0');

    return {
      recettes: recettes.toString(),
      depenses: depenses.toString(),
      solde: recettes.minus(depenses).toString(),
      creancesRecouvertes: customerPayments._sum.amount?.toString() ?? '0',
      caTotal: salesAgg._sum.totalAmount?.toString() ?? '0',
    };
  }

  async customersDebtReport(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, creditBalance: { gt: 0 } },
      orderBy: { creditBalance: 'desc' },
      include: {
        sales: {
          where: { status: 'PENDING_CREDIT' },
          select: { receiptNumber: true, amountDue: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    const totalDebt = customers.reduce((acc, c) => acc.plus(c.creditBalance), new Prisma.Decimal(0));

    return { customers, totalDebt: totalDebt.toString() };
  }
}
