import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Montant invalide'),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

export class CustomerController {
  private service = new CustomerService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const search = req.query.search as string | undefined;
      const withDebt = req.query.withDebt === 'true';
      const result = await this.service.list(req.user!.tenantId, { page, perPage, search, withDebt });
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const customer = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, customer);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, customer);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.partial().parse(req.body);
      const customer = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, customer);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Client supprimé' });
    } catch (err) { next(err); }
  };

  getSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const result = await this.service.getSales(req.user!.tenantId, req.params.id, page, perPage);
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  addPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = paymentSchema.parse(req.body);
      const payment = await this.service.addPayment(req.user!.tenantId, req.params.id, body);
      apiResponse.created(res, payment);
    } catch (err) { next(err); }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await this.service.getPayments(req.user!.tenantId, req.params.id);
      apiResponse.success(res, payments);
    } catch (err) { next(err); }
  };
}
