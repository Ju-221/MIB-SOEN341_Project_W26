import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import Profile from './components/Profile/Profile';

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
    if (currentPage === 'profile' && !isAuthenticated()) {
      window.location.hash = '#signin'
    }
  }, [currentPage])

  // Render based on current page and authentication
  
  
  if (currentPage == 'profile') {
    if (!isAuthenticated()) {
      return <SignIn />
    }
    return <Profile />
  }

  return currentPage === 'signin' ? <SignIn /> : <SignUp />
}

export default App
