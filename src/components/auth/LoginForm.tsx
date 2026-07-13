import React, { useState } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const DEMO_EMAIL = 'demo@demo.com';
const DEMO_PASSWORD = 'demo123!';

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = async (email: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { error?: string } } })?.response;
      if (response?.status === 401) setError('The email or password is incorrect.');
      else if (response?.status === 400) setError(response.data?.error || 'Check the fields and try again.');
      else if (response?.status && response.status >= 500) setError('The service is unavailable right now. Try again shortly.');
      else setError('Sign in failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void signIn(formData.email, formData.password);
  };

  return (
    <div>
      {error && <div className="notice notice--error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
      <form className={`form-stack${error ? ' form-stack--after-notice' : ''}`} onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input autoComplete="email" id="login-email" name="email" onChange={(event) => setFormData(data => ({ ...data, email: event.target.value }))} placeholder="Enter your email" required type="email" value={formData.email} />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input autoComplete="current-password" id="login-password" name="password" onChange={(event) => setFormData(data => ({ ...data, password: event.target.value }))} placeholder="Enter your password" required type="password" value={formData.password} />
        </div>
        <div className="form-actions">
          <button className="button button--primary" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="loading-icon" size={17} /> : <ArrowRight size={17} />}
            {loading ? 'Signing in' : 'Sign in'}
          </button>
        </div>
      </form>

      <div className="demo-access">
        <p>Want to look around first? Open a complete example diary and its recommendations.</p>
        <button className="button button--secondary" disabled={loading} onClick={() => void signIn(DEMO_EMAIL, DEMO_PASSWORD)} type="button">
          {loading ? 'Opening demo' : 'Enter demo'}
        </button>
      </div>

      {onSwitchToRegister && (
        <button className="button button--ghost auth-switch" onClick={onSwitchToRegister} type="button">Create your own account</button>
      )}
    </div>
  );
};

export default LoginForm;
