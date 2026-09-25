import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { StockService } from './stock.service';
import { pushService } from './push.service';

const stockService = new StockService();

type CreateSaleInput = {
  storeId: string;
  customerId?: string;
  paymentMethod: string;
  globalDiscount: string;
  amountPaid: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: string; discount: string }>;
};

type ListOpts = { page: number; perPage: number; storeId?: string; from?: string; to?: string };

async function generateReceiptNumber(tenantId: string): Promise<string> {
  const count = await prisma.sale.count({ where: { tenantId } });
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `REC-${dateStr}-${String(count + 1).padStart(5, '0')}`;
}

export class SaleService {
  async list(tenantId: string, opts: ListOpts) {
    const where: Prisma.SaleWhereInput = {
      tenantId,
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(opts.from || opts.to
        ? {
            createdAt: {
              ...(opts.from && { gte: new Date(opts.from) }),
              ...(opts.to && { lte: new Date(opts.to + 'T23:59:59') }),
            },
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          cashier: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true, unit: true } } } },
        },
      }),
      prisma.sale.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: opts.page,
        perPage: opts.perPage,
        total,
        totalPages: Math.ceil(total / opts.perPage),
      },
    };
  }

  async create(tenantId: string, cashierId: string, input: CreateSaleInput) {
    // Calculer les totaux
    let subtotal = new Prisma.Decimal(0);
    const itemsData: Array<{
      productId: string;
      productName: string;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discount: Prisma.Decimal;
      total: Prisma.Decimal;
    }> = [];

    for (const item of input.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId, isActive: true },
      });
      if (!product) throw new AppError(`Produit introuvable : ${item.productId}`, 404);

      const qty = new Prisma.Decimal(item.quantity);
      const price = new Prisma.Decimal(item.unitPrice);
      const disc = new Prisma.Decimal(item.discount);
      const lineTotal = price.minus(disc).times(qty);
      subtotal = subtotal.plus(lineTotal);

      itemsData.push({
        productId: item.productId,
        productName: product.name,
        quantity: qty,
        unitPrice: price,
        discount: disc,
        total: lineTotal,
      });
    }

    const globalDiscount = new Prisma.Decimal(input.globalDiscount);
    const totalAmount = subtotal.minus(globalDiscount);
    const amountPaid = new Prisma.Decimal(input.amountPaid);
    const amountDue = totalAmount.minus(amountPaid);

    if (amountDue.lt(0)) throw new AppError('Le montant payé dépasse le total de la vente', 400);
    if (amountDue.gt(0) && input.paymentMethod !== 'CREDIT') {
      throw new AppError('Paiement incomplet — utilisez le mode "Crédit client"', 400);
    }

    const receiptNumber = await generateReceiptNumber(tenantId);

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          tenantId,
          storeId: input.storeId,
          cashierId,
          customerId: input.customerId,
          receiptNumber,
          status: amountDue.gt(0) ? 'PENDING_CREDIT' : 'COMPLETED',
          paymentMethod: input.paymentMethod as never,
          subtotal,
          globalDiscount,
          totalAmount,
          amountPaid,
          amountDue,
          notes: input.notes,
          items: { create: itemsData },
        },
        include: {
          items: true,
          cashier: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          store: { select: { name: true } },
        },
      });

      // Déduire le stock
      await stockService.deductSaleStock(
        tx,
        tenantId,
        input.storeId,
        cashierId,
        sale.id,
        itemsData.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );

      // Mettre à jour la créance client si crédit
      if (amountDue.gt(0) && input.customerId) {
        await tx.customer.update({
          where: { id: input.customerId },
          data: { creditBalance: { increment: amountDue } },
        });
      }

      return sale;
    });

    // Fire stock alerts asynchronously after transaction (non-blocking)
    setImmediate(async () => {
      try {
        for (const item of itemsData) {
          const entry = await prisma.stockEntry.findUnique({
            where: { productId_storeId: { productId: item.productId, storeId: input.storeId } },
            include: {
              product: { select: { name: true } },
              store: { select: { name: true } },
            },
          });
          if (entry && entry.quantity.lte(entry.alertThreshold)) {
            await pushService.sendStockAlert(
              tenantId,
              (entry.product as { name: string }).name,
              (entry.store as { name: string }).name,
              Number(entry.quantity)
            );
          }
        }
      } catch {
        /* silently ignore push errors */
      }
    });

    return result;
  }

  async getById(tenantId: string, id: string) {
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: { select: { name: true, unit: true, category: true } } } },
        cashier: { select: { name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        store: { select: { id: true, name: true, address: true, phone: true } },
        tenant: { select: { name: true } },
      },
    });
    if (!sale) throw new AppError('Vente introuvable', 404);
    return sale;
  }

  async getReceipt(tenantId: string, id: string) {
    return this.getById(tenantId, id);
  }

  async createReturn(
    tenantId: string,
    userId: string,
    saleId: string,
    input: { reason: string; items: Array<{ saleItemId: string; quantity: number }> }
  ) {
    const sale = await this.getById(tenantId, saleId);
    if (sale.status === 'CANCELLED' || sale.status === 'RETURNED') {
      throw new AppError('Cette vente ne peut pas être retournée', 400);
    }

    return prisma.$transaction(async (tx) => {
      let totalRefund = new Prisma.Decimal(0);

      for (const ret of input.items) {
        const saleItem = (
          sale.items as Array<{
            id: string;
            productId: string;
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discount: Prisma.Decimal;
          }>
        ).find((i) => i.id === ret.saleItemId);
        if (!saleItem) throw new AppError(`Article de vente introuvable : ${ret.saleItemId}`, 404);
        if (new Prisma.Decimal(ret.quantity).gt(saleItem.quantity)) {
          throw new AppError('Quantité retournée supérieure à la quantité vendue', 400);
        }

        const refundAmt = saleItem.unitPrice.minus(saleItem.discount).times(ret.quantity);
        totalRefund = totalRefund.plus(refundAmt);

        // Réintégrer dans le stock
        await tx.stockEntry.update({
          where: { productId_storeId: { productId: saleItem.productId, storeId: sale.storeId } },
          data: { quantity: { increment: ret.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: saleItem.productId,
            storeId: sale.storeId,
            type: 'IN',
            quantity: new Prisma.Decimal(ret.quantity),
            reason: `Retour vente ${sale.receiptNumber}`,
            referenceId: saleId,
            createdById: userId,
          },
        });
      }

      await tx.sale.update({ where: { id: saleId }, data: { status: 'RETURNED' } });

      return { saleId, totalRefund: totalRefund.toString(), reason: input.reason };
    });
  }
}
