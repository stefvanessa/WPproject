import React from "react";
import "./Modal.scss";

interface ModalProps {
  title?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-title">{title}</div>}

        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
