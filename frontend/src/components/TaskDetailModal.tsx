import { Task, Priority, Status, Activity, Comment } from '../features/tasks/types'
import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  useUpdateTaskMutation,
  useGetTaskActivitiesQuery,
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
} from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/auth/authApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../features/auth/authSlice'
import { TbAlertCircleFilled, TbArrowUpCircle, TbCircle, TbArrowDownCircle } from 'react-icons/tb'
import { RichTextEditor } from './RichTextEditor'
import { useToast } from './Toast'

interface TaskDetailModalProps {
  task: Task
  initialTab?: TabKey // Keeping this prop for compatibility, but mapping it to sidebar view
  onClose: () => void
}

type TabKey = 'details' | 'comments' | 'activity'
type SidebarView = 'comments' | 'activity'

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
  P0: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15', icon: <TbAlertCircleFilled /> },
  P1: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: <TbArrowUpCircle /> },
  P2: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <TbCircle /> },
  P3: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <TbArrowDownCircle /> },
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

function describeActivity(activity: Activity): { icon: string; text: string; color?: string } {
  const { type, payload } = activity
  switch (type) {
    case 'created':
      return { icon: '🆕', text: 'created this task', color: 'text-gray-400' }
    case 'moved': {
      const from = payload.old_status || '—'
      const to = payload.new_status || '—'
      return { icon: '➡️', text: `moved this task from ${from} to ${to}` }
    }
    case 'updated': {
      const changes: string[] = []
      if (payload.new_priority) changes.push(`priority to ${payload.new_priority}`)
      if (payload.new_status) changes.push(`status to ${payload.new_status}`)
      if (payload.new_owner) changes.push(`assignee to ${payload.new_owner}`)
      if (payload.title) changes.push(`title`)
      if (payload.description) changes.push(`description`)
      return { icon: '✏️', text: `updated a ${changes.join(', ')}` } // Grammar rough but readable
    }
    case 'commented':
      return { icon: '💬', text: 'commented', color: 'text-gray-300' }
    default:
      return { icon: '📌', text: `${type}`, color: 'text-gray-500' }
  }
}

// --- Components ---

