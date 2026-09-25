import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/authenticate';
import { auditLogService } from '../services/auditLog.service';
import { apiResponse } from '../utils/apiResponse';

const router: Router = Router();

// GET /audit-logs — Super Admin uniquement
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        tenantId,
        userId,
        action,
        resource,
        startDate,
        endDate,
        page = '1',
        perPage = '50',
      } = req.query as Record<string, string>;

      const result = await auditLogService.find({
        tenantId: tenantId || undefined,
        userId: userId || undefined,
        action: action || undefined,
        resource: resource || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: Number(page),
        perPage: Math.min(Number(perPage), 200),
      });

      apiResponse.paginated(res, result.data as object[], result.meta);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
