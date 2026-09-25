import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const CATEGORIES = ['CIMENT','FER_BETON','TOLE','PEINTURE','CARRELAGE','PLOMBERIE','ELECTRICITE','BOIS','AUTRE'] as const;

const createSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  name: z.string().min(2, 'Nom requis'),
  category: z.enum(CATEGORIES),
  description: z.string().optional(),
  buyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prix achat invalide'),
  sellPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prix vente invalide'),
  tva: z.number().min(0).max(100).default(18),
  unit: z.string().min(1).default('unité'),
  alertThreshold: z.number().min(0).default(5),
  barcode: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class ProductController {
  private service = new ProductService();

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      const category = req.query.category as string | undefined;
      const storeId = req.query.storeId as string | undefined;
      const result = await this.service.list(req.user!.tenantId, { page, perPage, category, storeId });
      apiResponse.paginated(res, result.data, result.meta);
    } catch (err) { next(err); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = (req.query.q as string) || '';
      const storeId = req.query.storeId as string | undefined;
      const products = await this.service.search(req.user!.tenantId, q, storeId);
      apiResponse.success(res, products);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createSchema.parse(req.body);
      const product = await this.service.create(req.user!.tenantId, body);
      apiResponse.created(res, product);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const product = await this.service.getById(req.user!.tenantId, req.params.id, storeId);
      apiResponse.success(res, product);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = updateSchema.parse(req.body);
      const product = await this.service.update(req.user!.tenantId, req.params.id, body);
      apiResponse.success(res, product);
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.user!.tenantId, req.params.id);
      apiResponse.success(res, { message: 'Produit désactivé' });
    } catch (err) { next(err); }
  };
}
