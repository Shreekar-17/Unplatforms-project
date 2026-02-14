import { Task } from '../features/tasks/types'
import { Column } from './Column'

interface BoardProps {
  columns: Record<string, Task[]>
  onTaskClick: (task: Task) => void
}

export function Board({ columns, onTaskClick }: BoardProps) {
  const columnOrder = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done']
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {columnOrder.map((col) => (
        <Column key={col} title={col} tasks={columns[col] || []} onTaskClick={onTaskClick} />
      ))}
    </div>
  )
}
