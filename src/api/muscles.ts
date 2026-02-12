import { apiClient } from './client'
import type { MuscleOut } from '../types/workout'

const BASE = '/api/v1/admin/muscles'

export async function listMuscles() {
  const { data } = await apiClient.get<MuscleOut[]>(BASE)
  return data
}
