import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import { useCreateTaskMutation } from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/auth/authApi'
import { Priority, Status } from '../features/tasks/types'
import { selectCurrentUser } from '../features/auth/authSlice'

interface CreateTaskModalProps {
    initialStatus?: Status
    onClose: () => void
}

const statusOptions: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done']
const priorityOptions: Priority[] = ['P0', 'P1', 'P2', 'P3']

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
    P0: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15' },
    P1: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    P2: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    P3: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

export function CreateTaskModal({ initialStatus = 'Backlog', onClose }: CreateTaskModalProps) {
    const [createTask, { isLoading }] = useCreateTaskMutation()
    const { data: users = [] } = useGetUsersQuery()
    const currentUser = useSelector(selectCurrentUser)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<Status>(initialStatus)
    const [priority, setPriority] = useState<Priority>('P2')
    const [owner, setOwner] = useState(currentUser?.username || '')
    const [estimate, setEstimate] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!title.trim()) return
        setError(null)

        // Validate owner
        if (owner && !users.find((u) => u.username === owner)) {
            setError(`User '${owner}' not found. Please select a valid user.`)
            return
        }

        try {
            await createTask({
                title,
                description: description || undefined,
                status,
                priority,
                owner: owner || undefined,
                estimate: estimate ? parseInt(estimate) : undefined,
            }).unwrap()
            onClose()
        } catch (err) {
            console.error('Failed to create task:', err)
            setError('Failed to create task.')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-board-surface border border-board-border rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-board-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">New Task</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition p-1.5 rounded-lg hover:bg-board-card">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{error}</div>
                    )}

                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            autoFocus
                            className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Add a more detailed description..."
                            className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as Status)}
                                className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                            >
                                {priorityOptions.map((p) => (
                                    <option key={p} value={p}>{p} — {priorityConfig[p].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Owner</label>
                            <input
                                type="text"
                                value={owner}
                                onChange={(e) => setOwner(e.target.value)}
                                placeholder="Assign to..."
                                list="create-users-list"
                                className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                            />
                            <datalist id="create-users-list">
                                {users.map((user) => (
                                    <option key={user.id} value={user.username} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Estimate (hours)</label>
                            <input
                                type="number"
                                value={estimate}
                                onChange={(e) => setEstimate(e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg bg-board-card border border-board-border px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-board-border flex justify-end gap-3 rounded-b-xl bg-board-surface">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 bg-board-card border border-board-border rounded-lg hover:bg-board-card-hover hover:text-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !title.trim()}
                        className={clsx(
                            'px-5 py-2 text-sm font-medium text-white rounded-lg transition-all',
                            isLoading || !title.trim()
                                ? 'bg-indigo-800 text-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20'
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            'Create Task'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
