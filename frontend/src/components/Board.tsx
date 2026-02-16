import { Task, Status, Priority, TabKey } from '../features/tasks/types'
import { Column } from './Column'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useReorderTaskMutation, useBulkUpdateTasksMutation, tasksApi } from '../features/tasks/tasksApi'
import { useDispatch } from 'react-redux'
import { useState, useCallback } from 'react'
import clsx from 'clsx'
import type { AppDispatch } from '../store'

export type SortMode = 'manual' | 'priority' | 'created'

interface BoardProps {
  columns: Record<string, Task[]>
  onTaskClick: (task: Task, initialTab?: TabKey) => void
  sortMode: SortMode
  onAdd: (status: Status) => void
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

// Bulk action toolbar dropdown
function ActionDropdown({
  label,
  options,
  onSelect,
  onClose,
}: {
  label: string
  options: { value: string; label: string; color?: string }[]
  onSelect: (value: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-board-surface border border-board-border rounded-lg shadow-2xl overflow-hidden min-w-[160px] z-50">
      <div className="px-3 py-2 border-b border-board-border">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            onSelect(opt.value)
            onClose()
          }}
          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-board-card transition flex items-center gap-2"
        >
          {opt.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Board({ columns, onTaskClick, sortMode, onAdd }: BoardProps) {
  const [reorderTask] = useReorderTaskMutation()
  const [bulkUpdate, { isLoading: isBulkUpdating }] = useBulkUpdateTasksMutation()
  const dispatch = useDispatch<AppDispatch>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const isDragDisabled = sortMode !== 'manual'
  const isSelectionMode = selectedIds.size > 0

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const clearSelection = () => {
    setSelectedIds(new Set())
    setActiveDropdown(null)
  }

  const handleBulkAction = async (action: { status?: string; priority?: string; owner?: string; delete?: boolean }) => {
    if (selectedIds.size === 0) return
    try {
      await bulkUpdate({
        task_ids: Array.from(selectedIds),
        ...action,
      }).unwrap()
      clearSelection()
    } catch (err) {
      console.error('Bulk update failed:', err)
    }
  }

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

  const statusOptions = COLUMN_ORDER.map((s) => ({
    value: s,
    label: s,
    color: COLUMN_COLORS[s],
  }))

  const priorityOptions: { value: string; label: string; color: string }[] = [
    { value: 'P0', label: 'Critical', color: '#ef4444' },
    { value: 'P1', label: 'High', color: '#f59e0b' },
    { value: 'P2', label: 'Medium', color: '#3b82f6' },
    { value: 'P3', label: 'Low', color: '#22c55e' },
  ]

  return (
    <>
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
              selectedIds={selectedIds}
              isSelectionMode={isSelectionMode}
              onToggleSelect={toggleSelect}
              onAdd={() => onAdd(col)}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Floating Bulk Action Toolbar */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-board-surface/95 backdrop-blur-lg border border-board-border rounded-2xl shadow-2xl shadow-black/30 px-5 py-3 flex items-center gap-3">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-3 border-r border-board-border">
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white">
                {selectedIds.size}
              </div>
              <span className="text-sm text-gray-300 font-medium">selected</span>
            </div>

            {/* Status action */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={clsx(
                  'px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                  activeDropdown === 'status'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-board-card'
                )}
              >
                <span>📋</span> Status
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === 'status' && (
                <ActionDropdown
                  label="Move to"
                  options={statusOptions}
                  onSelect={(v) => handleBulkAction({ status: v })}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Priority action */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                className={clsx(
                  'px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                  activeDropdown === 'priority'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-board-card'
                )}
              >
                <span>🔥</span> Priority
                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeDropdown === 'priority' && (
                <ActionDropdown
                  label="Set priority"
                  options={priorityOptions}
                  onSelect={(v) => handleBulkAction({ priority: v })}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Delete action */}
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedIds.size} task(s)?`)) {
                  handleBulkAction({ delete: true })
                }
              }}
              disabled={isBulkUpdating}
              className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-board-border" />

            {/* Clear selection */}
            <button
              onClick={clearSelection}
              className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-300 hover:bg-board-card rounded-lg transition-all"
            >
              ✕ Clear
            </button>

            {/* Loading indicator */}
            {isBulkUpdating && (
              <div className="w-4 h-4 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin" />
            )}
          </div>
        </div>
      )}
    </>
  )
}
