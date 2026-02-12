import { apiClient } from './client'
import type { ExerciseCreate, ExerciseOut, ExerciseUpdate } from '../types/workout'

const BASE = '/api/v1/admin/exercises'

export async function listExercises() {
  const { data } = await apiClient.get<ExerciseOut[]>(BASE)
  return data
}

export async function getExercise(exerciseId: number) {
  const { data } = await apiClient.get<ExerciseOut>(`${BASE}/${exerciseId}`)
  return data
}

export async function createExercise(payload: ExerciseCreate) {
  const { data } = await apiClient.post<ExerciseOut>(BASE, payload)
  return data
}

export async function updateExercise(exerciseId: number, payload: ExerciseUpdate) {
  const { data } = await apiClient.put<ExerciseOut>(`${BASE}/${exerciseId}`, payload)
  return data
}

export async function deleteExercise(exerciseId: number) {
  const { data } = await apiClient.delete<{ message: string }>(`${BASE}/${exerciseId}`)
  return data
}
