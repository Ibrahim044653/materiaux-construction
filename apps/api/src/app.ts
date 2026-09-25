import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { corsOptions } from './config/cors';

// Routes
import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import storeRoutes from './routes/store.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import saleRoutes from './routes/sale.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import twoFactorRoutes from './routes/twoFactor.routes';
import auditLogRoutes from './routes/auditLog.routes';
import adminRoutes from './routes/admin.routes';
import exportRoutes from './routes/export.routes';
import pushRoutes from './routes/push.routes';

const app: Application = express();

// Requis derrière un reverse proxy (Vercel, Nginx) pour express-rate-limit
app.set('trust proxy', 1);

// ── Sécurité ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
});
app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging HTTP ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ── Health check ──────────────────────────────────────────────────────────────
const healthHandler = (_req: Request, res: Response) => {
  const dbUrl = process.env.DATABASE_URL ?? '';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbUrl ? `${dbUrl.substring(0, 15)}... (len=${dbUrl.length})` : 'NOT SET',
  });
};
app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// ── Routes API ────────────────────────────────────────────────────────────────
const V1 = '/api/v1';

app.use(`${V1}/auth`, authRoutes);
app.use(`${V1}/tenants`, tenantRoutes);
app.use(`${V1}/stores`, storeRoutes);
app.use(`${V1}/users`, userRoutes);
app.use(`${V1}/products`, productRoutes);
app.use(`${V1}/stock`, stockRoutes);
app.use(`${V1}/sales`, saleRoutes);
app.use(`${V1}/customers`, customerRoutes);
app.use(`${V1}/suppliers`, supplierRoutes);
app.use(`${V1}/dashboard`, dashboardRoutes);
app.use(`${V1}/reports`, reportRoutes);
app.use(`${V1}/auth/2fa`, twoFactorRoutes);
app.use(`${V1}/audit-logs`, auditLogRoutes);
app.use(`${V1}/admin`, adminRoutes);
app.use(`${V1}/reports/export`, exportRoutes);
app.use(`${V1}/push`, pushRoutes);

// ── 404 + Gestionnaire d'erreurs ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
