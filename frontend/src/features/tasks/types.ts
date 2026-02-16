export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Status = 'Backlog' | 'Ready' | 'In Progress' | 'Review' | 'Done'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: Status
  priority: Priority
  owner?: string | null
  tags: Record<string, unknown>
  estimate?: number | null
  ordering_index: number
  version: number
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  task_id: string
  type: 'created' | 'updated' | 'moved' | 'commented' | 'bulk_updated' | 'deleted'
  payload: Record<string, any>
  actor: string
  activity_seq: number
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  body: string
  actor: string
  created_at: string
  version: number
}

export type TabKey = 'details' | 'comments' | 'activity'
