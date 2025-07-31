/**
 * LAYOUT COMPONENT
 *   Main application layout with navigation
 */

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import AuthModal from '../auth/AuthModal';

/**
 * NAME
 *   Layout - Main application layout wrapper
 *
 * DESCRIPTION
 *   Provides consistent navigation and layout structure across
 *   all application pages. Includes header with navigation links
 *   and renders child routes via Outlet.
 */
const Layout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
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
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-xl border-b sticky top-0 z-50 transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-gray-800/95 via-slate-800/95 to-gray-800/95 border-gray-700/50 shadow-lg shadow-black/20'
          : 'bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 border-gray-300/50 shadow-lg shadow-gray-900/10'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-700 to-slate-700 text-gray-200 shadow-black/30 group-hover:from-gray-600 group-hover:to-slate-600'
                    : 'bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-gray-400/30 group-hover:from-gray-700 group-hover:to-gray-800'
                }`}>
                  <i className="fas fa-film text-xl"></i>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold tracking-tight ${
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  EmotionFlix
                </span>
                <span className={`text-xs font-medium tracking-wide ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
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
                        : theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {location.pathname === link.path && (
                      <div className={`absolute inset-0 rounded-2xl ${
                        theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-slate-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'
                      }`}></div>
                    )}
                    {location.pathname !== link.path && (
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-r from-slate-800/50 to-gray-800/50' 
                          : 'bg-gradient-to-r from-gray-200/50 to-gray-300/50'
                      }`}></div>
                    )}
                    <i className={`${link.icon} text-base relative z-10`}></i>
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`group p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-gray-100 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-300/50'
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                  theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-400/20'
                }`}></div>
                <i className={`${theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} text-base relative z-10 group-hover:scale-110 transition-transform duration-300`}></i>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`md:hidden group p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-300/50'
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                  theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-400/20'
                }`}></div>
                <i className={`${showMobileMenu ? 'fas fa-times' : 'fas fa-bars'} text-base relative z-10 transition-transform duration-300`}></i>
              </button>

              {/* User Profile / Auth */}
              {user ? (
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`group w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-200 shadow-black/30'
                        : 'bg-gray-600 text-white shadow-gray-400/30'
                    } ${
                      showProfileDropdown 
                        ? 'ring-2 ring-gray-400/50 scale-95' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-700'
                    }`}></div>
                    <span className="text-white font-bold relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-xl border backdrop-blur-xl z-50 animate-scale-in ${
                      theme === 'dark'
                        ? 'bg-slate-900/90 border-slate-700/50 shadow-black/20'
                        : 'bg-white/90 border-gray-200/50 shadow-gray-900/10'
                    }`}>
                      <div className="py-3">
                        <div className="px-5 py-3 border-b border-gray-200/20">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {user.displayName}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 group ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                          }`}
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <i className="fas fa-user-circle group-hover:scale-110 transition-transform duration-200"></i>
                          Profile
                        </Link>
                        <hr className={`my-2 mx-3 ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`} />
                        <button
                          className={`flex items-center gap-3 px-5 py-3 text-sm font-medium w-full text-left transition-all duration-200 group ${
                            theme === 'dark'
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50/50'
                          }`}
                          onClick={() => {
                            logout();
                            setShowProfileDropdown(false);
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
                  className={`px-6 py-3 text-white font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className={`md:hidden mt-4 rounded-2xl border backdrop-blur-xl animate-slide-up ${
              theme === 'dark'
                ? 'bg-slate-900/90 border-slate-700/50'
                : 'bg-white/90 border-gray-200/50'
            }`}>
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
                          ? theme === 'dark' 
                            ? 'text-white bg-gray-700 mx-3 rounded-xl'
                            : 'text-white bg-gray-600 mx-3 rounded-xl'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800/50 mx-3 rounded-xl'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 mx-3 rounded-xl'
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
      <footer className={`backdrop-blur-xl border-t mt-auto transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-950/50 border-slate-800/50'
          : 'bg-white/50 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-600 text-white'
              }`}>
                <i className="fas fa-film text-sm"></i>
              </div>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                EmotionFlix - Emotion-Driven Movie Discovery
              </span>
            </div>
            <div className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              © 2024 EmotionFlix. All rights reserved.
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