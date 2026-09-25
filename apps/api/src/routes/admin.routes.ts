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
