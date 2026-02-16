import { Task, Priority } from '../features/tasks/types'
import { useUpdateTaskMutation } from '../features/tasks/tasksApi'
import clsx from 'clsx'
import { Draggable } from '@hello-pangea/dnd'
import { useState, useRef, useEffect } from 'react'

interface TaskCardProps {
  task: Task
  index: number
  onClick?: () => void
  isDragDisabled: boolean
  isSelected?: boolean
  isSelectionMode?: boolean
  onToggleSelect?: (taskId: string) => void
}

const priorityConfig: Record<Task['priority'], { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  P0: { label: 'CRITICAL', dotColor: 'bg-red-500', bgColor: 'bg-red-500/15', textColor: 'text-red-400' },
  P1: { label: 'HIGH', dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400' },
  P2: { label: 'MEDIUM', dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/15', textColor: 'text-blue-400' },
  P3: { label: 'LOW', dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400' },
}

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3']

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-purple-600', 'bg-cyan-600', 'bg-pink-600', 'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Inline priority dropdown
function PriorityDropdown({
  currentPriority,
  onSelect,
  onClose,
}: {
  currentPriority: Priority
  onSelect: (p: Priority) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-board-surface border border-board-border rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]"
    >
      {PRIORITIES.map((p) => {
        const cfg = priorityConfig[p]
        return (
          <button
            key={p}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(p)
            }}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-board-card transition',
              p === currentPriority && 'bg-board-card'
            )}
          >
            <span className={clsx('w-2 h-2 rounded-full', cfg.dotColor)} />
            <span className={cfg.textColor}>{cfg.label}</span>
            {p === currentPriority && <span className="ml-auto text-indigo-400">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// Inline owner edit
function OwnerInput({
  currentOwner,
  onSubmit,
  onClose,
}: {
  currentOwner: string
  onSubmit: (owner: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(currentOwner)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onSubmit(value.trim())
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [value, onSubmit])

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') onSubmit(value.trim())
        if (e.key === 'Escape') onClose()
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-24 bg-board-surface border border-indigo-500/50 rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      placeholder="Assign..."
    />
  )
}

export function TaskCard({ task, index, onClick, isDragDisabled, isSelected = false, isSelectionMode = false, onToggleSelect }: TaskCardProps) {
  const [updateTask] = useUpdateTaskMutation()
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showOwnerInput, setShowOwnerInput] = useState(false)
  const pConfig = priorityConfig[task.priority]
  const tags = task.tags && typeof task.tags === 'object' ? Object.keys(task.tags) : []

  const tagColors = [
    'bg-indigo-500/20 text-indigo-300',
    'bg-teal-500/20 text-teal-300',
    'bg-purple-500/20 text-purple-300',
    'bg-orange-500/20 text-orange-300',
    'bg-pink-500/20 text-pink-300',
  ]

  const handlePriorityChange = async (newPriority: Priority) => {
    setShowPriorityDropdown(false)
    if (newPriority === task.priority) return
    try {
      await updateTask({ id: task.id, body: { priority: newPriority, if_match: task.version } }).unwrap()
    } catch (err) {
      console.error('Failed to update priority:', err)
    }
  }

  const handleOwnerChange = async (newOwner: string) => {
    setShowOwnerInput(false)
    if (newOwner === (task.owner || '')) return
    try {
      await updateTask({ id: task.id, body: { owner: newOwner || undefined, if_match: task.version } }).unwrap()
    } catch (err) {
      console.error('Failed to update owner:', err)
    }
  }

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'rounded-lg bg-board-card border p-3.5 space-y-2.5 relative group',
            'hover:bg-board-card-hover transition-all duration-150 cursor-pointer',
            snapshot.isDragging && 'task-card-dragging',
            isSelected
              ? 'border-indigo-500/70 ring-1 ring-indigo-500/30 bg-indigo-500/5'
              : 'border-board-border hover:border-board-border-light'
          )}
          onClick={(e) => {
            // If in selection mode, toggle selection instead of opening modal
            if (isSelectionMode && onToggleSelect) {
              onToggleSelect(task.id)
              return
            }
            onClick?.()
          }}
        >
          {/* Selection checkbox */}
          <div
            className={clsx(
              'absolute top-2 right-2 z-10 transition-opacity duration-100',
              isSelectionMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect?.(task.id)
              }}
              className={clsx(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-600 hover:border-indigo-500 bg-transparent'
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>

          {/* Priority badge + tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPriorityDropdown(!showPriorityDropdown)
                }}
                className={clsx(
                  'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all',
                  pConfig.bgColor, pConfig.textColor,
                  'hover:ring-1 hover:ring-current/30'
                )}
                title="Click to change priority"
              >
                <span className={clsx('w-1.5 h-1.5 rounded-full', pConfig.dotColor)} />
                {pConfig.label}
              </button>
              {showPriorityDropdown && (
                <PriorityDropdown
                  currentPriority={task.priority}
                  onSelect={handlePriorityChange}
                  onClose={() => setShowPriorityDropdown(false)}
                />
              )}
            </div>
            {tags.slice(0, 2).map((tag, i) => (
              <span key={tag} className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full uppercase', tagColors[i % tagColors.length])}>
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <div className="text-[13px] font-medium text-gray-100 leading-snug line-clamp-2 pr-6">
            {task.title}
          </div>

          {/* Description preview */}
          {task.description && (
            <div className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
              {task.description}
            </div>
          )}

          {/* Footer: owner, estimate, date */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {showOwnerInput ? (
                <OwnerInput
                  currentOwner={task.owner || ''}
                  onSubmit={handleOwnerChange}
                  onClose={() => setShowOwnerInput(false)}
                />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowOwnerInput(true)
                  }}
                  title={task.owner ? `Click to reassign (${task.owner})` : 'Click to assign'}
                  className="flex items-center gap-1 hover:opacity-80 transition"
                >
                  {task.owner ? (
                    <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white', getAvatarColor(task.owner))}>
                      {getInitials(task.owner)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-gray-600 hover:border-indigo-500 hover:text-indigo-400 transition">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </button>
              )}
              {task.estimate && (
                <span className="text-[11px] text-gray-500">{task.estimate}h est.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">
                📅 {formatRelativeDate(task.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
