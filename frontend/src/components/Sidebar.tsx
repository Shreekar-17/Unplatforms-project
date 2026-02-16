import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { SortMode } from './Board'

interface SidebarProps {
    currentSort: SortMode
    onSortChange: (mode: SortMode) => void
    currentUser: { username: string; email?: string } | null
    onLogout: () => void
}

const NAV_ITEMS = [
    { label: 'Board', path: '/', icon: 'content_paste' },
    { label: 'Priority Queue', path: '#', icon: 'format_list_numbered', disabled: true },
    { label: 'Timeline', path: '/activity', icon: 'schedule' },
    { label: 'Members', path: '#', icon: 'group', disabled: true },
    { label: 'Settings', path: '#', icon: 'settings', disabled: true },
]

const PROJECTS = [
    { label: 'API Platform', color: 'bg-yellow-500' },
    { label: 'Mobile App', color: 'bg-blue-500' },
    { label: 'Infrastructure', color: 'bg-orange-500' },
    { label: 'Marketing Site', color: 'bg-pink-500' },
]

export function Sidebar({ currentSort, onSortChange, currentUser, onLogout }: SidebarProps) {
    const location = useLocation()
    const path = location.pathname

    return (
        <div className="w-64 h-screen bg-board-surface border-r border-board-border flex flex-col shrink-0 fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-board-border/50">
                <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center mr-3 shadow-lg shadow-yellow-500/20">
                    <svg className="w-5 h-5 text-black" fill="bg-board-bg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">TaskFlow</h1>
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
                                className={clsx(
                                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-board-card text-yellow-500'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50',
                                    item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                                )}
                            >
                                {/* Simple SVG icons */}
                                <span className="mr-3 opacity-80">
                                    {/* Simplified icon logic for prototype; in real app use an icon content map or library */}
                                    {item.label === 'Board' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    )}
                                    {item.label === 'Timeline' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                    {item.label === 'Priority Queue' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                    )}
                                    {item.label === 'Members' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    )}
                                    {item.label === 'Settings' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                </span>
                                {item.label}
                            </Link>
                        )
                    })}
                </div>

                {/* Projects */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Projects
                    </h3>
                    <div className="space-y-1">
                        {PROJECTS.map((project, idx) => (
                            <button
                                key={project.label}
                                className={clsx(
                                    'w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    idx === 0 ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                                )}
                            >
                                <span className={clsx('w-2 h-2 rounded-sm mr-3', project.color)} />
                                {project.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Options (Moved from Top Header) */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Sort View
                    </h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => onSortChange('manual')}
                            className={clsx(
                                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                currentSort === 'manual' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                            )}
                        >
                            <span className="flex items-center">
                                <span className="mr-3 opacity-80">✋</span>
                                Manual
                            </span>
                            {currentSort === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                        </button>
                        <button
                            onClick={() => onSortChange('priority')}
                            className={clsx(
                                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                currentSort === 'priority' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                            )}
                        >
                            <span className="flex items-center">
                                <span className="mr-3 opacity-80">🔥</span>
                                Priority
                            </span>
                            {currentSort === 'priority' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                        </button>
                        <button
                            onClick={() => onSortChange('created')}
                            className={clsx(
                                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                currentSort === 'created' ? 'bg-board-card text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-board-card/50'
                            )}
                        >
                            <span className="flex items-center">
                                <span className="mr-3 opacity-80">📅</span>
                                Date
                            </span>
                            {currentSort === 'created' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                        </button>
                    </div>
                </div>

            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-board-border">
                {currentUser ? (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-bold text-black border-2 border-board-surface cursor-pointer hover:opacity-90">
                            {currentUser.username?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{currentUser.username || 'User'}</p>
                        </div>
                        <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors" title="Logout">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <Link to="/login" className="text-sm font-medium text-yellow-500 hover:underline">Log in</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
