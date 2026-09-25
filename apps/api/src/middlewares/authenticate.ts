import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { apiResponse } from '../utils/apiResponse';
import { Role } from '@materiaux/shared';

export interface AuthPayload {
  sub: string;       // userId
  tenantId: string;
  role: Role;
  storeId?: string;  // pour les caissiers/gérants limités à un magasin
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    apiResponse.unauthorized(res);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    apiResponse.unauthorized(res, 'Token invalide ou expiré');
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiResponse.unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      apiResponse.forbidden(res, `Rôle requis : ${roles.join(' ou ')}`);
      return;
    }
    next();
  };
}

// Garantit que chaque requête est filtrée par le tenantId du token JWT
export function enforceTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    apiResponse.forbidden(res, 'Tenant non identifié');
    return;
  }
  next();
}
