import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erreur métier contrôlée
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
    return;
  }

  // Erreur de validation Zod
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Données invalides',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Cette valeur existe déjà.' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Ressource introuvable.' });
      return;
    }
  }

  // Erreur interne non gérée
  logger.error({ err }, 'Erreur interne non gérée');
  res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
}
