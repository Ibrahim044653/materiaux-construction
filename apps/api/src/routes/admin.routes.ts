import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/authenticate';
import { prisma } from '../config/prisma';
import { apiResponse } from '../utils/apiResponse';

const router: Router = Router();

// GET /admin/stats — statistiques globales SaaS
router.get(
  '/stats',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        totalSalesCount,
        recentTenants,
        planBreakdown,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
        prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
        prisma.sale.count(),
        prisma.tenant.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, email: true, plan: true, status: true, createdAt: true },
        }),
        prisma.tenant.groupBy({
          by: ['plan'],
          _count: { id: true },
        }),
      ]);

      apiResponse.success(res, {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        totalSalesCount,
        recentTenants,
        planBreakdown: planBreakdown.map((p) => ({ plan: p.plan, count: p._count.id })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/users — tous les utilisateurs, toutes boutiques confondues.
// La route /users est volontairement cloisonnee par enforceTenant : le super
// admin n'appartient a aucune boutique, il lui faut donc sa propre route.
router.get(
  '/users',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage = Math.min(100, parseInt(req.query.perPage as string) || 20);
      const search = (req.query.search as string)?.trim();

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            tenant: { select: { id: true, name: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      apiResponse.paginated(res, data, {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/tenants/:id/status — changer statut tenant
router.patch(
  '/tenants/:id/status',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' };
      const tenant = await prisma.tenant.update({
        where: { id: req.params.id },
        data: { status },
      });
      apiResponse.success(res, tenant);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /admin/tenants/:id — soft delete (status = DELETED)
router.delete(
  '/tenants/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.tenant.update({
        where: { id: req.params.id },
        data: { status: 'DELETED' },
      });
      apiResponse.success(res, { deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
