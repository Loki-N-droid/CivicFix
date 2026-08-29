import api from './api'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types/auth'

const TOKEN_KEY = 'access_token'

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/api/v1/auth/login', payload)
  localStorage.setItem(TOKEN_KEY, data.access_token)
  return data
}

export async function register(payload: RegisterRequest): Promise<void> {
  await api.post('/api/v1/auth/register', payload)
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/api/v1/auth/me')
  return data
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
