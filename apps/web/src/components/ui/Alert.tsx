import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

const config = {
  success: { icon: CheckCircle, cls: 'bg-success-50 text-success-600 border-success-200' },
  warning: { icon: AlertTriangle, cls: 'bg-warning-50 text-warning-500 border-warning-200' },
  danger: { icon: XCircle, cls: 'bg-danger-50 text-danger-600 border-danger-200' },
  info: { icon: Info, cls: 'bg-blue-50 text-blue-600 border-blue-200' },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const { icon: Icon, cls } = config[variant];
  return (
    <div className={cn('flex gap-3 p-3 rounded-xl border text-sm', cls, className)}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
