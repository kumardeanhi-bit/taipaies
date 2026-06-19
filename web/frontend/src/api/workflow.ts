import { launcherFetch } from "@/api/http"

export interface WorkflowChief {
  id: string
  name: string
  title: string
  role: string
  members: string[]
  emoji: string
  workspace: string
}

export interface WorkflowStep {
  order: number
  action: string
  target: string
  message: string
}

export interface WorkflowSchedule {
  kind: string
  everyMs?: number
  expr?: string
}

export interface Workflow {
  id: string
  name: string
  chief: string
  description: string
  enabled: boolean
  schedule: WorkflowSchedule
  steps: WorkflowStep[]
  lastRunAtMs: number
  lastStatus: string
  createdAtMs: number
}

interface ChiefsResponse {
  chiefs: WorkflowChief[]
}

interface WorkflowsResponse {
  workflows: Workflow[]
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await launcherFetch(path, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getChiefs(): Promise<ChiefsResponse> {
  return request<ChiefsResponse>("/api/workflow/chiefs")
}

export async function getChief(id: string): Promise<WorkflowChief> {
  return request<WorkflowChief>(`/api/workflow/chiefs/${encodeURIComponent(id)}`)
}

export async function getWorkflows(chief?: string): Promise<WorkflowsResponse> {
  const query = chief ? `?chief=${encodeURIComponent(chief)}` : ""
  return request<WorkflowsResponse>(`/api/workflow/list${query}`)
}

export async function createWorkflow(wf: Omit<Workflow, "id" | "createdAtMs" | "enabled" | "lastRunAtMs" | "lastStatus">): Promise<Workflow> {
  return request<Workflow>("/api/workflow/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wf),
  })
}

export async function updateWorkflow(id: string, wf: Omit<Workflow, "id" | "createdAtMs">): Promise<Workflow> {
  return request<Workflow>(`/api/workflow/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wf),
  })
}

export async function deleteWorkflow(id: string): Promise<void> {
  await request<unknown>(`/api/workflow/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function toggleWorkflow(id: string): Promise<Workflow> {
  return request<Workflow>(`/api/workflow/${encodeURIComponent(id)}/toggle`, {
    method: "POST",
  })
}
