import { useListTasksQuery } from '../features/tasks/tasksApi'
import { Task, Priority, Status, TabKey } from '../features/tasks/types'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import { Board, SortMode } from './Board'
import { TaskDetailModal } from './TaskDetailModal'
import { CreateTaskModal } from './CreateTaskModal'
import clsx from 'clsx'

export default function BoardPage() {
  const { data: tasks = [], isLoading, isError, refetch } = useListTasksQuery()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [initialTab, setInitialTab] = useState<TabKey>('details')
  const { sortMode } = useOutletContext<{ sortMode: SortMode }>()
  const [createModalStatus, setCreateModalStatus] = useState<Status | null>(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()



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
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="px-8 py-5 flex items-center justify-between sticky top-0 z-20 bg-board-bg/95 backdrop-blur-sm border-b border-transparent">

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
            onAdd={(status) => setCreateModalStatus(status)}
          />
        )}
      </div>

      {selectedTask && <TaskDetailModal task={selectedTask} initialTab={initialTab} onClose={() => setSelectedTask(null)} />}
      {createModalStatus && (
        <CreateTaskModal
          initialStatus={createModalStatus}
          onClose={() => setCreateModalStatus(null)}
        />
      )}
    </div>
  )
}
