/**
 * Image Studio endpoints (session auth). Jobs replay /v1/images/* server-side with
 * the selected API key, so the browser never sends a raw key.
 */
import { apiClient } from './client'
import type { PaginatedResponse } from '@/types'

export type ImageStudioJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface ImageStudioAsset {
  id: number
  job_id: number
  mime_type: string
  bytes: number
  revised_prompt?: string
  created_at: string
}

export interface ImageStudioJob {
  id: number
  api_key_id: number
  status: ImageStudioJobStatus
  kind: 'generate' | 'edit'
  model: string
  prompt: string
  params: { n?: number; size?: string; quality?: string; output_format?: string; background?: string; input_image_count?: number }
  error_message?: string
  warning?: string
  image_count: number
  duration_ms?: number
  created_at: string
  assets?: ImageStudioAsset[]
}

export interface CreateImageStudioJobRequest {
  api_key_id: number
  model: string
  prompt: string
  size?: string
  quality?: string
  output_format?: string
  background?: string
  n?: number
  input_images?: string[]
}

export async function createJob(payload: CreateImageStudioJobRequest): Promise<ImageStudioJob> {
  const { data } = await apiClient.post<ImageStudioJob>('/image-studio/jobs', payload, { timeout: 120000 })
  return data
}

export async function listJobs(page = 1, pageSize = 20): Promise<PaginatedResponse<ImageStudioJob>> {
  const { data } = await apiClient.get<PaginatedResponse<ImageStudioJob>>('/image-studio/jobs', { params: { page, page_size: pageSize } })
  return data
}

export async function getJob(id: number): Promise<ImageStudioJob> {
  const { data } = await apiClient.get<ImageStudioJob>(`/image-studio/jobs/${id}`)
  return data
}

export async function deleteJob(id: number): Promise<void> {
  await apiClient.delete(`/image-studio/jobs/${id}`)
}

export async function listAssets(page = 1, pageSize = 24): Promise<PaginatedResponse<ImageStudioAsset>> {
  const { data } = await apiClient.get<PaginatedResponse<ImageStudioAsset>>('/image-studio/assets', { params: { page, page_size: pageSize } })
  return data
}

export async function deleteAsset(id: number): Promise<void> {
  await apiClient.delete(`/image-studio/assets/${id}`)
}

/** Files require the session token, so they are fetched as blobs rather than used as <img src>. */
export async function fetchAssetBlob(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/image-studio/assets/${id}/file`, { responseType: 'blob' })
  return data
}

export const imageStudioAPI = { createJob, listJobs, getJob, deleteJob, listAssets, deleteAsset, fetchAssetBlob }
