import { launcherFetch } from "@/api/http"

export interface CronSchedule {
  kind: string
  atMs?: number
  everyMs?: number
  expr?: string
  tz?: string
}

export interface CronPayload {
  kind: string
  message: string
  command?: string
  channel?: string
  to?: string
}

export interface CronJobState {
  nextRunAtMs?: number
  lastRunAtMs?: number
  lastStatus?: string
  lastError?: string
}

export interface CronJob {
  id: string
  name: string
  enabled: boolean
  schedule: CronSchedule
  payload: CronPayload
  state: CronJobState
  createdAtMs: number
  updatedAtMs: number
  deleteAfterRun: boolean
}

interface CronJobsResponse {
  jobs: CronJob[]
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await launcherFetch(path, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getCronJobs(): Promise<CronJobsResponse> {
  return request<CronJobsResponse>("/api/cron/jobs")
}

export async function deleteCronJob(id: string): Promise<void> {
  await request(`/api/cron/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function toggleCronJob(id: string): Promise<CronJob> {
  return request<CronJob>(
    `/api/cron/jobs/${encodeURIComponent(id)}/toggle`,
    { method: "POST" },
  )
}
