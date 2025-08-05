import React from 'react';
import Modal from '../../shared/components/Modal/Modal';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type="error"
      showCloseButton={true}
    >
      <div>
        <p>{message}</p>
        
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Try Again
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;