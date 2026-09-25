import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

type Period = '7d' | '30d' | '12m';

function getDateRange(period: Period): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (period === '7d') from.setDate(from.getDate() - 7);
  else if (period === '30d') from.setDate(from.getDate() - 30);
  else from.setMonth(from.getMonth() - 12);
  return { from, to };
}

export class DashboardService {
  async getKpis(tenantId: string, storeId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const saleWhere: Prisma.SaleWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      ...(storeId && { storeId }),
    };

    const [
      todaySales,
      todaySalesCount,
      totalDebt,
      criticalStockCount,
      pendingTransfers,
    ] = await Promise.all([
      // CA du jour
      prisma.sale.aggregate({
        where: { ...saleWhere, createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
      }),
      // Nombre de ventes du jour
      prisma.sale.count({
        where: { ...saleWhere, createdAt: { gte: today, lt: tomorrow } },
      }),
      // Total des créances clients
      prisma.customer.aggregate({
        where: { tenantId },
        _sum: { creditBalance: true },
      }),
      // Produits en stock critique
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM stock_entries
        WHERE "tenantId" = ${tenantId}
        ${storeId ? Prisma.sql`AND "storeId" = ${storeId}` : Prisma.empty}
        AND quantity <= "alertThreshold"
      `,
      // Transferts en attente
      prisma.storeTransfer.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return {
      caJour: todaySales._sum.totalAmount?.toString() ?? '0',
      ventesJour: todaySalesCount,
      creancesTotal: totalDebt._sum.creditBalance?.toString() ?? '0',
      stockCritiqueCount: Number(criticalStockCount[0]?.count ?? 0),
      transfertsEnAttente: pendingTransfers,
    };
  }

  async getSalesChart(tenantId: string, period: Period, storeId?: string) {
    const { from, to } = getDateRange(period);
    const saleWhere: Prisma.SaleWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'RETURNED'] },
      createdAt: { gte: from, lte: to },
      ...(storeId && { storeId }),
    };

    const sales = await prisma.sale.findMany({
      where: saleWhere,
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Grouper par jour ou mois
    const grouped: Record<string, number> = {};
    for (const sale of sales) {
      const key =
        period === '12m'
          ? `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, '0')}`
          : sale.createdAt.toISOString().slice(0, 10);
      grouped[key] = (grouped[key] ?? 0) + Number(sale.totalAmount);
    }

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }

  async getTopProducts(tenantId: string, storeId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          status: { notIn: ['CANCELLED', 'RETURNED'] },
          createdAt: { gte: thirtyDaysAgo },
          ...(storeId && { storeId }),
        },
      },
      include: { product: { select: { name: true, category: true, unit: true } } },
    });

    // Agréger par produit
    const agg: Record<string, { name: string; category: string; unit: string; totalQty: number; totalRevenue: number }> = {};
    for (const item of items) {
      const id = item.productId;
      if (!agg[id]) {
        agg[id] = { name: item.product.name, category: item.product.category, unit: item.product.unit, totalQty: 0, totalRevenue: 0 };
      }
      agg[id].totalQty += Number(item.quantity);
      agg[id].totalRevenue += Number(item.total);
    }

    return Object.entries(agg)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  async getAlerts(tenantId: string, storeId?: string) {
    const [stockAlerts, unpaidSales, pendingOrders] = await Promise.all([
      // Stock critique
      prisma.stockEntry.findMany({
        where: {
          tenantId,
          ...(storeId && { storeId }),
        },
        include: { product: { select: { name: true, reference: true, unit: true } }, store: { select: { name: true } } },
      }).then((entries) => entries.filter((e) => e.quantity.lte(e.alertThreshold))),
      // Ventes impayées (crédit client)
      prisma.sale.count({ where: { tenantId, status: 'PENDING_CREDIT', ...(storeId && { storeId }) } }),
      // Commandes fournisseurs en attente
      prisma.purchaseOrder.count({ where: { tenantId, status: { in: ['DRAFT', 'SENT'] } } }),
    ]);

    return {
      stockCritique: stockAlerts,
      ventesImpayees: unpaidSales,
      commandesFournisseurs: pendingOrders,
    };
  }
}
