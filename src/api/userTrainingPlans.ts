import { apiClient } from './client'
import type {
  ReplaceSessionExercisesIn,
  ScheduledWorkoutOut,
  ScheduledWorkoutUpdate,
  TrainingPlanListItemOut,
  TrainingPlanOut,
  TrainingPlanUpdate,
} from '../types/trainingPlan'

function userBase(userId: number) {
  return `/admin/users/${userId}`
}

export async function getActiveTrainingPlan(userId: number) {
  const { data } = await apiClient.get<TrainingPlanOut | null>(`${userBase(userId)}/training-plan`)
  return data
}

export async function listUserTrainingPlans(userId: number) {
  const { data } = await apiClient.get<TrainingPlanListItemOut[]>(`${userBase(userId)}/training-plans`)
  return data
}

export async function getUserTrainingPlan(userId: number, planId: number) {
  const { data } = await apiClient.get<TrainingPlanOut>(`${userBase(userId)}/training-plans/${planId}`)
  return data
}

export async function updateUserTrainingPlan(userId: number, planId: number, payload: TrainingPlanUpdate) {
  const { data } = await apiClient.put<TrainingPlanOut>(
    `${userBase(userId)}/training-plans/${planId}`,
    payload,
  )
  return data
}

export async function updateScheduledWorkout(
  userId: number,
  scheduledId: number,
  payload: ScheduledWorkoutUpdate,
) {
  const { data } = await apiClient.put<ScheduledWorkoutOut>(
    `${userBase(userId)}/scheduled-workouts/${scheduledId}`,
    payload,
  )
  return data
}

export async function replaceSessionExercises(
  userId: number,
  scheduledId: number,
  payload: ReplaceSessionExercisesIn,
) {
  const { data } = await apiClient.put<ScheduledWorkoutOut>(
    `${userBase(userId)}/scheduled-workouts/${scheduledId}/session-exercises`,
    payload,
  )
  return data
}
