import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useGetUsersQuery } from '../features/auth/authApi'

function getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string): string {
    const colors = [
        'bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-600',
        'bg-purple-600', 'bg-cyan-600', 'bg-pink-600', 'bg-teal-600',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

export default function MembersPage() {
    const navigate = useNavigate()
    const { data: users = [], isLoading } = useGetUsersQuery()

    return (
        <div className="min-h-screen bg-board-bg text-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-board-surface border-b border-board-border sticky top-0 z-20">
                <div className="px-5 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-board-card rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                👥 Team Members
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {users.length} active members
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Loading members...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {users.map((user) => (
                                <div key={user.id} className="bg-board-surface border border-board-border rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/50 transition-colors group">
                                    <div className={clsx(
                                        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-lg',
                                        getAvatarColor(user.username)
                                    )}>
                                        {getInitials(user.username)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-medium text-white group-hover:text-indigo-400 transition-colors truncate">
                                            {user.username}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {user.email || 'No email provided'}
                                        </p>
                                    </div>
                                    {/* Status Indicator (Mock for now, could be real later) */}
                                    <div className="flex-shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-board-surface ring-1 ring-emerald-500/20" title="Online" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
