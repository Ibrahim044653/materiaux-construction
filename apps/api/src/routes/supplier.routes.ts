import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { SupplierController } from '../controllers/supplier.controller';

const router: IRouter = Router();
const ctrl = new SupplierController();

router.use(authenticate, enforceTenant);

router.get('/', ctrl.list);
router.post('/', authorize('OWNER', 'MANAGER'), ctrl.create);
router.get('/:id', ctrl.getById);
router.patch('/:id', authorize('OWNER', 'MANAGER'), ctrl.update);
router.delete('/:id', authorize('OWNER', 'MANAGER'), ctrl.delete);

// Bons de commande fournisseur
router.get('/orders', ctrl.listOrders);
router.post('/orders', authorize('OWNER', 'MANAGER'), ctrl.createOrder);
router.get('/orders/:orderId', ctrl.getOrder);
router.patch('/orders/:orderId/send', authorize('OWNER', 'MANAGER'), ctrl.sendOrder);
router.patch('/orders/:orderId/receive', authorize('OWNER', 'MANAGER'), ctrl.receiveOrder);
router.patch('/orders/:orderId/cancel', authorize('OWNER', 'MANAGER'), ctrl.cancelOrder);

export default router;
