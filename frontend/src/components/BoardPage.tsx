import { useListTasksQuery } from '../features/tasks/tasksApi'
import { Task, Status, TabKey } from '../features/tasks/types'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Board, SortMode } from './Board'
import { TaskDetailModal } from './TaskDetailModal'
import { CreateTaskModal } from './CreateTaskModal'

export default function BoardPage() {
  const { sortMode, isFocusMode } = useOutletContext<{ sortMode: SortMode; isFocusMode: boolean }>()
  const { data: tasks = [], isLoading, isError, refetch } = useListTasksQuery(sortMode === 'manual' ? undefined : sortMode)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [initialTab, setInitialTab] = useState<TabKey>('details')
  const [createModalStatus, setCreateModalStatus] = useState<Status | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Always derive the selected task from the live query data (not a stale snapshot)
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null



  const filteredTasks = tasks.filter(task => {
    // Search Filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Focus Mode Filter
    if (isFocusMode) {
      const isHighPriority = task.priority === 'P0' || task.priority === 'P1'
      const isActionable = task.status === 'Ready' || task.status === 'In Progress'
      return isHighPriority && isActionable
    }

    return true
  })

  const columns: Record<string, Task[]> = filteredTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    acc[task.status] = acc[task.status] || []
    acc[task.status].push(task)
    return acc
  }, {})

  const taskCounts = {
    total: tasks.length,
    inProgress: columns['In Progress']?.length || 0,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="px-4 md:px-8 py-3 md:py-5 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-20 bg-board-bg/95 backdrop-blur-sm border-b border-transparent gap-3 md:gap-0">

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search placeholder */}
          <div className="relative group flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-board-card/50 hover:bg-board-card border border-transparent hover:border-board-border text-sm rounded-lg pl-9 pr-4 py-2 w-full md:w-64 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Kanban Board Area */}
      <div className="flex-1 px-4 pb-4 overflow-x-auto overflow-y-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-board-border border-t-indigo-500 mb-4" />
              <p className="text-gray-500 text-sm">Loading tasks...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-sm">
              <p className="text-red-400 font-medium mb-2">Failed to load tasks</p>
              <button onClick={() => refetch()} className="text-sm text-red-300 hover:text-red-200 underline">
                Try again
              </button>
            </div>
          </div>
        ) : (
          <Board
            columns={columns}
            onTaskClick={(task, tab) => {
              setSelectedTaskId(task.id)
              setInitialTab(tab || 'details')
            }}
            sortMode={sortMode}
            onAdd={(status) => setCreateModalStatus(status)}
          />
        )}
      </div>

      {selectedTask && <TaskDetailModal task={selectedTask} initialTab={initialTab} onClose={() => setSelectedTaskId(null)} />}
      {createModalStatus && (
        <CreateTaskModal
          initialStatus={createModalStatus}
          onClose={() => setCreateModalStatus(null)}
        />
      )}
    </div>
  )
}
