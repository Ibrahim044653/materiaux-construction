import { cn } from '../../lib/utils';

type Variant = 'success' | 'warning' | 'danger' | 'primary' | 'gray';

const variants: Record<Variant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  primary: 'badge-primary',
  gray: 'badge-gray',
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return <span className={cn(variants[variant], className)}>{children}</span>;
}

// Badges sémantiques réutilisables
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    ACTIVE: { label: 'Actif', variant: 'success' },
    SUSPENDED: { label: 'Suspendu', variant: 'warning' },
    DELETED: { label: 'Supprimé', variant: 'danger' },
    COMPLETED: { label: 'Complète', variant: 'success' },
    PENDING_CREDIT: { label: 'Crédit', variant: 'warning' },
    CANCELLED: { label: 'Annulée', variant: 'danger' },
    RETURNED: { label: 'Retour', variant: 'gray' },
    DRAFT: { label: 'Brouillon', variant: 'gray' },
    SENT: { label: 'Envoyée', variant: 'primary' },
    PARTIAL: { label: 'Partielle', variant: 'warning' },
    RECEIVED: { label: 'Reçue', variant: 'success' },
    PENDING: { label: 'En attente', variant: 'warning' },
    VALIDATED: { label: 'Validé', variant: 'success' },
  };
  const cfg = map[status] ?? { label: status, variant: 'gray' as Variant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    SUPER_ADMIN: { label: 'Super Admin', variant: 'danger' },
    OWNER: { label: 'Propriétaire', variant: 'primary' },
    MANAGER: { label: 'Gérant', variant: 'success' },
    CASHIER: { label: 'Caissier', variant: 'gray' },
    ACCOUNTANT: { label: 'Comptable', variant: 'warning' },
  };
  const cfg = map[role] ?? { label: role, variant: 'gray' as Variant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PaymentBadge({ method }: { method: string }) {
  const labels: Record<string, string> = {
    CASH: 'Espèces',
    ORANGE_MONEY: 'Orange Money',
    WAVE: 'Wave',
    MTN_MONEY: 'MTN Money',
    VIREMENT: 'Virement',
    CREDIT: 'Crédit',
  };
  return (
    <Badge variant={method === 'CREDIT' ? 'warning' : 'primary'}>{labels[method] ?? method}</Badge>
  );
}
