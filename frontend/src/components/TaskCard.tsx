import { Task } from '../features/tasks/types'
import clsx from 'clsx'
import { Draggable } from '@hello-pangea/dnd'

interface TaskCardProps {
  task: Task
  index: number
  onClick?: () => void
  isDragDisabled: boolean
}

const priorityConfig: Record<Task['priority'], { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  P0: { label: 'CRITICAL', dotColor: 'bg-red-500', bgColor: 'bg-red-500/15', textColor: 'text-red-400' },
  P1: { label: 'HIGH', dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/15', textColor: 'text-amber-400' },
  P2: { label: 'MEDIUM', dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/15', textColor: 'text-blue-400' },
  P3: { label: 'LOW', dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400' },
}

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

export function TaskCard({ task, index, onClick, isDragDisabled }: TaskCardProps) {
  const pConfig = priorityConfig[task.priority]
  const tags = task.tags && typeof task.tags === 'object' ? Object.keys(task.tags) : []

  const tagColors = [
    'bg-indigo-500/20 text-indigo-300',
    'bg-teal-500/20 text-teal-300',
    'bg-purple-500/20 text-purple-300',
    'bg-orange-500/20 text-orange-300',
    'bg-pink-500/20 text-pink-300',
  ]

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'rounded-lg bg-board-card border border-board-border p-3.5 space-y-2.5',
            'hover:bg-board-card-hover hover:border-board-border-light transition-all duration-150 cursor-pointer',
            snapshot.isDragging && 'task-card-dragging'
          )}
          onClick={onClick}
        >
          {/* Priority badge + tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', pConfig.bgColor, pConfig.textColor)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', pConfig.dotColor)} />
              {pConfig.label}
            </span>
            {tags.slice(0, 2).map((tag, i) => (
              <span key={tag} className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full uppercase', tagColors[i % tagColors.length])}>
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <div className="text-[13px] font-medium text-gray-100 leading-snug line-clamp-2">
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
              {task.owner && (
                <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white', getAvatarColor(task.owner))} title={task.owner}>
                  {getInitials(task.owner)}
                </div>
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
