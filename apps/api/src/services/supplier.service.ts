import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { StockService } from './stock.service';

const stockService = new StockService();

type CreateSupplierInput = { name: string; phone?: string; email?: string; address?: string; contactName?: string };
type CreateOrderInput = {
  supplierId: string; storeId: string; notes?: string; expectedAt?: string;
  items: Array<{ productId: string; quantityOrdered: number; unitPrice: string }>;
};
type OrderListOpts = { page: number; perPage: number; storeId?: string; supplierId?: string };

async function generateOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.purchaseOrder.count({ where: { tenantId } });
  const date = new Date();
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `BC-${yr}${mo}-${String(count + 1).padStart(4, '0')}`;
}

export class SupplierService {
  async list(tenantId: string, page: number, perPage: number) {
    const [data, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where: { tenantId },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchaseOrders: true } } },
      }),
      prisma.supplier.count({ where: { tenantId } }),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async create(tenantId: string, input: CreateSupplierInput) {
    return prisma.supplier.create({ data: { tenantId, ...input } });
  }

  async getById(tenantId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!supplier) throw new AppError('Fournisseur introuvable', 404);
    return supplier;
  }

  async update(tenantId: string, id: string, input: Partial<CreateSupplierInput>) {
    await this.getById(tenantId, id);
    return prisma.supplier.update({ where: { id }, data: input });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    const ordersCount = await prisma.purchaseOrder.count({ where: { supplierId: id, status: { notIn: ['CANCELLED'] } } });
    if (ordersCount > 0) throw new AppError('Impossible de supprimer un fournisseur avec des commandes actives', 409);
    return prisma.supplier.delete({ where: { id } });
  }

  async listOrders(tenantId: string, opts: OrderListOpts) {
    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
      ...(opts.storeId && { storeId: opts.storeId }),
      ...(opts.supplierId && { supplierId: opts.supplierId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          store: { select: { name: true } },
          items: { include: { product: { select: { name: true, unit: true } } } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { data, meta: { page: opts.page, perPage: opts.perPage, total, totalPages: Math.ceil(total / opts.perPage) } };
  }

  async createOrder(tenantId: string, input: CreateOrderInput) {
    await this.getById(tenantId, input.supplierId);

    let totalAmount = new Prisma.Decimal(0);
    const itemsData: Array<{
      productId: string; productName: string;
      quantityOrdered: Prisma.Decimal; quantityReceived: Prisma.Decimal;
      unitPrice: Prisma.Decimal; total: Prisma.Decimal;
    }> = [];

    for (const item of input.items) {
      const product = await prisma.product.findFirst({ where: { id: item.productId, tenantId } });
      if (!product) throw new AppError(`Produit introuvable : ${item.productId}`, 404);
      const qty = new Prisma.Decimal(item.quantityOrdered);
      const price = new Prisma.Decimal(item.unitPrice);
      const lineTotal = qty.times(price);
      totalAmount = totalAmount.plus(lineTotal);
      itemsData.push({ productId: item.productId, productName: product.name, quantityOrdered: qty, quantityReceived: new Prisma.Decimal(0), unitPrice: price, total: lineTotal });
    }

    const orderNumber = await generateOrderNumber(tenantId);

    return prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: input.supplierId,
        storeId: input.storeId,
        orderNumber,
        status: 'DRAFT',
        totalAmount,
        notes: input.notes,
        expectedAt: input.expectedAt ? new Date(input.expectedAt) : undefined,
        items: { create: itemsData },
      },
      include: { items: true, supplier: { select: { name: true } }, store: { select: { name: true } } },
    });
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: { include: { product: { select: { name: true, unit: true, reference: true } } } },
        supplier: true,
        store: { select: { id: true, name: true } },
      },
    });
    if (!order) throw new AppError('Bon de commande introuvable', 404);
    return order;
  }

  async setOrderStatus(tenantId: string, orderId: string, status: 'SENT' | 'CANCELLED') {
    const order = await this.getOrder(tenantId, orderId);
    if (order.status === 'RECEIVED') throw new AppError('Commande déjà reçue, modification impossible', 400);
    if (order.status === 'CANCELLED') throw new AppError('Commande annulée', 400);
    return prisma.purchaseOrder.update({ where: { id: orderId }, data: { status } });
  }

  async receiveOrder(
    tenantId: string,
    userId: string,
    orderId: string,
    items: Array<{ orderItemId: string; quantityReceived: number }>
  ) {
    const order = await this.getOrder(tenantId, orderId);
    if (order.status === 'CANCELLED') throw new AppError('Commande annulée', 400);
    if (order.status === 'RECEIVED') throw new AppError('Commande déjà entièrement reçue', 400);

    return prisma.$transaction(async (tx) => {
      const stockItems: Array<{ productId: string; quantity: Prisma.Decimal }> = [];

      for (const received of items) {
        const orderItem = (order.items as Array<{ id: string; productId: string; quantityOrdered: Prisma.Decimal; quantityReceived: Prisma.Decimal }>)
          .find((i) => i.id === received.orderItemId);
        if (!orderItem) throw new AppError(`Article de commande introuvable : ${received.orderItemId}`, 404);

        const qtyReceived = new Prisma.Decimal(received.quantityReceived);
        const newReceived = orderItem.quantityReceived.plus(qtyReceived);

        if (newReceived.gt(orderItem.quantityOrdered)) {
          throw new AppError('Quantité reçue supérieure à la quantité commandée', 400);
        }

        await tx.purchaseOrderItem.update({
          where: { id: received.orderItemId },
          data: { quantityReceived: newReceived },
        });

        if (qtyReceived.gt(0)) {
          stockItems.push({ productId: orderItem.productId, quantity: qtyReceived });
        }
      }

      // Mettre à jour le stock
      if (stockItems.length > 0) {
        await stockService.addPurchaseStock(tx, tenantId, order.storeId, userId, orderId, stockItems);
      }

      // Déterminer le nouveau statut
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { orderId } });
      const allReceived = updatedItems.every((i) => i.quantityReceived.gte(i.quantityOrdered));
      const anyReceived = updatedItems.some((i) => i.quantityReceived.gt(0));
      const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : order.status;

      return tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: newStatus, ...(allReceived && { receivedAt: new Date() }) },
      });
    });
  }
}
