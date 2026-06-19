import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ModalProps } from "./Modal.types";
import "./Modal.css";

export function Modal({ isOpen, onClose, children, className = "" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const modalClassName = ["modal", className].filter(Boolean).join(" ");

  return createPortal(
    <div className="modal__overlay" onClick={onClose}>
      <div
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
