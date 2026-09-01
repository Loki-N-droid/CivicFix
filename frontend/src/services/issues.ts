import api from './api'
import type {
  AdminIssueListParams,
  CreateIssuePayload,
  DashboardStats,
  Issue,
  IssueAdminDetail,
  IssueListResponse,
} from '../types/issue'

export async function createIssue(payload: CreateIssuePayload): Promise<Issue> {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('description', payload.description)
  form.append('category_id', String(payload.category_id))
  form.append('citizen_severity', payload.citizen_severity)
  form.append('latitude', String(payload.latitude))
  form.append('longitude', String(payload.longitude))

  const address = payload.address?.trim()
  if (address) {
    form.append('address', address)
  }

  for (const image of payload.images) {
    form.append('images', image)
  }

  const { data } = await api.post<Issue>('/api/v1/issues/', form)
  return data
}

// --- Admin ---

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/v1/issues/admin/stats')
  return data
}

export async function fetchAdminIssues(
  params: AdminIssueListParams,
): Promise<IssueListResponse> {
  const { data } = await api.get<IssueListResponse>('/api/v1/issues/admin/list', {
    params,
  })
  return data
}

export async function fetchAdminIssueDetail(issueId: number): Promise<IssueAdminDetail> {
  const { data } = await api.get<IssueAdminDetail>(`/api/v1/issues/admin/${issueId}`)
  return data
}
