import { Task, Priority, Status, Activity, Comment } from '../features/tasks/types'
import { useState } from 'react'
import clsx from 'clsx'
import {
  useUpdateTaskMutation,
  useGetTaskActivitiesQuery,
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
} from '../features/tasks/tasksApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../features/auth/authSlice'

interface TaskDetailModalProps {
  task: Task
  initialTab?: TabKey
  onClose: () => void
}

type TabKey = 'details' | 'comments' | 'activity'
type ActivityFilter = 'all' | 'created' | 'updated' | 'moved' | 'commented'

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  P0: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15' },
  P1: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  P2: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  P3: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

const statusOptions: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done']
const priorityOptions: Priority[] = ['P0', 'P1', 'P2', 'P3']

// --- Helpers ---

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-purple-600', 'bg-cyan-600', 'bg-pink-600', 'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function describeActivity(activity: Activity): { icon: string; text: string } {
  const { type, payload } = activity
  switch (type) {
    case 'created':
      return { icon: '🆕', text: 'Created this task' }
    case 'moved': {
      const from = payload.old_status || '—'
      const to = payload.new_status || '—'
      return { icon: '➡️', text: `Moved from ${from} → ${to}` }
    }
    case 'updated': {
      const changes: string[] = []
      if (payload.new_priority) {
        const old = payload.old_priority || '—'
        changes.push(`Changed priority ${old} → ${payload.new_priority}`)
      }
      if (payload.new_status) {
        const old = payload.old_status || '—'
        changes.push(`Changed status ${old} → ${payload.new_status}`)
      }
      if (payload.new_owner) changes.push(`Assigned to ${payload.new_owner}`)
      if (payload.title) changes.push(`Updated title`)
      if (payload.description) changes.push(`Updated description`)
      if (payload.estimate !== undefined) changes.push(`Updated estimate`)
      return { icon: '✏️', text: changes.length > 0 ? changes.join(', ') : 'Updated task' }
    }
    case 'commented':
      return { icon: '💬', text: payload.body ? `"${payload.body}"` : 'Added a comment' }
    case 'bulk_updated':
      return { icon: '📦', text: 'Bulk updated' }
    default:
      return { icon: '📌', text: `${type}` }
  }
}


// --- Sub-components ---

