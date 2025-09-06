/**
 * AuthModal Component
 * 
 * Modal dialog for user authentication that supports both login and registration.
 * Provides toggle between login/register modes and handles authentication success.
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

/**
 * AuthModal component that renders login or registration forms in a modal dialog.
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback to close the modal
 * @param initialMode - Initial form mode ('login' or 'register')
 */
const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  if (!isOpen) return null;

  /**
   * Handles successful authentication by closing the modal.
   */
  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className={`absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10 ${
            theme === 'dark'
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <i className="fas fa-times"></i>
        </button>

        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;