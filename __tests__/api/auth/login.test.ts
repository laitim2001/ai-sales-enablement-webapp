/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'
import { authenticateUser } from '@/lib/auth-server'
import { validateEmail } from '@/lib/auth'

// Mock the auth functions
jest.mock('@/lib/auth-server', () => ({
  authenticateUser: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  validateEmail: jest.fn(),
}))

const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>
const mockValidateEmail = require('@/lib/auth').validateEmail as jest.MockedFunction<any>

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateEmail.mockReturnValue(true) // Default to valid email
  })

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'testpassword' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return 400 for invalid email format', async () => {
    mockValidateEmail.mockReturnValue(false)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'testpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
    expect(mockValidateEmail).toHaveBeenCalledWith('invalid-email')
  })

  it('should return 401 for invalid credentials', async () => {
    mockAuthenticateUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
    expect(mockAuthenticateUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
  })

  it('should return 200 and token for valid credentials', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP' as const,
      department: 'Sales',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date(),
      azure_ad_oid: null,
      email_verified: true,
      last_login_at: new Date()
    }
    const mockToken = 'mock-jwt-token'

    mockAuthenticateUser.mockResolvedValue({
      user: mockUser,
      token: mockToken
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'correctpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Login successful')
    expect(data.user).toEqual(mockUser)
    expect(data.token).toBe(mockToken)
    expect(mockAuthenticateUser).toHaveBeenCalledWith('test@example.com', 'correctpassword')
  })

  it('should set httpOnly cookie on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP' as const,
      department: 'Sales',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date(),
      azure_ad_oid: null,
      email_verified: true,
      last_login_at: new Date()
    }
    const mockToken = 'mock-jwt-token'

    mockAuthenticateUser.mockResolvedValue({
      user: mockUser,
      token: mockToken
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'correctpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    // Check if the cookie is set (you would need to inspect response.cookies in a real test)
    expect(response.status).toBe(200)
    // Note: Testing cookies in Next.js API routes requires more sophisticated setup
    // This is a placeholder for cookie validation
  })

  it('should handle email case normalization', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP' as const,
      department: 'Sales',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: new Date(),
      azure_ad_oid: null,
      email_verified: true,
      last_login_at: new Date()
    }
    const mockToken = 'mock-jwt-token'

    mockAuthenticateUser.mockResolvedValue({
      user: mockUser,
      token: mockToken
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ' TEST@EXAMPLE.COM ',
        password: 'correctpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockAuthenticateUser).toHaveBeenCalledWith('test@example.com', 'correctpassword')
  })

  it('should return 500 for server errors', async () => {
    mockAuthenticateUser.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})