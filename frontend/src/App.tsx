import { useState, useCallback, useEffect } from 'react'
import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import Profile from './components/Profile/Profile'
import Homepage from './components/Homepage/Homepage'
import Navbar from './components/Navbar/Navbar'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import './App.css'

function App() {
  const currentPage = useHashNavigation('signin')

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('token') !== null
  })

  const [isLoading, setIsLoading] = useState(false)

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    const token = localStorage.getItem('token')
    if (!token) return localStorage.getItem('userEmail')
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email || localStorage.getItem('userEmail')
    } catch {
      return localStorage.getItem('userEmail')
    }
  })

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleAuthSuccess = useCallback(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      setIsLoading(true)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserEmail(payload.email || localStorage.getItem('userEmail'))
      } catch {
        setUserEmail(localStorage.getItem('userEmail'))
      }
    }
    window.location.hash = '#home'
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    setIsLoggedIn(false)
    setUserEmail(null)
    window.location.hash = '#signin'
  }, [])

  const openLoginModal = useCallback(() => {
    window.location.hash = '#signin'
  }, [])

  // Redirect unauthenticated users to sign in
  useEffect(() => {
    if (!isLoggedIn && currentPage !== 'signin' && currentPage !== 'signup') {
      window.location.hash = '#signin'
    }
  }, [isLoggedIn, currentPage])

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

  if (isLoading) {
    return <LoadingScreen onReady={handleLoadingComplete} />
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
    </div>
  )
}

export default App
