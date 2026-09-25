import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { ProductController } from '../controllers/product.controller';

const router: IRouter = Router();
const ctrl = new ProductController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.get('/search', ctrl.search);
router.post('/', authorize('OWNER', 'MANAGER'), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', authorize('OWNER', 'MANAGER'), ctrl.update);
router.delete('/:id', authorize('OWNER', 'MANAGER'), ctrl.delete);

export default router;
