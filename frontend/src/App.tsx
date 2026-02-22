import { useState, useCallback } from 'react'
import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import Profile from './components/Profile/Profile'
import Homepage from './components/Homepage/Homepage'
import Navbar from './components/Navbar/Navbar'
import './App.css'

function App() {
  const currentPage = useHashNavigation('home')

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('token') !== null
  })

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email || null
    } catch {
      return null
    }
  })

  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null)

  const handleAuthSuccess = useCallback(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserEmail(payload.email || null)
      } catch {
        setUserEmail(null)
      }
    }
    setShowAuthModal(null)
    window.location.hash = '#home'
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    setIsLoggedIn(false)
    setUserEmail(null)
    window.location.hash = '#home'
  }, [])

  const openLoginModal = useCallback(() => {
    setShowAuthModal('signin')
  }, [])

  const closeModal = useCallback(() => {
    setShowAuthModal(null)
  }, [])

  // Redirect unauthenticated users away from profile
  if (currentPage === 'profile' && !isLoggedIn) {
    window.location.hash = '#home'
    return null
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile':
        return <Profile />
      case 'signin':
        return <SignIn onSuccess={handleAuthSuccess} />
      case 'signup':
        return <SignUp onSuccess={handleAuthSuccess} />
      default:
        return <Homepage isLoggedIn={isLoggedIn} userEmail={userEmail} />
    }
  }

  return (
    <div className="app-layout">
      <Navbar
        currentPage={currentPage}
        isLoggedIn={isLoggedIn}
        onLoginClick={openLoginModal}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      <div className="app-page-content">
        {renderPage()}
      </div>

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}>
          {showAuthModal === 'signin' ? (
            <SignIn
              isModal
              onSuccess={handleAuthSuccess}
              onSwitchToSignUp={() => setShowAuthModal('signup')}
              onClose={closeModal}
            />
          ) : (
            <SignUp
              isModal
              onSuccess={handleAuthSuccess}
              onSwitchToSignIn={() => setShowAuthModal('signin')}
              onClose={closeModal}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
