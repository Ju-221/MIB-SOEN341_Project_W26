import { useHashNavigation } from './hooks/useHashNavigation'
import { SignIn, SignUp } from './components/Auth'
import './App.css'

function App() {
  const currentPage = useHashNavigation('signin')

  return currentPage === 'signin' ? <SignIn /> : <SignUp />
}

export default App
