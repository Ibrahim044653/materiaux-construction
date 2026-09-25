import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT']),
  password: z.string().min(8, 'Minimum 8 caractères'),
  storeId: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT']).optional(),
  storeId: z.string().nullable().optional(),
});

export class UserController {
  private service = new UserService();

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
      const body = createSchema.parse(req.body);
      const user = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, user);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, user);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateSchema.parse(req.body);
      const user = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, user);
    } catch (err) { next(err); }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.toggleActive(req.user!.tenantId, req.params.id);
      apiResponse.success(res, user);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Utilisateur supprimé' });
    } catch (err) { next(err); }
  };
}
