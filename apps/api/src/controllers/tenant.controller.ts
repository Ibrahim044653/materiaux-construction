import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
});

export class TenantController {
  private service = new TenantService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const result = await this.service.list(page, perPage);
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const tenant = await this.service.create(body);
      apiResponse.created(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.service.getById(req.params.id);
      apiResponse.success(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateSchema.parse(req.body);
      const tenant = await this.service.update(req.params.id, body);
      apiResponse.success(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  suspend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.service.setStatus(req.params.id, 'SUSPENDED');
      apiResponse.success(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.service.setStatus(req.params.id, 'ACTIVE');
      apiResponse.success(res, tenant);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      apiResponse.success(res, { message: 'Compte supprimé' });
    } catch (err) {
      next(err);
    }
  };
}
