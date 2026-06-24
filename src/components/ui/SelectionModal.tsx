import type { ReactNode } from 'react';
import Modal from './Modal';

interface SelectionModalProps {
  title: string;
  onClose: () => void;
  maxWidth?: number;
  headerAccessory?: ReactNode;
  filters?: ReactNode;
  footer: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}

export default function SelectionModal({
  title,
  onClose,
  maxWidth = 640,
  headerAccessory,
  filters,
  footer,
  pagination,
  children,
}: SelectionModalProps) {
  return (
    <Modal onClose={onClose} maxWidth={maxWidth}>
      <Modal.Header title={title} onClose={onClose}>
        {headerAccessory}
      </Modal.Header>
      {filters && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
          {filters}
        </div>
      )}
      <div className="overflow-y-auto flex-1">
        {children}
      </div>
      {pagination && (
        <div className="border-t border-line">
          {pagination}
        </div>
      )}
      <Modal.Footer justify="between">
        {footer}
      </Modal.Footer>
    </Modal>
  );
}
