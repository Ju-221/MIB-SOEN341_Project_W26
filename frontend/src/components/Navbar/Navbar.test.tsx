import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './Navbar'

describe('Navbar Component', () => {
  const mockOnLoginClick = vi.fn()
  const mockOnLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Button Tests', () => {
    it('renders login button when not logged in', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={false}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={null}
        />
      )
      
      const loginButton = screen.getByRole('button', { name: /sign in/i })
      expect(loginButton).toBeInTheDocument()
    })

    it('login button is clickable', async () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={false}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={null}
        />
      )

      const loginButton = screen.getByRole('button', { name: /sign in/i })
      await userEvent.click(loginButton)
      
      expect(mockOnLoginClick).toHaveBeenCalledTimes(1)
    })

    it('renders logout button when logged in', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={true}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail="test@test.com"
        />
      )
      
      const logoutButton = screen.getByRole('button', { name: /log out/i })
      expect(logoutButton).toBeInTheDocument()
    })

    it('logout button is clickable', async () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={true}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail="test@test.com"
        />
      )
      
      const logoutButton = screen.getByRole('button', { name: /log out/i })
      await userEvent.click(logoutButton)
      
      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })

    it('displays user email when logged in', () => {
      const testEmail = 'user@example.com'
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={true}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={testEmail}
        />
      )
      
      expect(screen.getByText(testEmail)).toBeInTheDocument()
    })

    it('does not display logout button when not logged in', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={false}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={null}
        />
      )
      
      const logoutButton = screen.queryByRole('button', { name: /log out/i })
      expect(logoutButton).not.toBeInTheDocument()
    })

    it('does not display login button when logged in', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={true}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail="test@test.com"
        />
      )
      
      const loginButton = screen.queryByRole('button', { name: /sign in/i })
      expect(loginButton).not.toBeInTheDocument()
    })

    it('home link is clickable', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={false}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={null}
        />
      )
      
      const homeLink = screen.getByRole('link', { name: /home/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '#home')
    })

    it('profile link appears when logged in', () => {
      render(
        <Navbar
          currentPage="profile"
          isLoggedIn={true}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail="test@test.com"
        />
      )
      
      const profileLink = screen.getByRole('link', { name: /profile/i })
      expect(profileLink).toBeInTheDocument()
      expect(profileLink).toHaveAttribute('href', '#profile')
    })

    it('profile link does not appear when not logged in', () => {
      render(
        <Navbar
          currentPage="home"
          isLoggedIn={false}
          onLoginClick={mockOnLoginClick}
          onLogout={mockOnLogout}
          userEmail={null}
        />
      )
      
      const profileLink = screen.queryByRole('link', { name: /profile/i })
      expect(profileLink).not.toBeInTheDocument()
    })
  })
})
