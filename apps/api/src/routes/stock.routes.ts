import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { StockController } from '../controllers/stock.controller';

const router: IRouter = Router();
const ctrl = new StockController();

router.use(authenticate, enforceTenant);

// Stock par magasin
router.get('/entries', ctrl.listEntries);
router.get('/entries/:storeId', ctrl.getStoreStock);
router.get('/alerts', ctrl.getAlerts);

// Mouvements
router.get('/movements', ctrl.listMovements);
router.post('/adjustment', authorize('OWNER', 'MANAGER'), ctrl.createAdjustment);

// Transferts inter-magasins
router.get('/transfers', ctrl.listTransfers);
router.post('/transfers', authorize('OWNER', 'MANAGER'), ctrl.createTransfer);
router.patch('/transfers/:id/validate', authorize('OWNER', 'MANAGER'), ctrl.validateTransfer);
router.patch('/transfers/:id/cancel', authorize('OWNER', 'MANAGER'), ctrl.cancelTransfer);

export default router;
