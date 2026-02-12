/** Совпадает с бэкендом WorkoutDifficulty */
export type WorkoutDifficulty = 'low' | 'medium' | 'high'

export interface MuscleOut {
  id: number
  name: string
  sort_order: number
}

export interface ContraindicationOut {
  id: number
  name: string
  sort_order: number
}

export interface ExerciseCreate {
  name: string
  description?: string | null
  video_url?: string | null
  muscle_ids?: number[]
  equipment?: string | null
  is_cardio?: boolean
  difficulty?: number
  contraindication_ids?: number[]
}

export interface ExerciseUpdate {
  name?: string | null
  description?: string | null
  video_url?: string | null
  muscle_ids?: number[] | null
  equipment?: string | null
  is_cardio?: boolean | null
  difficulty?: number | null
  contraindication_ids?: number[] | null
}

export interface ExerciseOut {
  id: number
  name: string
  description: string | null
  video_url: string | null
  video_stream_url?: string | null
  muscles: MuscleOut[]
  equipment: string | null
  is_cardio: boolean
  difficulty: number
  contraindications: ContraindicationOut[]
  created_at: string
  updated_at: string
}

export interface WorkoutExerciseCreate {
  exercise_id: number
  sort_order?: number
  sets?: number | null
  reps?: number | null
  duration_seconds?: number | null
  rest_seconds?: number | null
  notes?: string | null
}

export interface WorkoutExerciseOut {
  workout_id: number
  exercise_id: number
  sort_order: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
  exercise: ExerciseOut
}

export interface WorkoutTemplateCreate {
  title: string
  goal: string
  difficulty: WorkoutDifficulty
  equipment?: string | null
  days_per_week?: number
  description?: string | null
  is_active?: boolean
  user_id?: number | null
  exercises?: WorkoutExerciseCreate[]
}

export interface WorkoutTemplateUpdate {
  title?: string | null
  goal?: string | null
  difficulty?: WorkoutDifficulty | null
  equipment?: string | null
  days_per_week?: number | null
  description?: string | null
  is_active?: boolean | null
  user_id?: number | null
  exercises?: WorkoutExerciseCreate[] | null
}

export interface WorkoutTemplateOut {
  id: number
  title: string
  goal: string
  difficulty: WorkoutDifficulty
  equipment: string | null
  days_per_week: number
  user_id: number | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  workout_exercises: WorkoutExerciseOut[]
}
