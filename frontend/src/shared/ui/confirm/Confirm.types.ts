import type { ReactNode } from 'react';

export interface ConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'secondary' | 'primary';
  children: ReactNode;
}
