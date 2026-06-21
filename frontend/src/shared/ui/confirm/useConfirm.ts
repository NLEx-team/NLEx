import { useState, useCallback, useRef } from 'react';

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(() => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setIsOpen(false);
  }, []);

  return { confirm, isOpen, onConfirm: handleConfirm, onCancel: handleCancel };
}
