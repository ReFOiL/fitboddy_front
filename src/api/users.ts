import { apiClient } from './client'
import type { UserDetailOut, UserOut } from '../types/user'

export async function listUsers() {
  const { data } = await apiClient.get<UserOut[]>('/admin/users')
  return data
}

export async function getUser(userId: number) {
  const { data } = await apiClient.get<UserDetailOut>(`/admin/users/${userId}`)
  return data
}

