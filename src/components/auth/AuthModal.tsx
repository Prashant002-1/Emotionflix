import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => setMode(initialMode), [initialMode, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="auth-title" aria-modal="true" className="dialog" role="dialog">
        <button aria-label="Close dialog" className="icon-button dialog__close" onClick={onClose} ref={closeRef} type="button">
          <X size={20} />
        </button>
        <h2 className="dialog__title" id="auth-title">{mode === 'login' ? 'Sign in' : 'Create an account'}</h2>
        <p className="dialog__intro">
          {mode === 'login' ? 'Open your diary, saved films, and personal recommendations.' : 'Keep a film diary and let the record change what you find next.'}
        </p>
        <div aria-label="Account action" className="auth-tabs" role="tablist">
          <button aria-selected={mode === 'login'} className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`} onClick={() => setMode('login')} role="tab" type="button">Existing account</button>
          <button aria-selected={mode === 'register'} className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`} onClick={() => setMode('register')} role="tab" type="button">New account</button>
        </div>
        {mode === 'login' ? (
          <LoginForm onSuccess={onClose} onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSuccess={onClose} onSwitchToLogin={() => setMode('login')} />
        )}
      </section>
    </div>
  );
};

export default AuthModal;
