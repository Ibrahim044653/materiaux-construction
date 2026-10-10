import rateLimit from 'express-rate-limit';

// Création de boutique : on compte aussi les succès, pour empêcher
// la création en masse de comptes depuis une même adresse.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Trop de créations de compte depuis cette adresse. Réessayez dans une heure.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Compte temporairement bloqué après 5 tentatives. Réessayez dans 30 minutes.',
  },
});
