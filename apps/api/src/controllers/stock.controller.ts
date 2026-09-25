import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stock.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const adjustmentSchema = z.object({
  productId: z.string().min(1),
  storeId: z.string().min(1),
  quantity: z.number(),
  reason: z.string().min(1, 'Motif requis'),
});

const transferSchema = z.object({
  fromStoreId: z.string().min(1),
  toStoreId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive('Quantité doit être positive'),
  })).min(1, 'Au moins un article requis'),
});

export class StockController {
  private service = new StockService();

  listEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const entries = await this.service.listEntries(req.user!.tenantId, storeId);
      apiResponse.success(res, entries);
    } catch (err) { next(err); }
  };

  getStoreStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.service.listEntries(req.user!.tenantId, req.params.storeId);
      apiResponse.success(res, entries);
    } catch (err) { next(err); }
  };

  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const alerts = await this.service.getAlerts(req.user!.tenantId, storeId);
      apiResponse.success(res, alerts);
    } catch (err) { next(err); }
  };

  listMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 30;
      const storeId = req.query.storeId as string | undefined;
      const productId = req.query.productId as string | undefined;
      const result = await this.service.listMovements(req.user!.tenantId, { page, perPage, storeId, productId });
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  createAdjustment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = adjustmentSchema.parse(req.body);
      const result = await this.service.createAdjustment(req.user!.tenantId, req.user!.sub, body);
      apiResponse.created(res, result);
    } catch (err) { next(err); }
  };

  listTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const result = await this.service.listTransfers(req.user!.tenantId, page, perPage);
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = transferSchema.parse(req.body);
      const transfer = await this.service.createTransfer(req.user!.tenantId, req.user!.sub, body);
      apiResponse.created(res, transfer);
    } catch (err) { next(err); }
  };

  validateTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transfer = await this.service.validateTransfer(req.user!.tenantId, req.user!.sub, req.params.id);
      apiResponse.success(res, transfer);
    } catch (err) { next(err); }
  };

  cancelTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transfer = await this.service.cancelTransfer(req.user!.tenantId, req.params.id);
      apiResponse.success(res, transfer);
    } catch (err) { next(err); }
  };
}
