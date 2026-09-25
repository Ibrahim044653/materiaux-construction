import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { apiResponse } from '../utils/apiResponse';

export class ReportController {
  private service = new ReportService();

  salesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';
      const report = await this.service.salesReport(req.user!.tenantId, { storeId, from, to, groupBy });
      apiResponse.success(res, report);
    } catch (err) { next(err); }
  };

  stockReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const report = await this.service.stockReport(req.user!.tenantId, storeId);
      apiResponse.success(res, report);
    } catch (err) { next(err); }
  };

  treasuryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const report = await this.service.treasuryReport(req.user!.tenantId, { storeId, from, to });
      apiResponse.success(res, report);
    } catch (err) { next(err); }
  };

  customersDebtReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.customersDebtReport(req.user!.tenantId);
      apiResponse.success(res, report);
    } catch (err) { next(err); }
  };
}
