import React from 'react';
import Modal from '../../shared/components/Modal/Modal';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  email 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Verification Required"
      type="success"
      showCloseButton={true}
    >
      <div>
        <p>
          <strong>Account created successfully!</strong>
        </p>
        <p>
          We've sent a verification email to <strong style={{color: '#10b981'}}>{email}</strong>.
        </p>
        <p>
          Please check your email and click the verification link to activate your account.
        </p>
        <p>
          <em>Note: Check your spam folder if you don't see the email in your inbox.</em>
        </p>
        
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmailVerificationModal;