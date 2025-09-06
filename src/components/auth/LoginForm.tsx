/**
 * LoginForm Component
 * 
 * User authentication form for existing users to sign in.
 * Handles form validation, error states, and success callbacks.
 */

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

/**
 * LoginForm component for user authentication.
 * @param onSuccess - Callback function called after successful login
 * @param onSwitchToRegister - Callback to switch to registration mode
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { theme } = useTheme();
  const { login } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (err: unknown) {
      const errorResponse = (err as any)?.response;
      if (errorResponse?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorResponse?.status === 400) {
        setError(errorResponse?.data?.error || 'Please check your input and try again.');
      } else if (errorResponse?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
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
          <i className="fas fa-sign-in-alt text-white text-2xl"></i>
        </div>
        <h2 className={`text-2xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome Back
        </h2>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Sign in to your EmotionFlix account
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
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 rounded-xl border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-500'
            } focus:outline-none focus:ring-0`}
            placeholder="Enter your password"
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
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {onSwitchToRegister && (
        <div className="mt-6 text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className={`font-semibold ${
                theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;