import { useListTasksQuery, useCreateTaskMutation } from '../features/tasks/tasksApi'
import { Task, Priority, TabKey } from '../features/tasks/types'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import { Board, SortMode } from './Board'
import { TaskDetailModal } from './TaskDetailModal'
import { Sidebar } from './Sidebar'
import clsx from 'clsx'

export default function BoardPage() {
  const { data: tasks = [], isLoading, isError, refetch } = useListTasksQuery()
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('P2')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [initialTab, setInitialTab] = useState<TabKey>('details')
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-board-bg text-gray-100 font-sans flex">
      {/* Sidebar */}
      <Sidebar
        currentSort={sortMode}
        onSortChange={setSortMode}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="px-8 py-5 flex items-center justify-between sticky top-0 z-20 bg-board-bg/95 backdrop-blur-sm border-b border-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">API Platform</h2>
              <span className="text-xs font-semibold text-gray-400 bg-board-card px-2 py-0.5 rounded border border-board-border/50">Sprint 14</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{taskCounts.total} tasks</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search placeholder */}
            <div className="relative group hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="bg-board-card/50 hover:bg-board-card border border-transparent hover:border-board-border text-sm rounded-lg pl-9 pr-4 py-2 w-64 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Quick Add Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  className="w-56 lg:w-64 rounded-lg bg-board-card border border-board-border px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  placeholder="+ Quick add task..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="P0">🔴 Critical</option>
                <option value="P1">🟠 High</option>
                <option value="P2">🔵 Medium</option>
                <option value="P3">🟢 Low</option>
              </select>
              <button
                className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-500/20 whitespace-nowrap"
                onClick={handleCreate}
                disabled={isCreating || !title.trim()}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                ) : (
                  '+ Add'
                )}
              </button>
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
                setSelectedTask(task)
                setInitialTab(tab || 'details')
              }}
              sortMode={sortMode}
            />
          )}
        </div>

        {selectedTask && <TaskDetailModal task={selectedTask} initialTab={initialTab} onClose={() => setSelectedTask(null)} />}
      </div>
    </div>
  )
}
