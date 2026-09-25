import { CorsOptions } from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
  process.env.ADMIN_URL ?? 'http://localhost:5174',
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (curl, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine CORS non autorisée : ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
};
