import { launcherFetch } from "@/api/http"

export interface RowData {
  [key: string]: unknown
}

export interface TableDataResponse {
  count: number
  rows: RowData[]
}

export interface TableEntry {
  name: string
  count: number
}

export interface TablesResponse {
  tables: TableEntry[]
}

async function request<T>(path: string): Promise<T> {
  const res = await launcherFetch(path)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getTables(): Promise<TablesResponse> {
  return request<TablesResponse>("/api/db/tables")
}

export async function getTableData(table: string, id?: string): Promise<TableDataResponse> {
  let path = `/api/db/${encodeURIComponent(table)}`
  if (id) path += `?id=${encodeURIComponent(id)}`
  return request<TableDataResponse>(path)
}

export interface AuditEntry {
  id: number
  action: string
  table_name: string
  row_id: number | null
  data: string | null
  performed_by: string
  summary: string | null
  created_at: string
}

export interface AuditResponse {
  entries: AuditEntry[]
}

export async function getAuditLog(): Promise<AuditResponse> {
  return request<AuditResponse>("/api/db/ai-audit")
}
