import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { CategoryController } from '../controllers/category.controller';

const router: IRouter = Router();
const ctrl = new CategoryController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.post('/', authorize('OWNER', 'MANAGER'), ctrl.create);
router.post('/bulk', authorize('OWNER', 'MANAGER'), ctrl.createMany);
router.get('/:id', ctrl.getById);
router.patch('/:id', authorize('OWNER', 'MANAGER'), ctrl.update);
router.delete('/:id', authorize('OWNER', 'MANAGER'), ctrl.delete);

export default router;
