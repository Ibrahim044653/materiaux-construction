import { Router, type IRouter } from 'express';
import { authenticate, enforceTenant } from '../middlewares/authenticate';
import { CustomerController } from '../controllers/customer.controller';

const router: IRouter = Router();
const ctrl = new CustomerController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.get('/:id/sales', ctrl.getSales);
router.post('/:id/payments', ctrl.addPayment);
router.get('/:id/payments', ctrl.getPayments);

export default router;
