export type UserOut = {
  id: number
  telegram_id: number
  username: string | null
  created_at: string
  has_completed_profile: boolean
  profile_completed_at: string | null
}

export type UserAnswerOptionOut = {
  value: string
  label: string
}

export type UserAnswerGroupOut = {
  question_id: number
  question_key: string
  question_text: string
  answer_type: string
  options?: UserAnswerOptionOut[] | null
  value?: unknown
  answered_at?: string | null
  updated_at?: string | null
}

export type UserDetailOut = UserOut & {
  answers: UserAnswerGroupOut[]
}

