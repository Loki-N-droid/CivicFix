export type Category = {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export type AdminCategory = Category & {
  category_weight: number
  safety_weight: number
  updated_at: string
}

export type CategoryPayload = {
  name: string
  description: string | null
  category_weight: number
  safety_weight: number
}

export type CategoryUpdatePayload = Partial<CategoryPayload> & {
  is_active?: boolean
}
