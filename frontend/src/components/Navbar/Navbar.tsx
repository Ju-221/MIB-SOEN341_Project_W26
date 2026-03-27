import './Navbar.css'

interface NavbarProps {
  currentPage: string
  isLoggedIn: boolean
  onLoginClick: () => void
  onLogout: () => void
  userEmail: string | null
}

function Navbar({ currentPage, isLoggedIn, onLoginClick, onLogout, userEmail }: NavbarProps) {
  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        <a href="#home" className="app-nav-brand">MealMajor</a>
        <div className="app-nav-links">
          <a
            href="#home"
            className={`app-nav-link ${currentPage === 'home' ? 'active' : ''}`}
          >
            Home
          </a>
       
          {isLoggedIn && (
            <a
              href="#calendar"
              className={`app-nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
            >
              Calendar
            </a>
          )}
          {isLoggedIn && (
            <a
              href="#profile"
              className={`app-nav-link ${currentPage === 'profile' ? 'active' : ''}`}
            >
              Profile
            </a>
          )}
           {isLoggedIn && (
            <a
              href="#unique"
              className={`app-nav-link ${currentPage === 'unique' ? 'active' : ''}`}
            >
              Unique
            </a>
          )}
          <a
            href="#aichat"
            className={`app-nav-link ${currentPage === 'aichat' ? 'active' : ''}`}
          >
            Recipe Generation
          </a>
        </div>
        <div className="app-nav-actions">
          {isLoggedIn ? (
            <div className="app-nav-user-area">
              <span className="app-nav-user-email">{userEmail}</span>
              <button
                type="button"
                className="app-nav-button logout"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="app-nav-button login"
              onClick={onLoginClick}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
