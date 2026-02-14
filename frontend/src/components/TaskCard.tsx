import { Task } from '../features/tasks/types'
import clsx from 'clsx'
import { useState } from 'react'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const priorityColor: Record<Task['priority'], string> = {
  P0: 'bg-rose-600/15 text-rose-700 border-rose-200',
  P1: 'bg-amber-500/15 text-amber-700 border-amber-200',
  P2: 'bg-sky-500/15 text-sky-700 border-sky-200',
  P3: 'bg-slate-200 text-slate-700 border-slate-300',
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      className="rounded border border-slate-200 bg-white shadow-sm p-3 space-y-2 hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-slate-900 line-clamp-2 flex-1">{task.title}</div>
        <span
          className={clsx(
            'text-[11px] px-2 py-1 rounded-full border font-semibold uppercase flex-shrink-0',
            priorityColor[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <div className="text-xs text-slate-600 line-clamp-2">{task.description}</div>
      )}
      <div className="flex items-center justify-between text-xs">
        {task.owner && <span className="text-slate-600">👤 {task.owner}</span>}
        {task.estimate && <span className="text-slate-500">{task.estimate}h</span>}
      </div>
    </div>
  )
}
