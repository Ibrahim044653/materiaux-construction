import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateInput = { name: string; color?: string; position?: number };
type UpdateInput = Partial<CreateInput> & { isActive?: boolean };

export class CategoryService {
  async list(tenantId: string, includeInactive = false) {
    return prisma.category.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      // Ne compter que les produits encore au catalogue : un produit retire
      // ne doit pas gonfler le compteur affiche au gestionnaire.
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
  }

  async getById(tenantId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, tenantId },
      // Ne compter que les produits encore au catalogue : un produit retire
      // ne doit pas gonfler le compteur affiche au gestionnaire.
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    if (!category) throw new AppError('Catégorie introuvable', 404);
    return category;
  }

  async create(tenantId: string, input: CreateInput) {
    try {
      return await prisma.category.create({
        data: { tenantId, name: input.name, color: input.color, position: input.position ?? 0 },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Une catégorie porte déjà ce nom', 409);
      }
      throw err;
    }
  }

  // Création en lot : sert aux jeux de catégories proposés au démarrage
  async createMany(tenantId: string, names: string[]) {
    const existing = await prisma.category.findMany({
      where: { tenantId },
      select: { name: true },
    });
    const taken = new Set(existing.map((c) => c.name.toLowerCase()));

    const toCreate: { tenantId: string; name: string; position: number }[] = [];
    for (const raw of names) {
      const name = raw.trim();
      if (!name || taken.has(name.toLowerCase())) continue;
      taken.add(name.toLowerCase());
      toCreate.push({ tenantId, name, position: existing.length + toCreate.length });
    }

    if (toCreate.length > 0) {
      await prisma.category.createMany({ data: toCreate, skipDuplicates: true });
    }
    return this.list(tenantId);
  }

  async update(tenantId: string, id: string, input: UpdateInput) {
    await this.getById(tenantId, id);
    try {
      return await prisma.category.update({ where: { id }, data: input });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError('Une catégorie porte déjà ce nom', 409);
      }
      throw err;
    }
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    // Seuls les produits encore au catalogue bloquent la suppression : les
    // produits retires (isActive = false) rendraient la categorie
    // definitivement indestructible.
    const utilises = await prisma.product.count({
      where: { tenantId, categoryId: id, isActive: true },
    });
    if (utilises > 0) {
      throw new AppError(
        `Impossible de supprimer : ${utilises} produit(s) utilisent cette catégorie`,
        409
      );
    }
    return prisma.category.delete({ where: { id } });
  }
}
