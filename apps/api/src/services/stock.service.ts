import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type AdjustInput = { productId: string; storeId: string; quantity: number; reason: string };
type TransferInput = {
  fromStoreId: string; toStoreId: string; notes?: string;
  items: Array<{ productId: string; quantity: number }>;
};
type MovementsOpts = { page: number; perPage: number; storeId?: string; productId?: string };

export class StockService {
  async listEntries(tenantId: string, storeId?: string) {
    return prisma.stockEntry.findMany({
      where: { tenantId, ...(storeId && { storeId }) },
      include: {
        product: { select: { id: true, name: true, reference: true, category: true, unit: true, isActive: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async getAlerts(tenantId: string, storeId?: string) {
    // Produits dont la quantité est en dessous du seuil d'alerte
    const entries = await prisma.stockEntry.findMany({
      where: { tenantId, ...(storeId && { storeId }) },
      include: { product: { select: { id: true, name: true, reference: true, category: true, unit: true } }, store: { select: { id: true, name: true } } },
    });
    return entries.filter((e) => e.quantity.lte(e.alertThreshold));
  }

  async listMovements(tenantId: string, opts: MovementsOpts) {
    const where: Prisma.StockMovementWhereInput = {
      tenantId,
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(opts.productId && { productId: opts.productId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, reference: true, unit: true } },
          store: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { data, meta: { page: opts.page, perPage: opts.perPage, total, totalPages: Math.ceil(total / opts.perPage) } };
  }

  async createAdjustment(tenantId: string, userId: string, input: AdjustInput) {
    const entry = await prisma.stockEntry.findUnique({
      where: { productId_storeId: { productId: input.productId, storeId: input.storeId } },
    });

    const currentQty = entry?.quantity ?? new Prisma.Decimal(0);
    const newQty = currentQty.plus(input.quantity);
    if (newQty.lt(0)) throw new AppError('Stock insuffisant pour cet ajustement', 400);

    return prisma.$transaction(async (tx) => {
      await tx.stockEntry.upsert({
        where: { productId_storeId: { productId: input.productId, storeId: input.storeId } },
        create: { tenantId, productId: input.productId, storeId: input.storeId, quantity: newQty, alertThreshold: 5 },
        update: { quantity: newQty },
      });

      return tx.stockMovement.create({
        data: {
          tenantId,
          productId: input.productId,
          storeId: input.storeId,
          type: 'ADJUSTMENT',
          quantity: new Prisma.Decimal(input.quantity),
          reason: input.reason,
          createdById: userId,
        },
      });
    });
  }

  async listTransfers(tenantId: string, page: number, perPage: number) {
    const [data, total] = await prisma.$transaction([
      prisma.storeTransfer.findMany({
        where: { tenantId },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          fromStore: { select: { name: true } },
          toStore: { select: { name: true } },
          items: { include: { product: { select: { name: true, unit: true } } } },
        },
      }),
      prisma.storeTransfer.count({ where: { tenantId } }),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async createTransfer(tenantId: string, userId: string, input: TransferInput) {
    if (input.fromStoreId === input.toStoreId) {
      throw new AppError('Les magasins source et destination doivent être différents', 400);
    }

    // Vérifier le stock disponible pour chaque article
    for (const item of input.items) {
      const entry = await prisma.stockEntry.findUnique({
        where: { productId_storeId: { productId: item.productId, storeId: input.fromStoreId } },
      });
      const available = entry?.quantity ?? new Prisma.Decimal(0);
      if (available.lt(item.quantity)) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        throw new AppError(`Stock insuffisant pour ${product?.name ?? item.productId}`, 400);
      }
    }

    return prisma.storeTransfer.create({
      data: {
        tenantId,
        fromStoreId: input.fromStoreId,
        toStoreId: input.toStoreId,
        notes: input.notes,
        createdById: userId,
        status: 'PENDING',
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: new Prisma.Decimal(i.quantity),
          })),
        },
      },
      include: { items: { include: { product: { select: { name: true, unit: true } } } } },
    });
  }

  async validateTransfer(tenantId: string, userId: string, transferId: string) {
    const transfer = await prisma.storeTransfer.findFirst({
      where: { id: transferId, tenantId, status: 'PENDING' },
      include: { items: true },
    });
    if (!transfer) throw new AppError('Transfert introuvable ou déjà traité', 404);

    return prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // Déduire du stock source
        await tx.stockEntry.update({
          where: { productId_storeId: { productId: item.productId, storeId: transfer.fromStoreId } },
          data: { quantity: { decrement: item.quantity } },
        });

        // Ajouter au stock destination
        await tx.stockEntry.upsert({
          where: { productId_storeId: { productId: item.productId, storeId: transfer.toStoreId } },
          create: { tenantId, productId: item.productId, storeId: transfer.toStoreId, quantity: item.quantity, alertThreshold: 5 },
          update: { quantity: { increment: item.quantity } },
        });

        // Mouvement sortie
        await tx.stockMovement.create({
          data: { tenantId, productId: item.productId, storeId: transfer.fromStoreId, type: 'TRANSFER_OUT', quantity: item.quantity, referenceId: transferId, createdById: userId },
        });

        // Mouvement entrée
        await tx.stockMovement.create({
          data: { tenantId, productId: item.productId, storeId: transfer.toStoreId, type: 'TRANSFER_IN', quantity: item.quantity, referenceId: transferId, createdById: userId },
        });
      }

      return tx.storeTransfer.update({
        where: { id: transferId },
        data: { status: 'VALIDATED', validatedAt: new Date() },
      });
    });
  }

  async cancelTransfer(tenantId: string, transferId: string) {
    const transfer = await prisma.storeTransfer.findFirst({
      where: { id: transferId, tenantId, status: 'PENDING' },
    });
    if (!transfer) throw new AppError('Transfert introuvable ou déjà traité', 404);
    return prisma.storeTransfer.update({ where: { id: transferId }, data: { status: 'CANCELLED' } });
  }

  // Utilisé par SaleService pour déduire le stock lors d'une vente
  async deductSaleStock(
    tx: Prisma.TransactionClient,
    tenantId: string,
    storeId: string,
    userId: string,
    saleId: string,
    items: Array<{ productId: string; quantity: Prisma.Decimal }>
  ) {
    for (const item of items) {
      const entry = await tx.stockEntry.findUnique({
        where: { productId_storeId: { productId: item.productId, storeId } },
      });
      const available = entry?.quantity ?? new Prisma.Decimal(0);
      if (available.lt(item.quantity)) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        throw new AppError(`Stock insuffisant pour ${product?.name ?? item.productId}`, 400);
      }

      await tx.stockEntry.update({
        where: { productId_storeId: { productId: item.productId, storeId } },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: { tenantId, productId: item.productId, storeId, type: 'OUT', quantity: item.quantity, referenceId: saleId, createdById: userId },
      });
    }
  }

  // Utilisé par PurchaseOrderService lors de la réception
  async addPurchaseStock(
    tx: Prisma.TransactionClient,
    tenantId: string,
    storeId: string,
    userId: string,
    orderId: string,
    items: Array<{ productId: string; quantity: Prisma.Decimal }>
  ) {
    for (const item of items) {
      await tx.stockEntry.upsert({
        where: { productId_storeId: { productId: item.productId, storeId } },
        create: { tenantId, productId: item.productId, storeId, quantity: item.quantity, alertThreshold: 5 },
        update: { quantity: { increment: item.quantity } },
      });

      await tx.stockMovement.create({
        data: { tenantId, productId: item.productId, storeId, type: 'IN', quantity: item.quantity, referenceId: orderId, createdById: userId },
      });
    }
  }
}
