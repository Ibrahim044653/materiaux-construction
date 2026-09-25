import { Request, Response, NextFunction } from 'express';
import { SaleService } from '../services/sale.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const PAYMENT_METHODS = ['CASH','ORANGE_MONEY','WAVE','MTN_MONEY','VIREMENT','CREDIT'] as const;

const createSaleSchema = z.object({
  storeId: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  globalDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  amountPaid: z.string().regex(/^\d+(\.\d{1,2})?$/),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
    discount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  })).min(1, 'Au moins un article requis'),
});

const returnSchema = z.object({
  reason: z.string().min(1, 'Motif de retour requis'),
  items: z.array(z.object({
    saleItemId: z.string().min(1),
    quantity: z.number().positive(),
  })).min(1),
});

export class SaleController {
  private service = new SaleService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const storeId = req.query.storeId as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const result = await this.service.list(req.user!.tenantId, { page, perPage, storeId, from, to });
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSaleSchema.parse(req.body);
      const sale = await this.service.create(req.user!.tenantId, req.user!.sub, body);
      apiResponse.created(res, sale);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sale = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, sale);
    } catch (err) { next(err); }
  };

  getReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receipt = await this.service.getReceipt(req.user!.tenantId, req.params.id);
      apiResponse.success(res, receipt);
    } catch (err) { next(err); }
  };

  createReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = returnSchema.parse(req.body);
      const result = await this.service.createReturn(req.user!.tenantId, req.user!.sub, req.params.id, body);
      apiResponse.created(res, result);
    } catch (err) { next(err); }
  };
}
