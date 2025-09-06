/**
 * RegisterForm Component
 * 
 * User registration form for new account creation.
 * Includes password strength validation and handles form submission.
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

/**
 * Validates password strength according to security requirements.
 * @param password - Password string to validate
 * @returns Object with validation result and error message if invalid
 */
const validatePasswordStrength = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  // Check for common weak patterns
  if (/^[0-9]+$/.test(password)) {
    return { isValid: false, error: 'Password cannot be only numbers' };
  }
  
  if (/^[a-zA-Z]+$/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number or special character' };
  }
  
  // Check for very common weak passwords (exact matches only)
  const commonWeakPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master'
  ];
  
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too common, please choose a stronger password' };
  }
  
  // Require at least one letter, one number, and one special character
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  
  return { isValid: true };
};

/**
 * RegisterForm component for new user account creation.
 * @param onSuccess - Callback function called after successful registration
 * @param onSwitchToLogin - Callback to switch to login mode
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { theme } = useTheme();
  const { register } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Use the same password validation as backend
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Password does not meet strength requirements');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.username, formData.password);
      onSuccess?.();
    } catch (err: unknown) {
      const errorResponse = (err as any)?.response;
      if (errorResponse?.status === 400) {
        setError(errorResponse?.data?.error || 'Please check your input and try again.');
      } else if (errorResponse?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`w-full max-w-md mx-auto p-8 rounded-2xl border backdrop-blur-sm shadow-lg ${
      theme === 'dark' 
        ? 'bg-slate-800/30 border-slate-700/50 shadow-black/20' 
        : 'bg-white/60 border-gray-200/50 shadow-gray-900/5'
    }`}>
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-600 text-white'
        }`}>
          <i className="fas fa-user-plus text-white text-2xl"></i>
        </div>
        <h2 className={`text-2xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Join EmotionFlix
        </h2>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Create your account to start tracking movie emotions
        </p>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-xl border ${
          theme === 'dark' 
            ? 'bg-red-900/20 border-red-500/50 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
            } focus:outline-none focus:ring-0`}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
            } focus:outline-none focus:ring-0`}
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
            } focus:outline-none focus:ring-0`}
            placeholder="Enter your password"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"  
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
            } focus:outline-none focus:ring-0`}
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin"></i>
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className={`font-semibold ${
                theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;