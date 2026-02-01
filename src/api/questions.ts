import { apiClient } from './client'
import type { CustomQuestionCreate, CustomQuestionOut, CustomQuestionUpdate, MessageOut } from '../types/question'

export async function listQuestions() {
  const { data } = await apiClient.get<CustomQuestionOut[]>('/admin/questions')
  return data
}

export async function createQuestion(payload: CustomQuestionCreate) {
  const { data } = await apiClient.post<{ id: number; message: string }>('/admin/questions', payload)
  return data
}

export async function updateQuestion(questionId: number, payload: CustomQuestionUpdate) {
  const { data } = await apiClient.put<MessageOut>(`/admin/questions/${questionId}`, payload)
  return data
}

// В текущем бэкенде это деактивация, но эндпоинт DELETE.
export async function deactivateQuestion(questionId: number) {
  const { data } = await apiClient.delete<MessageOut>(`/admin/questions/${questionId}`)
  return data
}

export async function updateQuestionOrder(questionId: number, newOrder: number) {
  const { data } = await apiClient.put<MessageOut>(`/admin/questions/${questionId}/order`, { new_order: newOrder })
  return data
}

