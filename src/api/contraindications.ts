import { apiClient } from './client'
import type { ContraindicationOut } from '../types/exercise'

const BASE = '/api/v1/admin/contraindications'

export async function listContraindications() {
  const { data } = await apiClient.get<ContraindicationOut[]>(BASE)
  return data
}
