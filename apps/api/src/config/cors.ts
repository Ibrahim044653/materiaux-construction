import { CorsOptions } from 'cors';

function stripBomAndTrim(v: string): string {
  // Strip BOM (0xFEFF) from PowerShell and trailing whitespace from cmd.exe
  const s = v.charCodeAt(0) === 0xfeff ? v.slice(1) : v;
  return s.trim();
}

function parseOrigins(): string[] {
  const raw = [
    process.env.FRONTEND_URL ?? '',
    process.env.ADMIN_URL ?? '',
    process.env.CORS_EXTRA_ORIGINS ?? '',
  ];

  const fromEnv = raw
    .flatMap((v) => v.split(','))
    .map(stripBomAndTrim)
    .filter(Boolean);

  const defaults = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3002'];

  return [...new Set([...fromEnv, ...defaults])];
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = parseOrigins();
    if (!origin || allowed.includes(origin)) {
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
