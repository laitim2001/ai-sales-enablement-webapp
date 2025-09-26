/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@prisma/client')
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
} as any

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockJWT = require('jsonwebtoken')

// Mock PrismaClient constructor
;(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma)

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBcrypt.hash.mockResolvedValue('hashed-password' as any)
    mockJWT.sign.mockReturnValue('mock-jwt-token')
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        // missing password, first_name, last_name
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('should return 400 for weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123', // Too weak
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password must be at least 8 characters long')
  })

  it('should return 409 if user already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('User already exists')
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    })
  })

  it('should create user successfully with valid data', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP',
      created_at: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('User created successfully')
    expect(data.user).toBeDefined()
    expect(data.token).toBe('mock-jwt-token')

    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'SALES_REP',
      }
    })
  })

  it('should handle optional fields correctly', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_MANAGER',
      department: 'Sales',
      created_at: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'SALES_MANAGER',
        department: 'Sales'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'SALES_MANAGER',
        department: 'Sales',
      }
    })
  })

  it('should normalize email to lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP',
      created_at: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: ' TEST@EXAMPLE.COM ',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' }
    })
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
      })
    })
  })

  it('should return 500 for database errors', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should not return sensitive data in user object', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'should-not-be-returned',
      first_name: 'John',
      last_name: 'Doe',
      role: 'SALES_REP',
      created_at: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user).toBeDefined()
    expect(data.user.password_hash).toBeUndefined()
  })
})