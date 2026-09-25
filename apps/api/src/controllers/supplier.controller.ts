import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplier.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
});

const orderSchema = z.object({
  supplierId: z.string().min(1),
  storeId: z.string().min(1),
  notes: z.string().optional(),
  expectedAt: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantityOrdered: z.number().positive(),
    unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  })).min(1),
});

const receiveSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantityReceived: z.number().min(0),
  })).min(1),
});

export class SupplierController {
  private service = new SupplierService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const result = await this.service.list(req.user!.tenantId, page, perPage);
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = supplierSchema.parse(req.body);
      const supplier = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, supplier);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supplier = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, supplier);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = supplierSchema.partial().parse(req.body);
      const supplier = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, supplier);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Fournisseur supprimé' });
    } catch (err) { next(err); }
  };

  listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const storeId = req.query.storeId as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const result = await this.service.listOrders(req.user!.tenantId, { page, perPage, storeId, supplierId });
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = orderSchema.parse(req.body);
      const order = await this.service.createOrder(req.user!.tenantId, body);
      apiResponse.created(res, order);
    } catch (err) { next(err); }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.service.getOrder(req.user!.tenantId, req.params.orderId);
      apiResponse.success(res, order);
    } catch (err) { next(err); }
  };

  sendOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.service.setOrderStatus(req.user!.tenantId, req.params.orderId, 'SENT');
      apiResponse.success(res, order);
    } catch (err) { next(err); }
  };

  receiveOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = receiveSchema.parse(req.body);
      const order = await this.service.receiveOrder(req.user!.tenantId, req.user!.sub, req.params.orderId, body.items);
      apiResponse.success(res, order);
    } catch (err) { next(err); }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.service.setOrderStatus(req.user!.tenantId, req.params.orderId, 'CANCELLED');
      apiResponse.success(res, order);
    } catch (err) { next(err); }
  };
}
