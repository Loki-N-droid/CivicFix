export type UserRole = 'citizen' | 'admin'

export type User = {
  id: number
  email: string
  full_name: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  full_name: string
}

export type TokenResponse = {
  access_token: string
  user: User
}
