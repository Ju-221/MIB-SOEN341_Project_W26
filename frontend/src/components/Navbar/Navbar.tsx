import { useState } from 'react';
import './Navbar.css';

interface NavbarProps {
  currentPage: string;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  userEmail: string | null;
}

const NAV_LINKS = [
  { href: '#home', label: 'Home', page: 'home', authOnly: false },
  { href: '#calendar', label: 'Calendar', page: 'calendar', authOnly: true },
  { href: '#profile', label: 'Profile', page: 'profile', authOnly: true },
  { href: '#unique', label: 'Discover', page: 'unique', authOnly: true },
  { href: '#aichat', label: 'AI Chef', page: 'aichat', authOnly: false },
];

function Navbar({ currentPage, isLoggedIn, onLoginClick, onLogout, userEmail }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter((l) => !l.authOnly || isLoggedIn);

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        {/* Brand */}
        <a href="#home" className="app-nav-brand" onClick={closeMobile}>
          <svg className="app-nav-brand-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
              fill="#4caf50"
              opacity=".15"
            />
            <path d="M17 8c0 0-1.5 1-3 1s-3-1-3-1-1.5 4 3 6c4.5-2 3-6 3-6z" fill="#4caf50" />
            <path d="M7 11c0 0 1 5 5 7" stroke="#4caf50" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          MealMajor
        </a>

        {/* Desktop links */}
        <div className="app-nav-links">
          {visibleLinks.map((link) => (
            <a
              key={link.page}
              href={link.href}
              className={`app-nav-link ${currentPage === link.page ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions + hamburger */}
        <div className="app-nav-actions">
          {isLoggedIn ? (
            <div className="app-nav-user-area">
              <span className="app-nav-user-email">{userEmail}</span>
              <button type="button" className="app-nav-button logout" onClick={onLogout}>
                Log Out
              </button>
            </div>
          ) : (
            <button type="button" className="app-nav-button login" onClick={onLoginClick}>
              Sign In
            </button>
          )}

          {/* Hamburger – mobile only */}
          <button
            type="button"
            className={`app-nav-hamburger ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className={`app-nav-mobile ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
        {visibleLinks.map((link) => (
          <a
            key={link.page}
            href={link.href}
            className={`app-nav-mobile-link ${currentPage === link.page ? 'active' : ''}`}
            onClick={closeMobile}
          >
            {link.label}
          </a>
        ))}
        {isLoggedIn && (
          <button
            type="button"
            className="app-nav-mobile-logout"
            onClick={() => {
              onLogout();
              closeMobile();
            }}
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
