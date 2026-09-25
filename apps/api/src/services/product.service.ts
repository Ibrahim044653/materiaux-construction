import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateInput = {
  reference: string; name: string; category: string;
  description?: string; buyPrice: string; sellPrice: string;
  tva: number; unit: string; alertThreshold: number; barcode?: string;
};

type ListOptions = {
  page: number; perPage: number;
  category?: string; storeId?: string;
};

export class ProductService {
  async list(tenantId: string, opts: ListOptions) {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      isActive: true,
      ...(opts.category && { category: opts.category as never }),
    };

    const [rawData, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { name: 'asc' },
        include: opts.storeId
          ? { stockEntries: { where: { storeId: opts.storeId }, select: { quantity: true, alertThreshold: true } } }
          : undefined,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: rawData,
      meta: { page: opts.page, perPage: opts.perPage, total, totalPages: Math.ceil(total / opts.perPage) },
    };
  }

  async search(tenantId: string, q: string, storeId?: string) {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { reference: { contains: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
        ],
      },
      take: 20,
      include: storeId
        ? { stockEntries: { where: { storeId }, select: { quantity: true, alertThreshold: true } } }
        : undefined,
    });
    return products;
  }

  async getById(tenantId: string, id: string, storeId?: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        stockEntries: storeId ? { where: { storeId } } : true,
      },
    });
    if (!product) throw new AppError('Produit introuvable', 404);
    return product;
  }

  async create(tenantId: string, input: CreateInput) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_reference: { tenantId, reference: input.reference } },
    });
    if (existing) throw new AppError('Un produit avec cette référence existe déjà', 409);

    return prisma.product.create({
      data: {
        tenantId,
        reference: input.reference,
        name: input.name,
        category: input.category as never,
        description: input.description,
        buyPrice: new Prisma.Decimal(input.buyPrice),
        sellPrice: new Prisma.Decimal(input.sellPrice),
        tva: new Prisma.Decimal(input.tva),
        unit: input.unit,
        barcode: input.barcode,
      },
    });
  }

  async update(tenantId: string, id: string, input: Partial<CreateInput> & { isActive?: boolean }) {
    await this.getById(tenantId, id);
    const data: Prisma.ProductUpdateInput = {};
    if (input.name) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.category) data.category = input.category as never;
    if (input.buyPrice) data.buyPrice = new Prisma.Decimal(input.buyPrice);
    if (input.sellPrice) data.sellPrice = new Prisma.Decimal(input.sellPrice);
    if (input.tva !== undefined) data.tva = new Prisma.Decimal(input.tva);
    if (input.unit) data.unit = input.unit;
    if (input.barcode !== undefined) data.barcode = input.barcode;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return prisma.product.update({ where: { id }, data });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
