import { Response } from 'express';

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export const apiResponse = {
  success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
  },

  created<T>(res: Response, data: T) {
    return res.status(201).json({ success: true, data });
  },

  paginated<T>(res: Response, data: T[], meta: PaginationMeta) {
    res.setHeader('X-Total-Count', meta.total);
    res.setHeader('X-Page', meta.page);
    res.setHeader('X-Per-Page', meta.perPage);
    return res.status(200).json({ success: true, data, meta });
  },

  error(res: Response, message: string, statusCode = 400, errors?: Array<{ field: string; message: string }>) {
    const body: Record<string, unknown> = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  },

  unauthorized(res: Response, message = 'Non authentifié') {
    return res.status(401).json({ success: false, message });
  },

  forbidden(res: Response, message = 'Accès refusé') {
    return res.status(403).json({ success: false, message });
  },

  notFound(res: Response, message = 'Ressource introuvable') {
    return res.status(404).json({ success: false, message });
  },
};
