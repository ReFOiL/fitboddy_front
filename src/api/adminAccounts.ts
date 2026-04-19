import { apiClient } from './client'

export type AdminAccountOut = {
  id: number
  username: string
  is_superuser: boolean
  created_at: string
}

export async function listAdminAccounts(): Promise<AdminAccountOut[]> {
  const { data } = await apiClient.get<AdminAccountOut[]>('/admin/admin-accounts')
  return data
}

export async function createAdminAccount(payload: {
  username: string
  password: string
}): Promise<AdminAccountOut> {
  const { data } = await apiClient.post<AdminAccountOut>('/admin/admin-accounts', payload)
  return data
}

export async function updateAdminAccount(
  accountId: number,
  payload: { username?: string; password?: string },
): Promise<AdminAccountOut> {
  const { data } = await apiClient.patch<AdminAccountOut>(`/admin/admin-accounts/${accountId}`, payload)
  return data
}

export async function deleteAdminAccount(accountId: number): Promise<void> {
  await apiClient.delete(`/admin/admin-accounts/${accountId}`)
}
