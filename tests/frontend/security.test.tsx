import { authService } from '../../src/services/authService';
import { vi } from 'vitest';

describe('Demo session storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the demo session in the current tab and clears legacy persistent auth', () => {
    localStorage.setItem('auth-token', 'legacy-token');
    localStorage.setItem('auth-user', '{}');

    authService.storeAuthData('demo-token', {
      id: 1,
      email: 'demo@demo.com',
      username: 'demo',
    });

    expect(authService.getStoredToken()).toBe('demo-token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth-token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth-user');
  });
});
