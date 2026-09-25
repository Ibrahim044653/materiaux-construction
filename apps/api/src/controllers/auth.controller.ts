import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { apiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);
      const result = await this.service.login(body.email, body.password);
      apiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await this.service.refresh(refreshToken);
      apiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      await this.service.logout(refreshToken);
      apiResponse.success(res, { message: 'Déconnecté avec succès' });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getMe(req.user!.sub);
      apiResponse.success(res, user);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = changePasswordSchema.parse(req.body);
      await this.service.changePassword(req.user!.sub, body.currentPassword, body.newPassword);
      apiResponse.success(res, { message: 'Mot de passe modifié avec succès' });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = forgotSchema.parse(req.body);
      await this.service.forgotPassword(email);
      // Réponse générique pour ne pas révéler si l'email existe
      apiResponse.success(res, {
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation.',
      });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = resetSchema.parse(req.body);
      await this.service.resetPassword(body.token, body.newPassword);
      apiResponse.success(res, { message: 'Mot de passe réinitialisé avec succès' });
    } catch (err) {
      next(err);
    }
  };
}
