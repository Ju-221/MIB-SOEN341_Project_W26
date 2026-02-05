import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { useEffect } from 'react'
import './App.css'

function App() {
  const currentPage = useHashNavigation('signin')

  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null
  }

  // Redirect to signin if trying to access dashboard without authentication
  useEffect(() => {
    if (currentPage === 'dashboard' && !isAuthenticated()) {
      window.location.hash = '#signin'
    }
  }, [currentPage])

  // Render based on current page and authentication
  if (currentPage === 'dashboard') {
    if (!isAuthenticated()) {
      return <SignIn />
    }
    return <Dashboard />
  }

  return currentPage === 'signin' ? <SignIn /> : <SignUp />
}

export default App
