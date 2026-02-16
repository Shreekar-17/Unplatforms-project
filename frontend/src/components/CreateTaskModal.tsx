import { useState } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { useCreateTaskMutation } from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/auth/authApi'
import { Priority, Status } from '../features/tasks/types'
import { selectCurrentUser } from '../features/auth/authSlice'
import { TbAlertCircleFilled, TbArrowUpCircle, TbCircle, TbArrowDownCircle, TbCheck } from 'react-icons/tb'
import { RichTextEditor } from './RichTextEditor'

interface CreateTaskModalProps {
    initialStatus?: Status
    onClose: () => void
}

const statusOptions: Status[] = ['Backlog', 'Ready', 'In Progress', 'Review', 'Done']

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
    P0: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15', icon: <TbAlertCircleFilled /> },
    P1: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: <TbArrowUpCircle /> },
    P2: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <TbCircle /> },
    P3: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <TbArrowDownCircle /> },
}

const priorityOptions: Priority[] = ['P0', 'P1', 'P2', 'P3']

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
    const [createError, setCreateError] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!title.trim()) return
        setCreateError(null)

        if (owner && !users.find((u) => u.username === owner)) {
            setCreateError(`User '${owner}' not found. Please select a valid user.`)
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
            setCreateError('Failed to create task.')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
            <div
                className="bg-board-surface border border-board-border rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="px-8 pt-8 pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="text-xs uppercase tracking-wider font-semibold">NEW TASK</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-100 p-2 hover:bg-board-card rounded-full transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="mr-8">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            autoFocus
                            className="w-full bg-transparent text-3xl font-bold text-gray-100 placeholder-gray-600 focus:outline-none focus:bg-board-bg focus:ring-2 focus:ring-indigo-500 rounded px-2 -ml-2 transition py-1"
                        />
                        <div className="text-sm text-gray-400 mt-2 ml-1">
                            in list <span className="text-gray-300 font-medium underline decoration-gray-600 underline-offset-2">{status}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    {createError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{createError}</div>
                    )}

                    {/* Properties Row */}
                    <div className="flex flex-wrap gap-6 mb-8">
                        {/* Status */}
                        <div className="min-w-[120px]">
                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</h4>
                            <div className="relative">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as Status)}
                                    className="w-full appearance-none bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition font-medium pr-8"
                                >
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="min-w-[120px]">
                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</h4>
                            <div className="relative">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                                    <span className={priorityConfig[priority].color}>{priorityConfig[priority].icon}</span>
                                </div>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className="w-full appearance-none bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 pl-8 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition font-medium pr-8"
                                >
                                    {priorityOptions.map(p => (
                                        <option key={p} value={p}>{priorityConfig[p].label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="min-w-[150px]">
                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assignee</h4>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={owner}
                                    onChange={(e) => setOwner(e.target.value)}
                                    placeholder="Unassigned"
                                    list="create-users-list"
                                    className="w-full bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-500 font-medium"
                                />
                                <datalist id="create-users-list">
                                    {users.map(u => <option key={u.id} value={u.username} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Estimate */}
                        <div className="min-w-[100px]">
                            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estimate</h4>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={estimate}
                                    onChange={(e) => setEstimate(e.target.value)}
                                    placeholder="0h"
                                    className="w-full bg-board-card hover:bg-board-card-hover border border-board-border rounded px-2.5 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition placeholder-gray-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            <h3 className="text-base font-semibold text-gray-200">Description</h3>
                        </div>
                        <div className="pl-8">
                            <RichTextEditor value={description} onChange={setDescription} />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-board-border bg-board-bg/50 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 bg-transparent hover:bg-board-card border border-transparent hover:border-board-border rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !title.trim()}
                        className={clsx(
                            'px-6 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20',
                            isLoading || !title.trim()
                                ? 'bg-indigo-800 text-indigo-400 cursor-not-allowed opacity-50'
                                : 'bg-indigo-600 hover:bg-indigo-500'
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
