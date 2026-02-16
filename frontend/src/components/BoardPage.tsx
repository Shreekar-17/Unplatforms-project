import { useListTasksQuery, useCreateTaskMutation } from '../features/tasks/tasksApi'
import { Task, Priority } from '../features/tasks/types'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import { Board, SortMode } from './Board'
import { TaskDetailModal } from './TaskDetailModal'
import clsx from 'clsx'

export default function BoardPage() {
  const { data: tasks = [], isLoading, isError, refetch } = useListTasksQuery()
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('P2')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const handleCreate = async () => {
    if (!title.trim()) return
    try {
      await createTask({ title, priority }).unwrap()
      setTitle('')
      setPriority('P2')
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  const columns: Record<string, Task[]> = tasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    acc[task.status] = acc[task.status] || []
    acc[task.status].push(task)
    return acc
  }, {})

  const taskCounts = {
    total: tasks.length,
    inProgress: columns['In Progress']?.length || 0,
  }

  const sortOptions: { key: SortMode; label: string; icon: string }[] = [
    { key: 'manual', label: 'Manual', icon: '✋' },
    { key: 'priority', label: 'Priority', icon: '🔥' },
    { key: 'created', label: 'Date', icon: '📅' },
  ]

  return (
    <div className="min-h-screen bg-board-bg text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-board-surface border-b border-board-border sticky top-0 z-20">
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Project info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base font-bold text-white">TaskFlow</h1>
                </div>
              </div>
              <div className="h-5 w-px bg-board-border" />
              <span className="text-sm text-gray-400">
                {taskCounts.total} tasks • {taskCounts.inProgress} in progress
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Sort toggle */}
              <div className="flex items-center bg-board-card border border-board-border rounded-lg p-0.5 mr-2">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortMode(opt.key)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                      sortMode === opt.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    )}
                    title={`Sort by ${opt.label}${opt.key === 'manual' ? ' (drag & drop enabled)' : ' (drag disabled)'}`}
                  >
                    <span className="mr-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => refetch()}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-board-card rounded-lg transition"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {currentUser && (
                <div className="flex items-center gap-2 ml-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.username?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-board-card rounded-lg transition"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick add bar */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 relative">
              <input
                className="w-full rounded-lg bg-board-card border border-board-border px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="+ Quick add task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-lg bg-board-card border border-board-border px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
            >
              <option value="P0">🔴 Critical</option>
              <option value="P1">🟠 High</option>
              <option value="P2">🔵 Medium</option>
              <option value="P3">🟢 Low</option>
            </select>
            <button
              className="rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-500/20"
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                '+ New Task'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Board content */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-board-border border-t-indigo-500 mb-4" />
            <p className="text-gray-500 text-sm">Loading tasks...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center flex-1">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-sm">
            <p className="text-red-400 font-medium mb-2">Failed to load tasks</p>
            <button onClick={() => refetch()} className="text-sm text-red-300 hover:text-red-200 underline">
              Try again
            </button>
          </div>
        </div>
      ) : (
        <Board columns={columns} onTaskClick={setSelectedTask} sortMode={sortMode} />
      )}

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}
