import { Modal } from '../modal';
import { Button } from '../button';
import type { ConfirmProps } from './Confirm.types';
import './Confirm.css';

export function Confirm({
  isOpen,
  onConfirm,
  onCancel,
  title,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  children,
}: ConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="confirm">
      {title && <h2 className="confirm__title">{title}</h2>}
      <div className="confirm__body">{children}</div>
      <div className="confirm__actions">
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
