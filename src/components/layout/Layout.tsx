import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, Compass, LoaderCircle, LogOut, Menu, Plus, X } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../auth/AuthModal';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [navTone, setNavTone] = useState<'light' | 'dark'>('light');

  const productLinks = [
    { path: '/feed', label: 'Home', icon: Activity },
    { path: '/recommendations', label: 'Discover', icon: Compass },
    { path: '/diary', label: 'Diary', icon: BookOpen },
    { path: '/log', label: 'Add response', shortLabel: 'Add', icon: Plus },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setDemoError('');
  }, [location.pathname]);

  useEffect(() => {
    if (user || location.pathname !== '/') {
      setNavTone('light');
      return;
    }

    let frame = 0;
    const updateTone = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const sampleLine = Math.max(20, Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) * 0.5));
        const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-tone]'));
        const current = sections.find(section => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= sampleLine && bounds.bottom > sampleLine;
        });
        setNavTone(current?.dataset.navTone === 'dark' ? 'dark' : 'light');
      });
    };

    updateTone();
    window.addEventListener('scroll', updateTone, { passive: true });
    window.addEventListener('emotionflix:landing-scroll', updateTone);
    window.addEventListener('resize', updateTone);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateTone);
      window.removeEventListener('emotionflix:landing-scroll', updateTone);
      window.removeEventListener('resize', updateTone);
    };
  }, [location.pathname, user]);

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
      navigate('/feed');
    } catch {
      setDemoError('The demo account is unavailable right now. Try again shortly.');
    } finally {
      setDemoLoading(false);
    }
  };

  const activePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className={`app-shell${user ? ' app-shell--product' : ' app-shell--public'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>

      {user ? (
        <aside className="product-rail" aria-label="Application navigation">
          <Link aria-label="EmotionFlix home" className="product-rail__brand" to="/feed">EmotionFlix</Link>
          <nav className="product-rail__nav">
            {productLinks.map(link => {
              const Icon = link.icon;
              const active = activePath(link.path);
              return (
                <Link aria-current={active ? 'page' : undefined} className={`product-rail__link${active ? ' product-rail__link--active' : ''}`} key={link.path} to={link.path}>
                  <Icon aria-hidden="true" size={17} />
                  <span className="product-rail__label">{link.label}</span>
                  <span className="product-rail__short-label">{link.shortLabel || link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="product-rail__account">
            <Link className={`product-rail__profile${activePath('/profile') ? ' product-rail__profile--active' : ''}`} to="/profile">
              <span className="product-rail__avatar">{user.displayName.charAt(0).toUpperCase()}</span>
              <span><strong>{user.displayName}</strong><small>@{user.username}</small></span>
            </Link>
            <button aria-label="Sign out" className="product-rail__logout" onClick={logout} type="button"><LogOut size={16} /></button>
          </div>
        </aside>
      ) : (
        <header className={`nav-shell nav-shell--public nav-shell--tone-${navTone}`}>
          <div className="nav-inner">
            <Link aria-label="EmotionFlix home" className="brand-lockup" to="/"><span className="wordmark">EmotionFlix</span></Link>
            <div className="nav-actions">
              {!authLoading ? (
                <>
                  <button className="button button--quiet nav-sign-in" onClick={openAuth} type="button">Sign in</button>
                  <button className="button button--secondary nav-demo" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
                    {demoLoading && <LoaderCircle className="loading-icon" size={16} />}
                    {demoLoading ? 'Opening demo' : 'Enter demo'}
                  </button>
                </>
              ) : <span aria-label="Loading account" className="nav-auth-loading" />}
              <button aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} className="icon-button mobile-menu-button" onClick={() => setMobileOpen(open => !open)} type="button">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          {demoError && <p className="nav-status" role="alert">{demoError}</p>}
          {mobileOpen && (
            <nav aria-label="Mobile" className="mobile-sheet">
              <button className="nav-link" onClick={openAuth} type="button">Sign in</button>
              <button className="button button--secondary" disabled={demoLoading} onClick={() => void enterDemo()} type="button">{demoLoading ? 'Opening demo' : 'Enter demo'}</button>
            </nav>
          )}
        </header>
      )}

      <main id="main-content">
        <Outlet context={{ openAuth, enterDemo, demoLoading } satisfies LayoutOutletContext} />
      </main>

      {!user && (
        <footer className="footer">
          <div className="footer__inner">
            <div className="footer__credits">
              <a aria-label="Visit TMDB" className="tmdb-credit" href="https://www.themoviedb.org" rel="noreferrer" target="_blank">
                <img alt="TMDB" src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" />
              </a>
              <p>Non-commercial project. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            </div>
          </div>
        </footer>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Layout;
