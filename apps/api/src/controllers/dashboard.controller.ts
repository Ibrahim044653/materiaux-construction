import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { apiResponse } from '../utils/apiResponse';

export class DashboardController {
  private service = new DashboardService();

  getKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const kpis = await this.service.getKpis(req.user!.tenantId, storeId);
      apiResponse.success(res, kpis);
    } catch (err) { next(err); }
  };

  getSalesChart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const period = (req.query.period as '7d' | '30d' | '12m') || '7d';
      const chart = await this.service.getSalesChart(req.user!.tenantId, period, storeId);
      apiResponse.success(res, chart);
    } catch (err) { next(err); }
  };

  getTopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const products = await this.service.getTopProducts(req.user!.tenantId, storeId);
      apiResponse.success(res, products);
    } catch (err) { next(err); }
  };

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const alerts = await this.service.getAlerts(req.user!.tenantId, storeId);
      apiResponse.success(res, alerts);
    } catch (err) { next(err); }
  };
}
