import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateInput = { name: string; address?: string; phone?: string };
type UpdateInput = Partial<CreateInput> & { isActive?: boolean };

export class StoreService {
  async list(tenantId: string) {
    return prisma.store.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async create(tenantId: string, input: CreateInput) {
    return prisma.store.create({ data: { tenantId, ...input } });
  }

  async getById(tenantId: string, id: string) {
    const store = await prisma.store.findFirst({
      where: { id, tenantId },
      include: {
        users: { select: { id: true, name: true, role: true, isActive: true } },
        _count: { select: { sales: true } },
      },
    });
    if (!store) throw new AppError('Magasin introuvable', 404);
    return store;
  }

  async update(tenantId: string, id: string, input: UpdateInput) {
    await this.getById(tenantId, id);
    return prisma.store.update({ where: { id }, data: input });
  }

  async delete(tenantId: string, id: string) {
    const store = await this.getById(tenantId, id);
    const salesCount = await prisma.sale.count({ where: { storeId: id } });
    if (salesCount > 0) throw new AppError('Impossible de supprimer un magasin avec des ventes', 409);
    return prisma.store.update({ where: { id: store.id }, data: { isActive: false } });
  }
}
