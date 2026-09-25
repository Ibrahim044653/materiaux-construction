import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-danger-50' : 'bg-warning-50'}`}
        >
          <AlertTriangle
            size={28}
            className={variant === 'danger' ? 'text-danger-600' : 'text-warning-500'}
          />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
        <div className="flex gap-3 w-full pt-2">
          <button onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'bg-warning-500 text-white hover:bg-warning-600'}`}
          >
            {loading ? 'En cours…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
