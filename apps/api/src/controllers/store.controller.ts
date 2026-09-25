import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/store.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class StoreController {
  private service = new StoreService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stores = await this.service.list(req.user!.tenantId);
      apiResponse.success(res, stores);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const store = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, store);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const store = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, store);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateSchema.parse(req.body);
      const store = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, store);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Magasin supprimé' });
    } catch (err) { next(err); }
  };
}
