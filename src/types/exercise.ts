/** Типы каталога упражнений и справочников (согласованы с FastAPI `admin_schemas`). */

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
  workout_category?: string
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
  workout_category?: string | null
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
  workout_category: string
  contraindications: ContraindicationOut[]
  created_at: string
  updated_at: string
}
