import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import { Profile } from './components/Profile'
import './App.css'

function App() {
  const currentPage = useHashNavigation('signin')

  if (currentPage === 'profile') {
    return <Profile />
  }

  return currentPage === 'signin' ? <SignIn /> : <SignUp />
}

export default App
