/**
 * Layout Component
 * 
 * Main application layout wrapper providing consistent navigation and structure.
 * Includes responsive header with navigation links, user authentication state,
 * mobile menu support, and renders child routes through React Router's Outlet.
 */

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../auth/AuthModal';

/**
 * Layout component that wraps all application pages with consistent navigation.
 * Provides header, footer, navigation menu, and authentication modal management.
 */
const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useUser();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: 'fas fa-home' },
    { path: '/profile', label: 'Profile', icon: 'fas fa-user' },
    { path: '/log', label: 'Log', icon: 'fas fa-heart' },
    { path: '/recommendations', label: 'Recommendations', icon: 'fas fa-star' },
  ];

  return (
    <div className="min-h-screen bg-charcoal-50 text-charcoal-900">
      {/* Header */}
      <header className="backdrop-blur-xl border-b sticky top-0 z-50 transition-all duration-300 bg-white/95 border-charcoal-200/60 shadow-hard">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-cinema transition-all duration-300 group-hover:scale-105 bg-cinema-600 text-white group-hover:bg-cinema-700">
                  <i className="fas fa-film text-xl"></i>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight font-heading text-charcoal-900">
                  EmotionFlix
                </span>
                <span className="text-xs font-medium tracking-wide text-charcoal-500">
                  Emotion-Driven Discovery
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => {
                const handleClick = (e: React.MouseEvent) => {
                  if (!user && (link.path === '/profile' || link.path === '/log')) {
                    e.preventDefault();
                    setShowAuthModal(true);
                  }
                };
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={handleClick}
                    className={`group flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                      location.pathname === link.path
                        ? 'text-white'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    {location.pathname === link.path && (
                      <div className="absolute inset-0 rounded-2xl bg-cinema-600"></div>
                    )}
                    {location.pathname !== link.path && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-charcoal-200/60"></div>
                    )}
                    <i className={`${link.icon} text-base relative z-10`}></i>
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden group p-3 rounded-2xl transition-all duration-300 relative overflow-hidden text-charcoal-600 hover:text-charcoal-900 bg-charcoal-100/60 hover:bg-charcoal-200/60"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-charcoal-300/30"></div>
                <i className={`${showMobileMenu ? 'fas fa-times' : 'fas fa-bars'} text-base relative z-10 transition-transform duration-300`}></i>
              </button>

              {/* User Profile / Auth */}
              {user ? (
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`group w-12 h-12 rounded-2xl flex items-center justify-center shadow-cinema transition-all duration-300 relative overflow-hidden bg-cinema-600 text-white ${
                      showProfileDropdown 
                        ? 'ring-2 ring-gray-400/50 scale-95' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-cinema-700"></div>
                    <span className="text-white font-bold relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-hard border backdrop-blur-xl z-50 animate-scale-in bg-white/95 border-charcoal-200/60">
                      <div className="py-3">
                        <div className="px-5 py-3 border-b border-gray-200/20">
                          <p className="font-semibold text-charcoal-900">
                            {user.displayName}
                          </p>
                          <p className="text-sm text-charcoal-600">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 group text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100/60"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <i className="fas fa-user-circle group-hover:scale-110 transition-transform duration-200"></i>
                          Profile
                        </Link>
                        <hr className="my-2 mx-3 border-charcoal-200/60" />
                        <button
                          className="flex items-center gap-3 px-5 py-3 text-sm font-medium w-full text-left transition-all duration-200 group text-red-600 hover:text-red-700 hover:bg-red-50/50"
                          onClick={() => {
                            setShowProfileDropdown(false);
                            logout();
                          }}
                        >
                          <i className="fas fa-sign-out-alt group-hover:scale-110 transition-transform duration-200"></i>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 text-white font-semibold rounded-2xl transition-all duration-200 hover:shadow-cinema hover:scale-105 bg-cinema-600 hover:bg-cinema-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 rounded-2xl border backdrop-blur-xl animate-slide-up bg-white/95 border-charcoal-200/60">
              <nav className="py-4">
                {navLinks.map((link) => {
                  const handleClick = (e: React.MouseEvent) => {
                    setShowMobileMenu(false);
                    if (!user && (link.path === '/profile' || link.path === '/log')) {
                      e.preventDefault();
                      setShowAuthModal(true);
                    }
                  };
                  
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-4 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                        location.pathname === link.path
                          ? 'text-white bg-cinema-600 mx-3 rounded-xl'
                          : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100/60 mx-3 rounded-xl'
                      }`}
                      onClick={handleClick}
                    >
                      <i className={`${link.icon} text-base`}></i>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 min-h-[calc(100vh-160px)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-xl border-t mt-auto transition-all duration-300 bg-white/60 border-charcoal-200/60">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-cinema-600 text-white">
                <i className="fas fa-film text-sm"></i>
              </div>
              <span className="text-sm font-medium text-charcoal-600">
                EmotionFlix - Emotion-Driven Movie Discovery
              </span>
            </div>
            <div className="text-xs font-medium text-charcoal-400">
              © 2025 EmotionFlix | 
              <span className="ml-1">
                Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="hover:underline">TMDB</a> & 
                <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer" className="hover:underline ml-1">Font Awesome</a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default Layout;