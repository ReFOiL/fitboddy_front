export type AnswerType = 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'boolean'

export type OptionItem = {
  value: string
  label: string
}

export type CustomQuestionCreate = {
  key: string
  order?: number
  text: string
  answer_type: AnswerType
  options?: OptionItem[] | null
  min_value?: number | null
  max_value?: number | null
  pattern?: string | null
  is_required?: boolean
  is_active?: boolean
  category?: string | null
  tags?: string[]
}

export type CustomQuestionUpdate = Partial<CustomQuestionCreate>

export type CustomQuestionOut = {
  id: number
  key: string
  order: number
  text: string
  answer_type: AnswerType
  options: Array<{ value: string; label: string }> | null
  min_value: number | null
  max_value: number | null
  pattern: string | null
  is_required: boolean
  is_active: boolean
  category: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type MessageOut = { message: string }

