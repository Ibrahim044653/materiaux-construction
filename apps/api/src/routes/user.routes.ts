import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { UserController } from '../controllers/user.controller';

const router: IRouter = Router();
const ctrl = new UserController();

router.use(authenticate, enforceTenant);

router.get('/', authorize('OWNER', 'MANAGER', 'SUPER_ADMIN'), ctrl.list);
router.post('/', authorize('OWNER', 'SUPER_ADMIN'), ctrl.create);
router.get('/:id', authorize('OWNER', 'MANAGER', 'SUPER_ADMIN'), ctrl.getById);
router.patch('/:id', authorize('OWNER', 'SUPER_ADMIN'), ctrl.update);
router.patch('/:id/toggle-active', authorize('OWNER', 'SUPER_ADMIN'), ctrl.toggleActive);
router.delete('/:id', authorize('OWNER', 'SUPER_ADMIN'), ctrl.delete);

export default router;
