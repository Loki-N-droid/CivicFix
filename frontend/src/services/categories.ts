import api from './api'
import type {
  AdminCategory,
  Category,
  CategoryPayload,
  CategoryUpdatePayload,
} from '../types/category'

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/api/v1/categories/')
  return data
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const { data } = await api.get<AdminCategory[]>('/api/v1/categories/admin')
  return data
}

export async function createCategory(payload: CategoryPayload): Promise<AdminCategory> {
  const { data } = await api.post<AdminCategory>('/api/v1/categories/admin', payload)
  return data
}

export async function updateCategory(
  categoryId: number,
  payload: CategoryUpdatePayload,
): Promise<AdminCategory> {
  const { data } = await api.patch<AdminCategory>(`/api/v1/categories/admin/${categoryId}`, payload)
  return data
}
