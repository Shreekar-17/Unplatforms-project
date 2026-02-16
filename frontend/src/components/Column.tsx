import { TaskCard } from './TaskCard'
import { Task } from '../features/tasks/types'
import { Droppable } from '@hello-pangea/dnd'
import type { SortMode } from './Board'

interface ColumnProps {
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  color: string
  isDragDisabled: boolean
  sortMode: SortMode
}

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

export function Column({ title, tasks, onTaskClick, color, isDragDisabled, sortMode }: ColumnProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortMode === 'priority') {
      const pDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      if (pDiff !== 0) return pDiff
      return a.ordering_index - b.ordering_index
    }
    if (sortMode === 'created') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    // manual
    return a.ordering_index - b.ordering_index || a.title.localeCompare(b.title)
  })

  return (
    <div className="flex flex-col min-w-[300px] w-[300px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-[13px] font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        <span className="text-[11px] text-gray-500 bg-board-surface px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
        <div className="flex-1" />
        <button className="text-gray-600 hover:text-gray-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Column divider */}
      <div className="h-[2px] rounded-full mx-3 mb-3 opacity-60" style={{ backgroundColor: color }} />

      {/* Droppable area */}
      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 px-2 pb-4 min-h-[200px] rounded-lg transition-colors duration-200 ${snapshot.isDraggingOver ? 'column-drag-over' : ''
              }`}
          >
            {sortedTasks.length === 0 ? (
              <div className="text-xs text-gray-600 border border-dashed border-board-border rounded-lg p-8 text-center mt-1">
                No tasks
              </div>
            ) : (
              sortedTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick(task)}
                  isDragDisabled={isDragDisabled}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
