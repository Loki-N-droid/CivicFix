import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  createCategory,
  fetchAdminCategories,
  updateCategory,
} from '../../services/categories'
import type {
  AdminCategory,
  CategoryPayload,
  CategoryUpdatePayload,
} from '../../types/category'

const EMPTY_FORM: CategoryPayload = {
  name: '',
  description: '',
  category_weight: 0,
  safety_weight: 0,
}

function errorMessage(error: unknown, fallback: string) {
  return isAxiosError(error) && typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : fallback
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: AdminCategory
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CategoryPayload>(() =>
    category
      ? {
          name: category.name,
          description: category.description ?? '',
          category_weight: category.category_weight,
          safety_weight: category.safety_weight,
        }
      : EMPTY_FORM,
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CategoryUpdatePayload = {
        ...form,
        description: form.description?.trim() || null,
      }
      return category ? updateCategory(category.id, payload) : createCategory(payload as CategoryPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      onDone()
    },
    onError: (mutationError) => setError(errorMessage(mutationError, 'Unable to save this category.')),
  })

  function setField<K extends keyof CategoryPayload>(field: K, value: CategoryPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (form.name.trim().length < 2) {
      setError('Category name must be at least 2 characters.')
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
      <h2 className="text-sm font-semibold text-slate-800">{category ? 'Edit category' : 'Add category'}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Name
          <input value={form.name} onChange={(e) => setField('name', e.target.value)} maxLength={100} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Description
          <input value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} maxLength={255} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Category weight (0–100)
          <input type="number" min={0} max={100} value={form.category_weight} onChange={(e) => setField('category_weight', Number(e.target.value))} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Safety weight (0–100)
          <input type="number" min={0} max={100} value={form.safety_weight} onChange={(e) => setField('safety_weight', Number(e.target.value))} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none" />
        </label>
      </div>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">{mutation.isPending ? 'Saving…' : category ? 'Save changes' : 'Create category'}</button>
        <button type="button" onClick={onDone} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
      </div>
    </form>
  )
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchAdminCategories,
  })
  const toggleMutation = useMutation({
    mutationFn: (category: AdminCategory) => updateCategory(category.id, { is_active: !category.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
    onError: (mutationError) => setError(errorMessage(mutationError, 'Unable to update category status.')),
  })

  function closeForm() {
    setEditing(null)
    setShowCreate(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Manage issue categories and their priority weights.</p>
        </div>
        {!showCreate && !editing ? <button type="button" onClick={() => setShowCreate(true)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Add category</button> : null}
      </div>

      {showCreate ? <CategoryForm onDone={closeForm} /> : null}
      {editing ? <CategoryForm category={editing} onDone={closeForm} /> : null}
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <p className="p-5 text-sm text-slate-500">Loading categories…</p> : categories?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Category</th><th className="px-5 py-3">Weights</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => <tr key={category.id} className="align-top">
                  <td className="px-5 py-4"><p className="font-medium text-slate-900">{category.name}</p><p className="mt-1 max-w-md text-xs text-slate-500">{category.description || 'No description'}</p></td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">Category {category.category_weight} · Safety {category.safety_weight}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${category.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{category.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="whitespace-nowrap px-5 py-4 text-right"><button type="button" onClick={() => { setEditing(category); setShowCreate(false) }} className="mr-3 text-xs font-medium text-teal-700 hover:text-teal-900">Edit</button><button type="button" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate(category)} className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50">{category.is_active ? 'Deactivate' : 'Activate'}</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        ) : <p className="p-5 text-sm text-slate-500">No categories found.</p>}
      </div>
    </div>
  )
}