function TaskProperties({ task }: { task: Task }) {
  const [updateTask] = useUpdateTaskMutation()
  const { data: users = [] } = useGetUsersQuery()
  const { showToast } = useToast()

  const handleUpdate = async (field: Partial<Task>) => {
    try {
      await updateTask({
        id: task.id,
        body: { ...field, if_match: task.version },
      }).unwrap()
    } catch (err: any) {
      console.error('Failed to update property', err)
      if (err?.status === 412 || err?.status === 409) {
        showToast('This task was updated by another user. Please refresh.', 'error')
      } else {
        showToast('Failed to update properties', 'error')
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-6 mb-8">
      {/* Status */}
      <div className="min-w-[120px]">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</h4>
        <div className="relative">
          <select
            value={task.status}
            onChange={(e) => handleUpdate({ status: e.target.value as Status })}
            className="w-full appearance-none bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition font-medium pr-8"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Priority */}
      <div className="min-w-[120px]">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</h4>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base">
            <span className={priorityConfig[task.priority].color}>{priorityConfig[task.priority].icon}</span>
          </div>
          <select
            value={task.priority}
            onChange={(e) => handleUpdate({ priority: e.target.value as Priority })}
            className="w-full appearance-none bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 pl-8 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition font-medium pr-8"
          >
            {priorityOptions.map(p => (
              <option key={p} value={p}>{priorityConfig[p].label}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Assignee */}
      <div className="min-w-[150px]">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assignee</h4>
        <div className="relative">
          <input
            type="text"
            defaultValue={task.owner || ''}
            onBlur={(e) => {
              const newOwner = e.target.value
              if (newOwner !== (task.owner || '')) {
                if (newOwner && !users.find(u => u.username === newOwner)) {
                  e.target.value = task.owner || ''
                  return
                }
                handleUpdate({ owner: newOwner || null })
              }
            }}
            list="sidebar-users-list"
            className="w-full bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-500 font-medium"
            placeholder="Unassigned"
          />
          <datalist id="sidebar-users-list">
            {users.map(u => <option key={u.id} value={u.username} />)}
          </datalist>
        </div>
      </div>

      {/* Estimate */}
      <div className="min-w-[100px]">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estimate</h4>
        <div className="relative">
          <input
            type="number"
            defaultValue={task.estimate || ''}
            onBlur={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null
              if (val !== task.estimate) {
                handleUpdate({ estimate: val })
              }
            }}
            className="w-full bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-500 font-medium"
            placeholder="0h"
          />
        </div>
      </div>
    </div>
  )
}

function DescriptionSection({ task }: { task: Task }) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(task.description || '')
  const { showToast } = useToast()

  useEffect(() => {
    setDescription(task.description || '')
  }, [task.description])

  const handleSave = async () => {
    if (description === task.description) {
      setIsEditing(false)
      return
    }
    try {
      await updateTask({
        id: task.id,
        body: { description, if_match: task.version },
      }).unwrap()
      setIsEditing(false)
    } catch (err: any) {
      console.error('Failed to update description', err)
      if (err?.status === 412 || err?.status === 409) {
        showToast('This task was updated by another user. Please refresh.', 'error')
      } else {
        showToast('Failed to update description', 'error')
      }
    }
  }

  const handleCancel = () => {
    setDescription(task.description || '')
    setIsEditing(false)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <h3 className="text-base font-semibold text-gray-200">Description</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs font-medium text-gray-400 bg-board-card hover:bg-board-card-hover border border-board-border rounded transition ml-auto"
          >
            Edit
          </button>
        )}
      </div>

      <div className="pl-8">
        {isEditing ? (
          <div className="space-y-3">
            <RichTextEditor
              value={description}
              onChange={setDescription}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-1.5 text-gray-400 hover:text-gray-200 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="rounded-lg hover:bg-board-card transition cursor-text min-h-[60px] group relative border border-transparent hover:border-board-border/50"
          >
            {description ? (
              <div className="pointer-events-none">
                <RichTextEditor key={description} value={description} readOnly={true} onChange={() => { }} />
              </div>
            ) : (
              <p className="text-gray-500 italic px-4 py-3">Add a description...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentsList({ task }: { task: Task }) {
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
      console.error('Failed to post comment', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Input Area - Moved to top for Trello style */}
      <div className="bg-board-card/20 p-3 rounded-xl border border-board-border/30">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Write a comment..."
          rows={1}
          onClick={(e) => (e.target as HTMLTextAreaElement).rows = 3}
          className="w-full bg-board-surface border border-board-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none placeholder-gray-500"
        />
        {body.trim() && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Comments Feed */}
      <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 text-xs">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm italic">No comments yet.</div>
        ) : (
          [...comments]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5', getAvatarColor(comment.actor))}>
                  {getInitials(comment.actor)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-200">{comment.actor}</span>
                    <span className="text-[10px] text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <div className="bg-board-card border border-board-border rounded-lg px-3 py-2 text-sm text-gray-300 leading-relaxed">
                    {comment.body}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

function ActivitiesList({ task }: { task: Task }) {
  const [offset, setOffset] = useState(0)
  const limit = 10
  const { data: activities = [], isLoading, isFetching } = useGetTaskActivitiesQuery({
    taskId: task.id,
    limit,
    offset,
    exclude_type: 'commented',
  })

  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const hasMore = activities.length >= offset + limit

  return (
    <div className="space-y-3 relative pt-2">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-board-border" />

      {isLoading && offset === 0 ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading activity...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm italic pl-4">No recent activity.</div>
      ) : (
        sorted.map(activity => {
          const { icon, text } = describeActivity(activity)
          return (
            <div key={activity.id} className="flex gap-3 py-1 relative z-10">
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-[12px] bg-board-bg border border-board-border flex-shrink-0')}>
                {icon}
              </div>
              <div className="py-1 min-w-0">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-gray-100">{activity.actor}</span> <span className="text-gray-400">{text}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
              </div>
            </div>
          )
        })
      )}

      {hasMore && (
        <button
          onClick={() => setOffset(prev => prev + limit)}
          disabled={isFetching}
          className="ml-11 text-xs text-indigo-400 hover:text-indigo-300 hover:underline disabled:opacity-50"
        >
          {isFetching ? 'Loading...' : 'Show older events'}
        </button>
      )}
    </div>
  )
}

function ActivityPanel({ task }: { task: Task }) {
  const [view, setView] = useState<SidebarView>('comments')

  return (
    <div className="bg-board-card/10 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex bg-board-card p-1 rounded-lg border border-board-border w-full">
          <button
            onClick={() => setView('comments')}
            className={clsx(
              "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition text-center",
              view === 'comments' ? "bg-board-surface text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            )}
          >
            Comments
          </button>
          <button
            onClick={() => setView('activity')}
            className={clsx(
              "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition text-center",
              view === 'activity' ? "bg-board-surface text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            )}
          >
            Activity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {view === 'comments' ? <CommentsList task={task} /> : <ActivitiesList task={task} />}
      </div>
    </div>
  )
}

// --- Main Modal ---

export function TaskDetailModal({ task, initialTab = 'details', onClose }: TaskDetailModalProps) {
  const [updateTask] = useUpdateTaskMutation()
  const [title, setTitle] = useState(task.title)
  const { showToast } = useToast()
  const [mobileTab, setMobileTab] = useState<'details' | 'activity'>('details')

  useEffect(() => {
    setTitle(task.title)
  }, [task.title])

  const handleTitleBlur = async () => {
    if (title.trim() && title !== task.title) {
      try {
        await updateTask({
          id: task.id,
          body: { title, if_match: task.version }
        }).unwrap()
      } catch (err: any) {
        console.error('Failed to update title', err)
        setTitle(task.title)
        if (err?.status === 412 || err?.status === 409) {
          showToast('This task was updated by another user. Please refresh.', 'error')
        } else {
          showToast('Failed to update title', 'error')
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-board-surface border border-board-border rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content Column (Left) */}
        <div className="flex-1 flex flex-col min-w-0 bg-board-surface">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-xs uppercase tracking-wider font-semibold">{task.id.slice(0, 8)}</span>
              </div>
              {/* Mobile Close Button (visible only on small screens if needed, otherwise rely on sidebar close) */}
              <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-100 p-2 hover:bg-board-card rounded-full transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mr-8">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full bg-transparent text-3xl font-bold text-gray-100 focus:outline-none focus:bg-board-bg focus:ring-2 focus:ring-indigo-500 rounded px-2 -ml-2 transition py-1"
              />
              <div className="text-sm text-gray-400 mt-2 ml-1">
                in list <span className="text-gray-300 font-medium underline decoration-gray-600 underline-offset-2">{task.status}</span>
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex items-center border-b border-board-border px-8 lg:hidden">
            <button
              onClick={() => setMobileTab('details')}
              className={clsx(
                "py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                mobileTab === 'details' ? "border-indigo-500 text-white" : "border-transparent text-gray-500"
              )}
            >
              Details
            </button>
            <button
              onClick={() => setMobileTab('activity')}
              className={clsx(
                "py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                mobileTab === 'activity' ? "border-indigo-500 text-white" : "border-transparent text-gray-500"
              )}
            >
              Activity & Comments
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
            <div className={clsx("lg:block", mobileTab === 'details' ? 'block' : 'hidden')}>
              <TaskProperties task={task} />
              <div className="h-8" /> {/* Spacer */}
              <DescriptionSection task={task} />
            </div>

            <div className={clsx("lg:hidden h-full", mobileTab === 'activity' ? 'block' : 'hidden')}>
              <ActivityPanel task={task} />
            </div>
          </div>
        </div>

        {/* Sidebar Column (Right) */}
        <div className="hidden lg:flex w-[400px] border-l border-board-border bg-board-bg/30 flex-col flex-shrink-0">
          {/* Sidebar Header with Close Button */}
          <div className="h-14 flex items-center justify-end px-4 border-b border-board-border/50">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-100 p-2 hover:bg-board-card rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
            <ActivityPanel task={task} />
          </div>
        </div>
      </div>
    </div>
  )
}
