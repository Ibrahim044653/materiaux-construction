import { Router, type IRouter } from 'express';
import { authenticate, enforceTenant } from '../middlewares/authenticate';
import { DashboardController } from '../controllers/dashboard.controller';

const router: IRouter = Router();
const ctrl = new DashboardController();

router.use(authenticate, enforceTenant);

router.get('/kpis', ctrl.getKpis);
router.get('/sales-chart', ctrl.getSalesChart);
router.get('/top-products', ctrl.getTopProducts);
router.get('/alerts', ctrl.getAlerts);

export default router;
