import { Router, type IRouter } from 'express';
import { authenticate, authorize } from '../middlewares/authenticate';
import { TenantController } from '../controllers/tenant.controller';

const router: IRouter = Router();
const ctrl = new TenantController();

// Toutes les routes nécessitent d'être super admin
router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.patch('/:id/suspend', ctrl.suspend);
router.patch('/:id/activate', ctrl.activate);
router.delete('/:id', ctrl.delete);

export default router;
