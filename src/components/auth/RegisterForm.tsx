import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.username, formData.password);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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