function DetailsTab({ task, onClose }: { task: Task; onClose: () => void }) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [owner, setOwner] = useState(task.owner || '')
  const [estimate, setEstimate] = useState(task.estimate?.toString() || '')
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [status, setStatus] = useState<Status>(task.status)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    try {
      await updateTask({
        id: task.id,
        body: {
          title,
          description: description || null,
          owner: owner || null,
          estimate: estimate ? parseInt(estimate) : null,
          priority,
          status,
          if_match: task.version,
        },
      }).unwrap()
      onClose()
    } catch (err: any) {
      if (err?.status === 409) {
        setError('This task was modified by someone else. Close and reopen to get the latest version.')
      } else {
        setError('Failed to save changes.')
      }
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
        )}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer">
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer">
              {priorityOptions.map((p) => <option key={p} value={p}>{p} — {priorityConfig[p].label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Owner</label>
            <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Assign to..."
              className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Estimate (hours)</label>
            <input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="0"
              className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-600 pt-2 border-t border-board-border">
          <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>Updated {new Date(task.updated_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>v{task.version}</span>
        </div>
      </div>
      {/* Footer */}
      <div className="px-5 py-3 border-t border-board-border flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 bg-board-card border border-board-border rounded-lg hover:bg-board-card-hover hover:text-gray-200 transition">
          Cancel
        </button>
        <button onClick={handleSave} disabled={isLoading || !title.trim()}
          className={clsx('px-5 py-2 text-sm font-medium text-white rounded-lg transition-all',
            isLoading || !title.trim() ? 'bg-indigo-800 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20'
          )}>
          {isLoading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function CommentsTab({ task }: { task: Task }) {
  const { data: comments = [], isLoading } = useGetTaskCommentsQuery(task.id)
  const [createComment, { isLoading: isSending }] = useCreateCommentMutation()
  const [body, setBody] = useState('')
  const currentUser = useSelector(selectCurrentUser)

  const handleSend = async () => {
    if (!body.trim()) return
    try {
      await createComment({
        taskId: task.id,
        body: body.trim(),
        actor: currentUser?.username || 'Anonymous',
      }).unwrap()
      setBody('')
    } catch (err) {
      console.error('Failed to post comment:', err)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm text-gray-500">No comments yet</p>
            <p className="text-xs text-gray-600 mt-1">Start the conversation below</p>
          </div>
        ) : (
          [...comments].reverse().map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5', getAvatarColor(comment.actor))}>
                {getInitials(comment.actor)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-200">{comment.actor}</span>
                  <span className="text-[11px] text-gray-600">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <div className="bg-board-card border border-board-border rounded-lg px-3 py-2.5 text-sm text-gray-300 leading-relaxed">
                  {comment.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <div className="px-5 py-3 border-t border-board-border">
        <div className="flex gap-3">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0', getAvatarColor(currentUser?.username || 'U'))}>
            {getInitials(currentUser?.username || 'U')}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !body.trim()}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                isSending || !body.trim()
                  ? 'bg-board-card text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              )}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityTab({ task }: { task: Task }) {
  const { data: activities = [], isLoading } = useGetTaskActivitiesQuery({ taskId: task.id })
  const [filter, setFilter] = useState<ActivityFilter>('all')

  const filterOptions: { key: ActivityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'commented', label: 'Comments' },
    { key: 'updated', label: 'Updates' },
    { key: 'moved', label: 'Moves' },
    { key: 'created', label: 'Created' },
  ]

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="flex flex-col flex-1">
      {/* Filter bar */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mr-1">Filter:</span>
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={clsx(
              'px-2.5 py-1 text-[11px] font-medium rounded-full transition-all',
              filter === opt.key
                ? 'bg-indigo-600 text-white'
                : 'bg-board-card text-gray-400 hover:text-gray-200 border border-board-border'
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[11px] text-gray-600">{sorted.length} entries</span>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm text-gray-500">No activity found</p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-board-border" />

            <div className="space-y-1">
              {sorted.map((activity) => {
                const { icon, text } = describeActivity(activity)
                const isComment = activity.type === 'commented'

                return (
                  <div key={activity.id} className="flex gap-3 py-2.5 relative">
                    {/* Avatar */}
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 z-10', getAvatarColor(activity.actor))}>
                      {getInitials(activity.actor)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-200">{activity.actor}</span>
                        {activity.type === 'commented' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">💬</span>
                        )}
                        <span className="text-[11px] text-gray-600 ml-auto flex-shrink-0">{formatRelativeTime(activity.created_at)}</span>
                      </div>
                      {isComment ? (
                        <div className="bg-board-card border border-board-border rounded-lg px-3 py-2 text-sm text-gray-300 leading-relaxed mt-1">
                          {text}
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-400">{text}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Modal ---

export function TaskDetailModal({ task, initialTab = 'details', onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'details', label: 'Details', icon: '📝' },
    { key: 'comments', label: 'Comments', icon: '💬' },
    { key: 'activity', label: 'Activity', icon: '📋' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-board-surface border border-board-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-board-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-white truncate">{task.title}</h2>
            <span className={clsx('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0', priorityConfig[task.priority].bg, priorityConfig[task.priority].color)}>
              {priorityConfig[task.priority].label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition p-1.5 rounded-lg hover:bg-board-card flex-shrink-0 ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-board-border flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex-1 px-4 py-2.5 text-sm font-medium transition-all relative',
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === 'details' && <DetailsTab task={task} onClose={onClose} />}
          {activeTab === 'comments' && <CommentsTab task={task} />}
          {activeTab === 'activity' && <ActivityTab task={task} />}
        </div>
      </div>
    </div>
  )
}
