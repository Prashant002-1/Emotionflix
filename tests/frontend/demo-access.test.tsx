import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserProvider, useUser } from '../../src/contexts/UserContext';

const mocks = vi.hoisted(() => ({
  openDemo: vi.fn().mockResolvedValue({
    message: 'Demo ready',
    token: 'demo-token',
    user: { id: 1, email: 'demo@demo.com', username: 'demo', bio: '' },
    bootstrap: {
      diary: { entries: [], savedFilms: [], summary: {} },
      home: { entries: [], recommendations: { forYou: [], adjacent: [], community: [], profile: {} }, people: [], pulse: [] },
    },
  }),
  storeAuthData: vi.fn(),
}));

vi.mock('../../src/services/authService', () => ({
  authService: {
    openDemo: mocks.openDemo,
    storeAuthData: mocks.storeAuthData,
    getStoredToken: vi.fn().mockReturnValue(null),
    clear: vi.fn(),
  },
}));

const DemoProbe = () => {
  const { user, enterDemo } = useUser();
  return user
    ? <p>Opened for {user.username}</p>
    : <button onClick={() => void enterDemo()} type="button">Enter demo</button>;
};

describe('Demo access', () => {
  it('opens the prepared product without credentials', async () => {
    render(<UserProvider><DemoProbe /></UserProvider>);
    await userEvent.click(await screen.findByRole('button', { name: 'Enter demo' }));

    expect(await screen.findByText('Opened for demo')).toBeInTheDocument();
    expect(mocks.openDemo).toHaveBeenCalledOnce();
    expect(mocks.storeAuthData).toHaveBeenCalledWith('demo-token', expect.objectContaining({ username: 'demo' }));
  });
});
