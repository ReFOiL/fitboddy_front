import { apiClient } from './client'

const BASE = '/api/v1/admin/uploads'

export interface VideoUploadOut {
  object_key: string
}

/** Загрузка видео: возвращает object_key, который сохраняем в exercise.video_url */
export async function uploadVideo(file: File): Promise<VideoUploadOut> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<VideoUploadOut>(`${BASE}/video`, formData)
  return data
}
