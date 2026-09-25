import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Compte temporairement bloqué après 5 tentatives. Réessayez dans 30 minutes.',
  },
});
