import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateTenantInput = {
  name: string;
  email: string;
  phone?: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
};

type UpdateTenantInput = {
  name?: string;
  email?: string;
  phone?: string;
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';
};

export class TenantService {
  async list(page: number, perPage: number) {
    const [data, total] = await prisma.$transaction([
      prisma.tenant.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, stores: true } } },
      }),
      prisma.tenant.count(),
    ]);

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async create(input: CreateTenantInput) {
    const existing = await prisma.tenant.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError('Un compte avec cet email existe déjà', 409);

    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone,
          plan: input.plan,
        },
      });

      // Créer le propriétaire du tenant
      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: input.ownerName,
          email: input.ownerEmail.toLowerCase(),
          passwordHash,
          role: 'OWNER',
        },
      });

      return newTenant;
    });

    return tenant;
  }

  async getById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        stores: { select: { id: true, name: true, isActive: true } },
        _count: { select: { users: true, stores: true } },
      },
    });
    if (!tenant) throw new AppError('Tenant introuvable', 404);
    return tenant;
  }

  async update(id: string, input: UpdateTenantInput) {
    await this.getById(id);
    return prisma.tenant.update({ where: { id }, data: input });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    await this.getById(id);
    return prisma.tenant.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    await this.getById(id);
    // Soft delete : désactiver tous les utilisateurs du tenant
    await prisma.$transaction([
      prisma.user.updateMany({ where: { tenantId: id }, data: { isActive: false } }),
      prisma.tenant.update({ where: { id }, data: { status: 'DELETED' } }),
    ]);
  }
}
