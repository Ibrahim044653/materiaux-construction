import { Router, type IRouter } from 'express';
import { authLimiter } from '../middlewares/rateLimiter';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

const router: IRouter = Router();
const ctrl = new AuthController();

// Routes publiques (limitées)
router.post('/login', authLimiter, ctrl.login);
router.post('/login/2fa', authLimiter, ctrl.loginWith2FA);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);

// Route protégée
router.get('/me', authenticate, ctrl.me);
router.patch('/change-password', authenticate, ctrl.changePassword);

export default router;
