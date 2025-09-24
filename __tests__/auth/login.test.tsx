/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'
import { useAuth } from '@/hooks/use-auth'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))

// Mock auth validation functions
jest.mock('@/lib/auth', () => ({
  validateEmail: jest.fn((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }),
}))

const mockPush = jest.fn()
const mockLogin = jest.fn()

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    })
  })

  it('should render login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByText('歡迎回來')).toBeInTheDocument()
    expect(screen.getByText('登入您的 AI 銷售賦能平台帳戶')).toBeInTheDocument()
    expect(screen.getByLabelText('電子郵件')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument()
  })

  it('should show validation errors for empty form submission', async () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: '登入' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('請輸入電子郵件')).toBeInTheDocument()
      expect(screen.getByText('請輸入密碼')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should show email validation error for invalid email', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const submitButton = screen.getByRole('button', { name: '登入' })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('請輸入有效的電子郵件格式')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('should submit form with valid credentials', async () => {
    mockLogin.mockResolvedValue({
      success: true,
      data: { user: { id: 1, email: 'test@example.com' }, token: 'mock-token' }
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登入' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle login failure with error message', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      error: {
        statusCode: 401,
        message: 'Invalid credentials'
      }
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登入' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    })

    await waitFor(() => {
      expect(screen.getByText('電子郵件或密碼錯誤')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should toggle password visibility', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('密碼') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' })

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')

    // Click toggle button to show password
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    // Click again to hide password
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('should clear field errors when typing', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const submitButton = screen.getByRole('button', { name: '登入' })

    // First submit to show error
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('請輸入電子郵件')).toBeInTheDocument()
    })

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 't' } })

    await waitFor(() => {
      expect(screen.queryByText('請輸入電子郵件')).not.toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve
    })
    mockLogin.mockReturnValue(loginPromise)

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登入' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('登入中...')).toBeInTheDocument()
    })
    expect(submitButton).toBeDisabled()

    // Resolve login
    resolveLogin!({
      success: true,
      data: { user: { id: 1 }, token: 'token' }
    })

    await waitFor(() => {
      expect(screen.queryByText('登入中...')).not.toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText('電子郵件')
    const passwordInput = screen.getByLabelText('密碼')
    const submitButton = screen.getByRole('button', { name: '登入' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('網路錯誤，請檢查您的網路連線')).toBeInTheDocument()
    })
  })

  it('should have proper navigation links', () => {
    render(<LoginPage />)

    expect(screen.getByText('立即註冊')).toBeInTheDocument()
    expect(screen.getByText('忘記密碼？')).toBeInTheDocument()
    expect(screen.getByText('服務條款')).toBeInTheDocument()
    expect(screen.getByText('隱私政策')).toBeInTheDocument()
  })
})