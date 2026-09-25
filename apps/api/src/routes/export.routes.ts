import { Router, type IRouter, Request, Response, NextFunction } from 'express';
import { authenticate, enforceTenant, authorize } from '../middlewares/authenticate';
import { ExportService } from '../services/export.service';

const router: IRouter = Router();
const svc = new ExportService();

router.use(authenticate, enforceTenant, authorize('OWNER', 'MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'));

router.get('/ventes', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buffer = await svc.exportSales(req.user!.tenantId, {
      storeId: req.query.storeId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    const filename = `ventes-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/stock', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buffer = await svc.exportStock(req.user!.tenantId, {
      storeId: req.query.storeId as string | undefined,
    });
    const filename = `stock-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/clients', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buffer = await svc.exportCustomers(req.user!.tenantId);
    const filename = `clients-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
