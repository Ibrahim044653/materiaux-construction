import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { StoreController } from '../controllers/store.controller';

const router: IRouter = Router();
const ctrl = new StoreController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.post('/', authorize('OWNER', 'SUPER_ADMIN'), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', authorize('OWNER', 'SUPER_ADMIN'), ctrl.update);
router.delete('/:id', authorize('OWNER', 'SUPER_ADMIN'), ctrl.delete);

export default router;
