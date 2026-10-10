import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(60, 'Nom trop long'),
  color: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const bulkSchema = z.object({
  names: z.array(z.string().min(1).max(60)).min(1, 'Au moins une catégorie').max(50),
});

export class CategoryController {
  private service = new CategoryService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.service.list(req.user!.tenantId, includeInactive);
      apiResponse.success(res, categories);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const category = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, category);
    } catch (err) {
      next(err);
    }
  };

  createMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { names } = bulkSchema.parse(req.body);
      const categories = await this.service.createMany(req.user!.tenantId, names);
      apiResponse.created(res, categories);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.getById(req.user!.tenantId, req.params.id);
      apiResponse.success(res, category);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateSchema.parse(req.body);
      const category = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, category);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Catégorie supprimée' });
    } catch (err) {
      next(err);
    }
  };
}
