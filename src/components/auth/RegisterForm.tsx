import React, { useState } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const validatePassword = (password: string) => {
  if (password.length < 6) return 'Use at least 6 characters.';
  if (!/[a-zA-Z]/.test(password)) return 'Add at least one letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  if (!/[^a-zA-Z0-9\s]/.test(password)) return 'Add at least one special character.';
  return null;
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useUser();
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(data => ({ ...data, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) return setError('The passwords do not match.');
    const passwordError = validatePassword(formData.password);
    if (passwordError) return setError(passwordError);
    setLoading(true);
    try {
      await register(formData.email, formData.username, formData.password);
      onSuccess?.();
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { error?: string } } })?.response;
      if (response?.status === 400) setError(response.data?.error || 'Check the fields and try again.');
      else if (response?.status && response.status >= 500) setError('The service is unavailable right now. Try again shortly.');
      else setError('Account creation failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="notice notice--error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
      <form className={`form-stack${error ? ' form-stack--after-notice' : ''}`} onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input autoComplete="email" id="register-email" name="email" onChange={update} placeholder="Enter your email" required type="email" value={formData.email} />
        </div>
        <div className="field">
          <label htmlFor="register-username">Username</label>
          <input autoComplete="username" id="register-username" minLength={3} name="username" onChange={update} placeholder="Choose a username" required type="text" value={formData.username} />
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input autoComplete="new-password" id="register-password" name="password" onChange={update} placeholder="Enter your password" required type="password" value={formData.password} />
          <span className="field__hint">Use a letter, number, and special character.</span>
        </div>
        <div className="field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input autoComplete="new-password" id="register-confirm-password" name="confirmPassword" onChange={update} placeholder="Confirm your password" required type="password" value={formData.confirmPassword} />
        </div>
        <div className="form-actions">
          <button className="button button--primary" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="loading-icon" size={17} /> : <ArrowRight size={17} />}
            {loading ? 'Creating account' : 'Create account'}
          </button>
        </div>
      </form>
      {onSwitchToLogin && <button className="button button--ghost auth-switch" onClick={onSwitchToLogin} type="button">I already have an account</button>}
    </div>
  );
};

export default RegisterForm;
