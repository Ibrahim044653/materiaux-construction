export const PRODUCT_CATEGORIES = [
  { value: 'CIMENT', label: 'Ciment' },
  { value: 'FER_BETON', label: 'Fer à béton' },
  { value: 'TOLE', label: 'Tôle' },
  { value: 'PEINTURE', label: 'Peinture' },
  { value: 'CARRELAGE', label: 'Carrelage' },
  { value: 'PLOMBERIE', label: 'Plomberie' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'BOIS', label: 'Bois' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CREDIT', label: 'Crédit client' },
] as const;

export const ROLES = [
  { value: 'OWNER', label: 'Propriétaire' },
  { value: 'MANAGER', label: 'Gérant' },
  { value: 'CASHIER', label: 'Caissier' },
  { value: 'ACCOUNTANT', label: 'Comptable' },
] as const;

export const TVA_RATE_CI = 18; // Taux TVA Côte d'Ivoire en %

export const CURRENCY = {
  code: 'XOF',
  symbol: 'FCFA',
  locale: 'fr-CI',
} as const;

// Formatage des montants en FCFA
export function formatCFA(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
