import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignIn from './SignIn'

describe('SignIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Button Tests', () => {
    it('renders sign in button', () => {
      render(<SignIn />)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      expect(signInButton).toBeInTheDocument()
    })

    it('sign in button is enabled by default', () => {
      render(<SignIn />)
      const signInButton = screen.getByRole('button', { name: /sign in/i })
      expect(signInButton).not.toBeDisabled()
    })

    it('disables sign in button during loading', async () => {
      const mockFetch = vi.fn(() =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ token: 'test-token', user: { email: 'test@test.com' } }),
              } as Response),
            100
          )
        )
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any

      render(<SignIn />)
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'test@test.com')
      await userEvent.type(passwordInput, 'password123')
      
      // Click the button
      await userEvent.click(signInButton)
      
      // Button should be disabled during loading
      await waitFor(() => {
        expect(signInButton).toBeDisabled()
      })
    })

    it('toggle password visibility button works', async () => {
      render(<SignIn />)
      
      const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password')
      expect(toggleButton).toBeInTheDocument()

      // Click toggle button
      await userEvent.click(toggleButton)
      
      // Password should now be visible
      expect(passwordInput.type).toBe('text')

      // Click again to hide
      await userEvent.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })

    it('creates account link button works', async () => {
      const onSwitchToSignUp = vi.fn()
      render(<SignIn onSwitchToSignUp={onSwitchToSignUp} />)
      
      const createAccountLink = screen.getByText(/create one now/i)
      expect(createAccountLink).toBeInTheDocument()
      
      // Note: Can't use fireEvent here, using userEvent instead
      await userEvent.click(createAccountLink)
      expect(onSwitchToSignUp).toHaveBeenCalled()
    })

    it('remember me checkbox toggles correctly', async () => {
      render(<SignIn />)
      
      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i }) as HTMLInputElement
      expect(rememberCheckbox).toBeInTheDocument()
      expect(rememberCheckbox.checked).toBe(false)

      await userEvent.click(rememberCheckbox)
      expect(rememberCheckbox.checked).toBe(true)

      await userEvent.click(rememberCheckbox)
      expect(rememberCheckbox.checked).toBe(false)
    })

    it('sign in button submits form with valid credentials', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token', user: { email: 'test@test.com' } }),
        })
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any

      const onSuccess = vi.fn()
      render(<SignIn onSuccess={onSuccess} />)
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'test@test.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(signInButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/auth/signin',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
          })
        )
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('displays error when sign in fails', async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        })
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = mockFetch as any

      render(<SignIn />)
      
      const emailInput = screen.getByPlaceholderText(/enter your email/i)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'wrong@test.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      await userEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })
})
