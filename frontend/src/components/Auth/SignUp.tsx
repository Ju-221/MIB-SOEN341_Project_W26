import { useState } from 'react'
import './SignUp.css'

interface SignUpProps {
  isModal?: boolean
  onSuccess?: () => void
  onSwitchToSignIn?: () => void
  onClose?: () => void
}

function SignUp({ isModal = false, onSuccess, onSwitchToSignIn, onClose }: SignUpProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
    } else {
      setErrors({})
      setLoading(true)

      try {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Signup failed')
        }

        localStorage.setItem('token', data.token)

        if (isModal && onSuccess) {
          onSuccess()
        } else {
          window.location.hash = '#home'
        }
      } catch (err) {
        setErrors({ general: err instanceof Error ? err.message : 'Signup failed' })
      } finally {
        setLoading(false)
      }
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSignInLink = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isModal && onSwitchToSignIn) {
      onSwitchToSignIn()
    } else {
      window.location.hash = '#signin'
    }
  }

  const cardContent = (
    <div className="signup-card">
      {isModal && onClose && (
        <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close">
          X
        </button>
      )}
      <div className="signup-header">
        <h1>MealMajor</h1>
      </div>

      <form onSubmit={handleCreateAccount} className="signup-form">
        {errors.general && <div className="error-message">{errors.general}</div>}

        <div className="form-group">
          <label htmlFor="signup-email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="signup-email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="signup-password">
            Password <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="signup-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={togglePasswordVisibility}
              aria-label="Toggle password visibility"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className="help-text">Must be at least 6 characters</span>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="signup-confirmPassword">
            Confirm Password <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="signup-confirmPassword"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={toggleConfirmPasswordVisibility}
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="create-account-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="signup-footer">
        <p>
          Already registered?{' '}
          <a
            href="#signin"
            onClick={handleSignInLink}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  )

  if (isModal) {
    return cardContent
  }

  return (
    <div className="signup-container">
      {cardContent}
    </div>
  )
}

export default SignUp
