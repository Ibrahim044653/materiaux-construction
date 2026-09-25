import { Router, type IRouter, Request, Response, NextFunction } from 'express';
import { authenticate, enforceTenant } from '../middlewares/authenticate';
import { pushService } from '../services/push.service';
import { apiResponse } from '../utils/apiResponse';

const router: IRouter = Router();

// Public: return VAPID public key (needed before auth to configure service worker)
router.get('/vapid-key', (_req: Request, res: Response): void => {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    res.json({ success: true, data: { available: false } });
    return;
  }
  res.json({ success: true, data: { available: true, publicKey: key } });
});

// Authenticated routes
router.use(authenticate, enforceTenant);

router.post(
  '/subscribe',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subscription } = req.body;
      if (!subscription?.endpoint || !subscription?.keys) {
        res.status(400).json({ success: false, message: 'Subscription invalide' });
        return;
      }
      await pushService.save(req.user!.sub, req.user!.tenantId, subscription);
      apiResponse.success(res, { subscribed: true });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/unsubscribe',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        res.status(400).json({ success: false, message: 'Endpoint requis' });
        return;
      }
      await pushService.remove(req.user!.sub, endpoint);
      apiResponse.success(res, { unsubscribed: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
