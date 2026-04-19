/** Значения `workout_category` в БД (планировщик, сидер). */
export const WORKOUT_CATEGORY_OPTIONS = [
  { value: 'full_body', label: 'Всё тело' },
  { value: 'upper', label: 'Верх' },
  { value: 'lower', label: 'Низ' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'push', label: 'Жимовые' },
  { value: 'pull', label: 'Тяговые' },
  { value: 'legs', label: 'Ноги' },
] as const
