import React, { useEffect, useState } from 'react';
import { Bell, BookOpen, House, LoaderCircle, Menu, Plus, Search, UserRound, UsersRound, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../auth/AuthModal';
import BrandMark from '../brand/BrandMark';
import './ProductShell.css';
import './JourneyShell.css';

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
  const { user, loading: authLoading, login } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  const productLinks = [
    { path: '/feed', label: 'Home', icon: House },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/people', label: 'People', icon: UsersRound },
    { path: '/activity', label: 'Activity', icon: Bell },
    { path: '/diary', label: 'Diary', icon: BookOpen },
    { path: '/log', label: 'Add a response', icon: Plus },
    { path: '/profile', label: 'Account', icon: UserRound },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setDemoError('');
  }, [location.pathname]);

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

  return (
    <div className={`app-shell${user ? ' app-shell--product' : ' app-shell--public'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>

      {user ? (
        <aside className="product-rail">
          <Link aria-label="Moodie home" className="product-rail__mark" to="/feed">
            <BrandMark />
          </Link>
          <nav aria-label="Main navigation" className="product-rail__nav">
            {productLinks.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  aria-label={link.label}
                  className={({ isActive }) => `product-rail__link${isActive ? ' product-rail__link--active' : ''}`}
                  key={link.path}
                  to={link.path}
                >
                  <span className="product-rail__icon"><Icon aria-hidden="true" size={20} strokeWidth={1.8} /></span>
                  <span className="product-rail__label">{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>
      ) : (
        <header className="nav-shell nav-shell--public nav-shell--steady">
          <div className="nav-inner">
            <Link aria-label="Moodie home" className="brand-lockup" to="/"><span className="wordmark">Moodie</span></Link>
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
