import { apiClient } from './client'
import type {
  WorkoutTemplateCreate,
  WorkoutTemplateOut,
  WorkoutTemplateUpdate,
} from '../types/workout'

const BASE = '/api/v1/admin/workout-templates'

export async function listWorkoutTemplates() {
  const { data } = await apiClient.get<WorkoutTemplateOut[]>(BASE)
  return data
}

export async function getWorkoutTemplate(templateId: number) {
  const { data } = await apiClient.get<WorkoutTemplateOut>(`${BASE}/${templateId}`)
  return data
}

export async function createWorkoutTemplate(payload: WorkoutTemplateCreate) {
  const { data } = await apiClient.post<WorkoutTemplateOut>(BASE, payload)
  return data
}

export async function updateWorkoutTemplate(
  templateId: number,
  payload: WorkoutTemplateUpdate
) {
  const { data } = await apiClient.put<WorkoutTemplateOut>(`${BASE}/${templateId}`, payload)
  return data
}

export async function updateWorkoutExercisesOrder(
  templateId: number,
  exerciseIds: number[]
) {
  const { data } = await apiClient.put<WorkoutTemplateOut>(
    `${BASE}/${templateId}/exercises/order`,
    { exercise_ids: exerciseIds }
  )
  return data
}

export async function deleteWorkoutTemplate(templateId: number) {
  const { data } = await apiClient.delete<{ message: string }>(`${BASE}/${templateId}`)
  return data
}
