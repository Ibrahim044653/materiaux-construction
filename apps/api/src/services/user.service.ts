import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

const SELECT_SAFE = {
  id: true, email: true, name: true, phone: true, avatar: true,
  role: true, isActive: true, storeId: true, tenantId: true,
  lastLoginAt: true, createdAt: true,
  store: { select: { id: true, name: true } },
};

type CreateInput = {
  email: string; name: string; phone?: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'ACCOUNTANT';
  password: string; storeId?: string;
};
type UpdateInput = { name?: string; phone?: string; role?: string; storeId?: string | null };

export class UserService {
  async list(tenantId: string, page: number, perPage: number) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { tenantId },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
        select: SELECT_SAFE,
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async create(tenantId: string, input: CreateInput) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new AppError('Un utilisateur avec cet email existe déjà', 409);

    const passwordHash = await bcrypt.hash(input.password, 12);
    return prisma.user.create({
      data: {
        tenantId,
        email: input.email.toLowerCase(),
        name: input.name,
        phone: input.phone,
        role: input.role,
        storeId: input.storeId,
        passwordHash,
      },
      select: SELECT_SAFE,
    });
  }

  async getById(tenantId: string, id: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
      select: SELECT_SAFE,
    });
    if (!user) throw new AppError('Utilisateur introuvable', 404);
    return user;
  }

  async update(tenantId: string, id: string, input: UpdateInput) {
    await this.getById(tenantId, id);
    return prisma.user.update({
      where: { id },
      data: { name: input.name, phone: input.phone, role: input.role as never, storeId: input.storeId },
      select: SELECT_SAFE,
    });
  }

  async toggleActive(tenantId: string, id: string) {
    const user = await this.getById(tenantId, id);
    return prisma.user.update({
      where: { id },
      data: { isActive: !(user as { isActive: boolean }).isActive },
      select: SELECT_SAFE,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
