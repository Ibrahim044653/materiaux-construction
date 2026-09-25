import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { twoFactorService } from '../services/twoFactor.service';
import { auditLogService } from '../services/auditLog.service';
import { apiResponse } from '../utils/apiResponse';

const router: Router = Router();

// GET /auth/2fa/setup — génère secret + QR code pour l'utilisateur connecté
router.get(
  '/setup',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { secret, otpAuthUrl } = await twoFactorService.generateSecret(req.user!.sub);
      const qrCodeUrl = await twoFactorService.generateQrCode(otpAuthUrl);
      apiResponse.success(res, { secret, qrCodeUrl });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/2fa/enable — active la 2FA après vérification du premier code
router.post(
  '/enable',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { secret, token } = z
        .object({
          secret: z.string().min(16),
          token: z.string().length(6),
        })
        .parse(req.body);

      await twoFactorService.enable(req.user!.sub, secret, token);
      await auditLogService.log({
        userId: req.user!.sub,
        tenantId: req.user!.tenantId,
        action: 'ENABLE_2FA',
        resource: 'User',
        resourceId: req.user!.sub,
        req,
      });
      apiResponse.success(res, { enabled: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/2fa/disable — désactive la 2FA
router.post(
  '/disable',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = z.object({ token: z.string().length(6) }).parse(req.body);
      await twoFactorService.disable(req.user!.sub, token);
      await auditLogService.log({
        userId: req.user!.sub,
        tenantId: req.user!.tenantId,
        action: 'DISABLE_2FA',
        resource: 'User',
        resourceId: req.user!.sub,
        req,
      });
      apiResponse.success(res, { disabled: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/2fa/verify — valide le code TOTP après login (quand 2FA est requis)
router.post('/verify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, token } = z
      .object({
        userId: z.string(),
        token: z.string().length(6),
      })
      .parse(req.body);

    await twoFactorService.validateLogin(userId, token);
    apiResponse.success(res, { verified: true });
  } catch (err) {
    next(err);
  }
});

export default router;
