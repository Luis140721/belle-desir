import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-4 rounded-full ${variant === 'danger' ? 'bg-bd-error/10 text-bd-error' : 'bg-bd-warning/10 text-bd-warning'}`}>
          <AlertTriangle size={32} />
        </div>
        
        <p className="text-bd-muted">{description}</p>
        
        <div className="flex gap-3 w-full mt-4">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-bd-border text-bd-text hover:bg-bd-border transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${
              variant === 'danger' ? 'bg-bd-error hover:bg-red-600' : 'bg-bd-warning hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
