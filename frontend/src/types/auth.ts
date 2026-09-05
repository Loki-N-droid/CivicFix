export type UserRole = 'citizen' | 'admin'

export type User = {
  id: number
  email: string
  name: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type TokenResponse = {
  access_token: string
  user: User
}