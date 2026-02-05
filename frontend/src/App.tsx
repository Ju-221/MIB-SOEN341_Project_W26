import { useState, useEffect } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    // Check initial hash
    const hash = window.location.hash.slice(1)
    if (hash === 'signup') {
      setCurrentPage('signup')
    } else {
      setCurrentPage('signin')
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'signup') {
        setCurrentPage('signup')
      } else {
        setCurrentPage('signin')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return currentPage === 'signin' ? <SignIn /> : <SignUp />
}

export default App
