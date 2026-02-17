import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { SortMode } from './Board'
import { useState } from 'react'
import { useCreateTaskMutation } from '../features/tasks/tasksApi'
import { Priority, Status } from '../features/tasks/types'
import { useToast } from './Toast'
import {
    TbLayoutKanban,
    TbTimeline,
    TbUsers,
    TbTargetArrow,
    TbHandStop,
    TbFlame,
    TbCalendarTime,
    TbLogout,
    TbLayoutSidebarLeftCollapse
} from 'react-icons/tb'

interface SidebarProps {
    currentSort?: SortMode
    onSortChange?: (mode: SortMode) => void
    currentUser: { username: string; email?: string } | null
    onLogout: () => void
    isOpen?: boolean
    onClose?: () => void
    isFocusMode?: boolean
    onToggleFocusMode?: () => void
}

const NAV_ITEMS = [
    { label: 'Board', path: '/', icon: <TbLayoutKanban className="w-5 h-5" /> },
    { label: 'Timeline', path: '/activity', icon: <TbTimeline className="w-5 h-5" /> },
    { label: 'Members', path: '/members', icon: <TbUsers className="w-5 h-5" /> },
]

export function Sidebar({ currentSort, onSortChange, currentUser, onLogout, isOpen, onClose, isFocusMode, onToggleFocusMode }: SidebarProps) {
    const location = useLocation()
    const path = location.pathname
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState<Priority>('P2')
    const [status, setStatus] = useState<Status>('Backlog')
    const { showToast } = useToast()

    const handleCreate = async () => {
        if (!title.trim()) return
        try {
            await createTask({ title, priority, status }).unwrap()
            setTitle('')
            setPriority('P2')
            setStatus('Backlog')
            showToast('Task created successfully', 'success')
        } catch (err) {
            console.error('Failed to create task', err)
            showToast('Failed to create task', 'error')
        }
    }

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-board-surface border-r border-board-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-board-border/50 hidden md:flex">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                        <TbLayoutKanban className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-bold text-white tracking-tight">Task Board</h1>
                </div>

                {/* Mobile Close Button Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-board-border/50 md:hidden">
                    <span className="font-bold text-lg text-white">Menu</span>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                        <TbLayoutSidebarLeftCollapse className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                    {/* Main Nav */}
                    <div className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = path === item.path
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={onClose}
                                    className={clsx(
                                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-board-card text-indigo-400'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                                    )}
                                >
                                    <span className="mr-3 opacity-80">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Sort Options */}
                    {currentSort && onSortChange && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                                View Options
                            </h3>

                            {/* Focus Mode Toggle */}
                            <div className="px-3 mb-4">
                                <button
                                    onClick={onToggleFocusMode}
                                    className={clsx(
                                        'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md',
                                        isFocusMode
                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white ring-1 ring-white/20 shadow-indigo-500/20'
                                            : 'bg-board-card text-gray-400 hover:text-white hover:bg-board-card-hover border border-board-border'
                                    )}
                                >
                                    <span className={clsx("transition-transform text-lg", isFocusMode && "scale-110")}>
                                        <TbTargetArrow />
                                    </span>
                                    {isFocusMode ? 'Focus Active' : 'Focus Mode'}
                                </button>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => onSortChange('manual')}
                                    className={clsx(
                                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        currentSort === 'manual' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                                    )}
                                >
                                    <span className="flex items-center">
                                        <span className="mr-3 opacity-80 text-lg"><TbHandStop /></span>
                                        Manual
                                    </span>
                                    {currentSort === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                </button>
                                <button
                                    onClick={() => onSortChange('priority')}
                                    className={clsx(
                                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        currentSort === 'priority' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                                    )}
                                >
                                    <span className="flex items-center">
                                        <span className="mr-3 opacity-80 text-lg"><TbFlame /></span>
                                        Priority
                                    </span>
                                    {currentSort === 'priority' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                </button>
                                <button
                                    onClick={() => onSortChange('created')}
                                    className={clsx(
                                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        currentSort === 'created' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                                    )}
                                >
                                    <span className="flex items-center">
                                        <span className="mr-3 opacity-80 text-lg"><TbCalendarTime /></span>
                                        Date Created
                                    </span>
                                    {currentSort === 'created' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Quick Add Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                            Quick Add
                        </h3>
                        <div className="bg-board-card/30 rounded-lg p-3 space-y-3 border border-board-border/30 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="Add new task..."
                                className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                            />
                            <div className="flex flex-col gap-3 pt-2 border-t border-board-border/20">
                                <div className="flex items-center gap-2">
                                    <div className="relative group flex-1">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as Status)}
                                            className="w-full bg-transparent text-[11px] font-medium text-gray-400 focus:outline-none cursor-pointer hover:text-indigo-400 transition uppercase tracking-wide appearance-none"
                                        >
                                            <option value="Backlog" className="bg-board-card">Backlog</option>
                                            <option value="Ready" className="bg-board-card">Ready</option>
                                            <option value="In Progress" className="bg-board-card">In Progress</option>
                                            <option value="Review" className="bg-board-card">Review</option>
                                            <option value="Done" className="bg-board-card">Done</option>
                                        </select>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-gray-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <div className="w-px h-3 bg-board-border/50" />
                                    <div className="relative group flex-1">
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as Priority)}
                                            className="w-full bg-transparent text-[11px] font-medium text-gray-400 focus:outline-none cursor-pointer hover:text-indigo-400 transition uppercase tracking-wide appearance-none"
                                        >
                                            <option value="P0" className="bg-board-card text-red-400">Critical</option>
                                            <option value="P1" className="bg-board-card text-amber-400">High</option>
                                            <option value="P2" className="bg-board-card text-blue-400">Medium</option>
                                            <option value="P3" className="bg-board-card text-emerald-400">Low</option>
                                        </select>
                                        {/* Custom arrow for select */}
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-gray-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreate}
                                    disabled={!title.trim() || isCreating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                                >
                                    {isCreating ? 'Creating...' : 'Add Task'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-board-border">
                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white border-2 border-board-surface cursor-pointer hover:opacity-90">
                                {currentUser.username?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser.username || 'User'}</p>
                            </div>
                            <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors" title="Logout">
                                <TbLogout className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Link to="/login" className="text-sm font-medium text-indigo-400 hover:underline">Log in</Link>
                        </div>
                    )}
                </div>

            </div>
        </>
    )
}
