/*# The following file was drafted originally, but enhanced with the assistance of Claude.
#Prompt example: If the user is not logged in, there should be no component in the navbar. I like how the Navbar is on top of the page but I want to be able to     
  change its background color, radius... and I am not able to do that right now   
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { useEffect, useRef, useState } from 'react';
import './Navbar.css';

interface NavbarProps {
  currentPage: string;
  isLoggedIn: boolean;
  userEmail: string | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

const NAV_LINKS = [
  { href: '#recipes', label: 'Recipes', page: 'recipes', authOnly: true },
  { href: '#calendar', label: 'Calendar', page: 'calendar', authOnly: true },
  { href: '#unique', label: 'Meal Tournament', page: 'unique', authOnly: true },
  { href: '#aichat', label: 'AI Chef ✦', page: 'aichat', authOnly: true },
];

function Navbar({ currentPage, isLoggedIn, userEmail, onLogout, onLoginClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const visibleLinks = NAV_LINKS.filter((l) => !l.authOnly || isLoggedIn);
  const closeMobile = () => setMobileOpen(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        {/* Brand – clicking navigates home */}
        <a href="#home" className="app-nav-brand" onClick={closeMobile}>
          MealMajor
        </a>

        {/* Desktop links – logged in only */}
        {isLoggedIn && (
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
        )}

        {/* Profile icon accordion + hamburger */}
        <div className="app-nav-actions">
          {/* Username label */}
          {isLoggedIn && userEmail && (
            <span className="app-nav-username">{userEmail.split('@')[0]}</span>
          )}
          {/* Profile dropdown */}
          <div className="app-nav-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className={`app-nav-profile-btn ${profileOpen ? 'open' : ''}`}
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={profileOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {profileOpen && (
              <div className="app-nav-profile-dropdown">
                {isLoggedIn ? (
                  <>
                    {userEmail && <span className="app-nav-dropdown-email">{userEmail}</span>}
                    <a
                      href="#profile"
                      className="app-nav-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile
                    </a>
                    <button
                      type="button"
                      className="app-nav-dropdown-item app-nav-dropdown-signout"
                      onClick={() => {
                        onLogout();
                        setProfileOpen(false);
                      }}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="app-nav-dropdown-item"
                    onClick={() => {
                      onLoginClick();
                      setProfileOpen(false);
                    }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>

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
        {isLoggedIn ? (
          <>
            <a href="#profile" className="app-nav-mobile-link" onClick={closeMobile}>
              Profile
            </a>
            <button
              type="button"
              className="app-nav-mobile-logout"
              onClick={() => {
                onLogout();
                closeMobile();
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            type="button"
            className="app-nav-mobile-logout"
            onClick={() => {
              onLoginClick();
              closeMobile();
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
