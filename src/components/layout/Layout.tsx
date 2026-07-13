import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, LogOut, Menu, Plus, UserRound, X } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../auth/AuthModal';
import BrandMark from '../brand/BrandMark';

const DEMO_EMAIL = 'demo@demo.com';
const DEMO_PASSWORD = 'demo123!';

export interface LayoutOutletContext {
  openAuth: () => void;
  enterDemo: () => Promise<void>;
  demoLoading: boolean;
}

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, login, logout } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const accountRef = useRef<HTMLDivElement>(null);

  const productLinks = [
    { path: '/recommendations', label: 'For you' },
    { path: '/diary', label: 'Diary' },
    { path: '/community', label: 'Community' },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setDemoError('');
  }, [location.pathname]);

  useEffect(() => {
    const closeAccountMenu = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', closeAccountMenu);
    return () => document.removeEventListener('mousedown', closeAccountMenu);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, location.pathname]);

  const openAuth = () => {
    setMobileOpen(false);
    setAuthOpen(true);
  };

  const enterDemo = async () => {
    if (demoLoading) return;
    setDemoError('');
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      setAuthOpen(false);
      navigate('/recommendations');
    } catch {
      setDemoError('The demo account is unavailable right now. Try again shortly.');
    } finally {
      setDemoLoading(false);
    }
  };

  const renderProductLink = (path: string, label: string, mobile = false) => {
    const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
    return (
      <Link
        aria-current={active ? 'page' : undefined}
        className={`nav-link${active ? ' nav-link--active' : ''}`}
        key={`${mobile ? 'mobile-' : ''}${path}`}
        to={path}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className={`app-shell${user ? ' app-shell--product' : ' app-shell--public'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={`nav-shell${user ? ' nav-shell--product' : ' nav-shell--public'}`}>
        <div className="nav-inner">
          <Link aria-label="EmotionFlix home" className="brand-lockup" to={user ? '/recommendations' : '/'}>
            <span className="brand-slot" aria-hidden="true"><BrandMark /></span>
            <span className="wordmark">EmotionFlix</span>
          </Link>

          {user ? (
            <nav aria-label="Primary" className="nav-links">
              {productLinks.map(link => renderProductLink(link.path, link.label))}
            </nav>
          ) : (
            <nav aria-label="Product overview" className="nav-links nav-links--public">
              <a className="nav-link" href="#how-it-works">How it works</a>
              <a className="nav-link" href="#records">The record</a>
              <a className="nav-link" href="#people">People</a>
            </nav>
          )}

          <div className="nav-actions">
            {user && <Link className="button button--primary nav-log" to="/log"><Plus size={17} />Log a film</Link>}
            {user ? (
              <div className="account-control" ref={accountRef}>
                <button
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  className="avatar-button"
                  onClick={() => setAccountOpen(open => !open)}
                  type="button"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </button>
                {accountOpen && (
                  <div className="account-menu" role="menu">
                    <div className="account-menu__identity"><strong>{user.displayName}</strong><span>@{user.username}</span></div>
                    <Link className="account-menu__item" role="menuitem" to="/profile"><UserRound size={17} />Account</Link>
                    <button className="account-menu__item" onClick={logout} role="menuitem" type="button"><LogOut size={17} />Sign out</button>
                  </div>
                )}
              </div>
            ) : !authLoading ? (
              <>
                <button className="button button--quiet nav-sign-in" onClick={openAuth} type="button">Sign in</button>
                <button className="button button--primary nav-demo" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
                  {demoLoading && <LoaderCircle className="loading-icon" size={16} />}
                  {demoLoading ? 'Opening demo' : 'Enter demo'}
                </button>
              </>
            ) : <span aria-label="Loading account" className="nav-auth-loading" />}

            <button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen(open => !open)}
              type="button"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {demoError && <p className="nav-status" role="alert">{demoError}</p>}

        {mobileOpen && (
          <nav aria-label="Mobile" className="mobile-sheet">
            {user ? (
              <>
                {productLinks.map(link => renderProductLink(link.path, link.label, true))}
                <Link className="nav-link" to="/log">Log a film</Link>
              </>
            ) : (
              <>
                <a className="nav-link" href="#how-it-works">How it works</a>
                <a className="nav-link" href="#records">The record</a>
                <a className="nav-link" href="#people">People</a>
                <button className="nav-link" onClick={openAuth} type="button">Sign in</button>
                <button className="button button--primary" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
                  {demoLoading ? 'Opening demo' : 'Enter demo'}
                </button>
              </>
            )}
          </nav>
        )}
      </header>

      <main id="main-content">
        <Outlet context={{ openAuth, enterDemo, demoLoading } satisfies LayoutOutletContext} />
      </main>

      <footer className={`footer${user ? ' footer--product' : ''}`}>
        <div className="footer__inner">
          <Link className="brand-lockup" to={user ? '/recommendations' : '/'}>
            <span className="brand-slot" aria-hidden="true"><BrandMark /></span>
            <span className="wordmark">EmotionFlix</span>
          </Link>
          <p>Emotion-based social film discovery, built from how people respond. Film data and artwork from TMDB.</p>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Layout;
