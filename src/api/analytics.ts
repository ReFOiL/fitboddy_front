import { apiClient } from './client'
import type { WorkoutAnalyticsSummaryOut } from '../types/analytics'

export type WorkoutAnalyticsFilters = {
  goal?: string
  level?: string
  workout_location?: string
  equipment?: string
}

export async function getWorkoutAnalyticsSummary(filters: WorkoutAnalyticsFilters = {}) {
  const { data } = await apiClient.get<WorkoutAnalyticsSummaryOut>('/admin/analytics/workouts/summary', {
    params: filters,
  })
  return data
}

