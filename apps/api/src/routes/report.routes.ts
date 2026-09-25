import { Router, type IRouter } from 'express';
import { authenticate, authorize, enforceTenant } from '../middlewares/authenticate';
import { ReportController } from '../controllers/report.controller';

const router: IRouter = Router();
const ctrl = new ReportController();

router.use(authenticate, enforceTenant, authorize('OWNER', 'MANAGER', 'ACCOUNTANT'));

router.get('/sales', ctrl.salesReport);
router.get('/stock', ctrl.stockReport);
router.get('/treasury', ctrl.treasuryReport);
router.get('/customers-debt', ctrl.customersDebtReport);

export default router;
