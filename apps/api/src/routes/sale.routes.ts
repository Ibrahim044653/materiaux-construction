import { Router, type IRouter } from 'express';
import { authenticate, enforceTenant } from '../middlewares/authenticate';
import { SaleController } from '../controllers/sale.controller';

const router: IRouter = Router();
const ctrl = new SaleController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.get('/:id/receipt', ctrl.getReceipt);
router.post('/:id/return', ctrl.createReturn);

export default router;
