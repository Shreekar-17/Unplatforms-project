import { TaskCard } from './TaskCard'
import { Task } from '../features/tasks/types'

interface ColumnProps {
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function Column({ title, tasks, onTaskClick }: ColumnProps) {
  const sortedTasks = [...tasks].sort(
    (a, b) => a.ordering_index - b.ordering_index || a.title.localeCompare(b.title)
  )

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-lg">
        <div className="font-semibold text-sm text-slate-800">{title}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{tasks.length}</div>
        </div>
      </div>
      <div className="p-3 space-y-3 flex-1">
        {sortedTasks.length === 0 ? (
          <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded p-6 text-center">
            No tasks in {title}
          </div>
        ) : (
          sortedTasks.map((task) => <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)
        )}
      </div>
    </div>
  )
}
