import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateInput = {
  reference: string;
  name: string;
  categoryId?: string | null;
  description?: string;
  buyPrice: string;
  sellPrice: string;
  tva: number;
  unit: string;
  alertThreshold: number;
  barcode?: string;
};

type ListOptions = {
  page: number;
  perPage: number;
  categoryId?: string;
  storeId?: string;
  q?: string;
};

const CATEGORY_SELECT = { select: { id: true, name: true, color: true } } as const;

export class ProductService {
  // Vérifie que la catégorie appartient bien à la boutique du token
  private async assertCategory(tenantId: string, categoryId?: string | null) {
    if (!categoryId) return;
    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
    if (!category) throw new AppError('Catégorie introuvable', 404);
  }

  async list(tenantId: string, opts: ListOptions) {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      isActive: true,
      ...(opts.categoryId && { categoryId: opts.categoryId }),
      ...(opts.q && {
        OR: [
          { name: { contains: opts.q, mode: 'insensitive' as const } },
          { reference: { contains: opts.q, mode: 'insensitive' as const } },
          { barcode: { equals: opts.q } },
        ],
      }),
    };

    const [rawData, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { name: 'asc' },
        include: {
          category: CATEGORY_SELECT,
          ...(opts.storeId
            ? {
                stockEntries: {
                  where: { storeId: opts.storeId },
                  select: { quantity: true, alertThreshold: true },
                },
              }
            : {}),
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: rawData,
      meta: {
        page: opts.page,
        perPage: opts.perPage,
        total,
        totalPages: Math.ceil(total / opts.perPage),
      },
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
      include: {
        category: CATEGORY_SELECT,
        ...(storeId
          ? {
              stockEntries: {
                where: { storeId },
                select: { quantity: true, alertThreshold: true },
              },
            }
          : {}),
      },
    });
    return products;
  }

  async getById(tenantId: string, id: string, storeId?: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: CATEGORY_SELECT,
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
    await this.assertCategory(tenantId, input.categoryId);

    const stores = await prisma.store.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });

    return prisma.product.create({
      data: {
        tenantId,
        reference: input.reference,
        name: input.name,
        categoryId: input.categoryId ?? null,
        description: input.description,
        buyPrice: new Prisma.Decimal(input.buyPrice),
        sellPrice: new Prisma.Decimal(input.sellPrice),
        tva: new Prisma.Decimal(input.tva),
        unit: input.unit,
        barcode: input.barcode,
        // Le produit entre à 0 dans chaque magasin, avec son seuil d'alerte
        stockEntries: {
          create: stores.map((s) => ({
            tenantId,
            storeId: s.id,
            quantity: 0,
            alertThreshold: input.alertThreshold,
          })),
        },
      },
      include: { category: CATEGORY_SELECT },
    });
  }

  async update(tenantId: string, id: string, input: Partial<CreateInput> & { isActive?: boolean }) {
    await this.getById(tenantId, id);
    const data: Prisma.ProductUpdateInput = {};
    if (input.name) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId !== undefined) {
      await this.assertCategory(tenantId, input.categoryId);
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true };
    }
    if (input.buyPrice) data.buyPrice = new Prisma.Decimal(input.buyPrice);
    if (input.sellPrice) data.sellPrice = new Prisma.Decimal(input.sellPrice);
    if (input.tva !== undefined) data.tva = new Prisma.Decimal(input.tva);
    if (input.unit) data.unit = input.unit;
    if (input.barcode !== undefined) data.barcode = input.barcode;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    if (input.alertThreshold !== undefined) {
      await prisma.stockEntry.updateMany({
        where: { productId: id, tenantId },
        data: { alertThreshold: input.alertThreshold },
      });
    }

    return prisma.product.update({ where: { id }, data, include: { category: CATEGORY_SELECT } });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
