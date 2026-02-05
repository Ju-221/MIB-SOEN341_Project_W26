import { useState } from 'react'
import './SignIn.css'

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle sign in logic
    console.log('Sign in with:', { email, password })
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="signin-container">
      <button
        type="button"
        className="signin-nav-button"
        onClick={() => {
          window.location.hash = '#profile'
        }}
      >
        ← Profile
      </button>
      <div className="signin-card">
        <div className="signin-header">
          <h1>MealMajor</h1>
        </div>

        <form onSubmit={handleSignIn} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="signin-button">
            Sign In
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?{' '}
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault()
                window.location.hash = '#signup'
              }}
            >
              Create one now
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
