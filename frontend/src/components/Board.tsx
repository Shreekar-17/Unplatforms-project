import { Task, Status } from '../features/tasks/types'
import { Column } from './Column'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useReorderTaskMutation, tasksApi } from '../features/tasks/tasksApi'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store'

export type SortMode = 'manual' | 'priority' | 'created'

interface BoardProps {
  columns: Record<string, Task[]>
  onTaskClick: (task: Task) => void
  sortMode: SortMode
}

const COLUMN_ORDER: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done']
const COLUMN_COLORS: Record<string, string> = {
  Backlog: '#6b7280',
  Ready: '#3b82f6',
  'In Progress': '#f59e0b',
  Review: '#8b5cf6',
  Done: '#22c55e',
}

const GAP = 1000

function computeNewIndex(tasks: Task[], destIndex: number): number {
  if (tasks.length === 0) return GAP

  if (destIndex === 0) {
    return tasks[0].ordering_index / 2
  }
  if (destIndex >= tasks.length) {
    return tasks[tasks.length - 1].ordering_index + GAP
  }
  return (tasks[destIndex - 1].ordering_index + tasks[destIndex].ordering_index) / 2
}

export function Board({ columns, onTaskClick, sortMode }: BoardProps) {
  const [reorderTask] = useReorderTaskMutation()
  const dispatch = useDispatch<AppDispatch>()

  const isDragDisabled = sortMode !== 'manual'

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceStatus = source.droppableId as Status
    const destStatus = destination.droppableId as Status
    const isMovingColumn = sourceStatus !== destStatus

    // Get sorted tasks from destination column (excluding the dragged task)
    const destTasks = [...(columns[destStatus] || [])]
      .filter((t) => t.id !== draggableId)
      .sort((a, b) => a.ordering_index - b.ordering_index)

    const newIndex = computeNewIndex(destTasks, destination.index)

    // Find the dragged task
    const allTasks = Object.values(columns).flat()
    const draggedTask = allTasks.find((t) => t.id === draggableId)
    if (!draggedTask) return

    // Optimistic update in RTK Query cache
    const patchResult = dispatch(
      tasksApi.util.updateQueryData('listTasks', undefined, (draft) => {
        const task = draft.find((t) => t.id === draggableId)
        if (task) {
          task.ordering_index = newIndex
          if (isMovingColumn) {
            task.status = destStatus
          }
        }
      })
    )

    try {
      await reorderTask({
        id: draggableId,
        new_status: isMovingColumn ? destStatus : null,
        new_ordering_index: newIndex,
        if_match: draggedTask.version,
      }).unwrap()
    } catch (err: any) {
      // Undo optimistic update
      patchResult.undo()
      // If version conflict (409), refetch to get fresh data
      if (err?.status === 409) {
        dispatch(tasksApi.util.invalidateTags([{ type: 'Task', id: 'LIST' }]))
      }
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex-1 flex gap-4 p-5 overflow-x-auto">
        {COLUMN_ORDER.map((col) => (
          <Column
            key={col}
            title={col}
            tasks={columns[col] || []}
            onTaskClick={onTaskClick}
            color={COLUMN_COLORS[col]}
            isDragDisabled={isDragDisabled}
            sortMode={sortMode}
          />
        ))}
      </div>
    </DragDropContext>
  )
}

