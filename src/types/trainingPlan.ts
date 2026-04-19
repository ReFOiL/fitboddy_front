import type { ExerciseOut } from './exercise'

export type TrainingPlanStatus = 'active' | 'archived' | 'cancelled'

export interface ScheduledWorkoutExerciseOut {
  id: number
  scheduled_workout_id: number
  exercise_id: number
  sort_order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  exercise: ExerciseOut
}

export interface ScheduledWorkoutOut {
  id: number
  plan_id: number
  scheduled_for: string
  week: number | null
  day_of_week: number | null
  volume_multiplier: number
  is_completed: boolean
  completed_at: string | null
  perceived_effort: string | null
  session_exercises: ScheduledWorkoutExerciseOut[]
}

export interface TrainingPlanOut {
  id: number
  user_id: number
  start_date: string
  end_date: string
  status: TrainingPlanStatus
  created_at: string
  scheduled_workouts: ScheduledWorkoutOut[]
}

export interface TrainingPlanListItemOut {
  id: number
  user_id: number
  start_date: string
  end_date: string
  status: TrainingPlanStatus
  created_at: string
}

export interface TrainingPlanUpdate {
  start_date?: string
  end_date?: string
  status?: TrainingPlanStatus
}

export interface ScheduledWorkoutUpdate {
  scheduled_for?: string
  week?: number | null
  day_of_week?: number | null
  volume_multiplier?: number
  is_completed?: boolean
  completed_at?: string | null
  perceived_effort?: string | null
}

export interface SessionExerciseLineIn {
  exercise_id: number
  sort_order: number
  sets?: number | null
  reps?: number | null
  duration_seconds?: number | null
  rest_seconds?: number | null
}

export interface ReplaceSessionExercisesIn {
  exercises: SessionExerciseLineIn[]
}
