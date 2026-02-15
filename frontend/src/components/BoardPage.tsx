import { useListTasksQuery, useCreateTaskMutation } from '../features/tasks/tasksApi'
import { Task, Priority } from '../features/tasks/types'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import { Board } from './Board'
import { TaskDetailModal } from './TaskDetailModal'

export default function BoardPage() {
  const { data: tasks = [], isLoading, isError, refetch } = useListTasksQuery()
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('P2')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
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
    backlog: columns['Backlog']?.length || 0,
    inProgress: columns['In Progress']?.length || 0,
    done: columns['Done']?.length || 0,
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Team Task Board</h1>
              <p className="text-sm text-slate-600 mt-1">
                Priority-aware Kanban • {taskCounts.total} tasks • {taskCounts.inProgress} in progress
                {currentUser && ` • ${currentUser.username}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Quick add task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
            </select>
            <button
              className="rounded bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p className="text-slate-600">Loading tasks...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-medium">Failed to load tasks</p>
            <button onClick={() => refetch()} className="mt-2 text-sm text-red-600 hover:text-red-800 underline">
              Try again
            </button>
          </div>
        </div>
      ) : (
        <Board columns={columns} onTaskClick={setSelectedTask} />
      )}

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  )
}
