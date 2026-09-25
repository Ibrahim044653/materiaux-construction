import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

type CreateInput = { name: string; phone?: string; email?: string; address?: string };
type ListOpts = { page: number; perPage: number; search?: string; withDebt: boolean };
type PaymentInput = { amount: string; paymentMethod: string; notes?: string };

export class CustomerService {
  async list(tenantId: string, opts: ListOpts) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(opts.withDebt && { creditBalance: { gt: 0 } }),
      ...(opts.search && {
        OR: [
          { name: { contains: opts.search, mode: 'insensitive' } },
          { phone: { contains: opts.search } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip: (opts.page - 1) * opts.perPage,
        take: opts.perPage,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);
    return { data, meta: { page: opts.page, perPage: opts.perPage, total, totalPages: Math.ceil(total / opts.perPage) } };
  }

  async create(tenantId: string, input: CreateInput) {
    return prisma.customer.create({ data: { tenantId, ...input } });
  }

  async getById(tenantId: string, id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new AppError('Client introuvable', 404);
    return customer;
  }

  async update(tenantId: string, id: string, input: Partial<CreateInput>) {
    await this.getById(tenantId, id);
    return prisma.customer.update({ where: { id }, data: input });
  }

  async delete(tenantId: string, id: string) {
    const customer = await this.getById(tenantId, id);
    if (customer.creditBalance.gt(0)) {
      throw new AppError(`Ce client a encore ${customer.creditBalance} FCFA de créance. Soldez avant suppression.`, 409);
    }
    return prisma.customer.delete({ where: { id } });
  }

  async getSales(tenantId: string, customerId: string, page: number, perPage: number) {
    await this.getById(tenantId, customerId);
    const [data, total] = await prisma.$transaction([
      prisma.sale.findMany({
        where: { tenantId, customerId },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          store: { select: { name: true } },
          items: { select: { productName: true, quantity: true, total: true } },
        },
      }),
      prisma.sale.count({ where: { tenantId, customerId } }),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async addPayment(tenantId: string, customerId: string, input: PaymentInput) {
    const customer = await this.getById(tenantId, customerId);
    const amount = new Prisma.Decimal(input.amount);

    if (amount.lte(0)) throw new AppError('Montant invalide', 400);
    if (amount.gt(customer.creditBalance)) {
      throw new AppError(`Le montant dépasse la créance : ${customer.creditBalance} FCFA`, 400);
    }

    return prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { creditBalance: { decrement: amount } },
      });

      return tx.customerPayment.create({
        data: { tenantId, customerId, amount, paymentMethod: input.paymentMethod, notes: input.notes },
      });
    });
  }

  async getPayments(tenantId: string, customerId: string) {
    await this.getById(tenantId, customerId);
    return prisma.customerPayment.findMany({
      where: { customerId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
