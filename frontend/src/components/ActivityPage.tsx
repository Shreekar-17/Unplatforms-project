import { useState } from 'react'
import clsx from 'clsx'
import { useListAllActivitiesQuery, useListTasksQuery } from '../features/tasks/tasksApi'
import { Activity } from '../features/tasks/types'

type ActivityFilter = 'all' | 'created' | 'updated' | 'moved' | 'commented' | 'deleted'

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

function formatRelativeTime(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const activityTypeIcon: Record<string, string> = {
    created: '🆕',
    commented: '💬',
    bulk_updated: '📦',
    deleted: '🗑️',
}

const activityTypeColor: Record<string, string> = {
    created: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    updated: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    moved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    commented: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    bulk_updated: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    deleted: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function describeActivity(activity: Activity): string {
    const { type, payload } = activity
    switch (type) {
        case 'created':
            return payload.title ? `Created task "${payload.title}"` : 'Created a task'
        case 'moved': {
            const from = payload.old_status || '—'
            const to = payload.new_status || '—'
            return `Moved from ${from} → ${to}`
        }
        case 'bulk_updated':
        case 'updated': {
            const changes: string[] = []
            if (payload.new_priority) {
                const old = payload.old_priority || '—'
                changes.push(`Changed priority ${old} → ${payload.new_priority}`)
            }
            if (payload.new_status) {
                const old = payload.old_status || '—'
                changes.push(`Changed status ${old} → ${payload.new_status}`)
            }
            if (payload.new_owner) changes.push(`Assigned to ${payload.new_owner}`)
            if (payload.title) changes.push(`Updated title`)
            if (payload.description) changes.push(`Updated description`)
            if (payload.estimate !== undefined) changes.push(`Updated estimate`)
            return changes.length > 0 ? changes.join(', ') : 'Updated task'
        }
        case 'commented':
            return payload.body || 'Added a comment'
        case 'deleted':
            return payload.title ? `Deleted task "${payload.title}"` : 'Deleted a task'
        default:
            return type
    }
}


interface ActivityPageProps {
    onBack: () => void
}

export default function ActivityPage({ onBack }: ActivityPageProps) {
    const { data: tasks = [] } = useListTasksQuery()
    const [filter, setFilter] = useState<ActivityFilter>('all')
    const { data: activities = [], isLoading, isFetching } = useListAllActivitiesQuery({
        limit: 200,
        offset: 0,
        type: filter === 'all' ? null : filter,
    })

    // Build task lookup for showing task titles
    const taskMap = new Map(tasks.map((t) => [t.id, t]))

    const filterOptions: { key: ActivityFilter; label: string; icon: string }[] = [
        { key: 'all', label: 'All Activity', icon: '📋' },
        { key: 'commented', label: 'Comments', icon: '💬' },
        { key: 'updated', label: 'Updates', icon: '✏️' },
        { key: 'moved', label: 'Moves', icon: '➡️' },
        { key: 'created', label: 'Created', icon: '🆕' },
    ]

    // Group activities by date
    const grouped = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
        const dateKey = new Date(activity.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        })
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(activity)
        return acc
    }, {})

    return (
        <div className="min-h-screen bg-board-bg text-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-board-surface border-b border-board-border sticky top-0 z-20">
                <div className="px-5 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-board-card rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                📋 Activity Feed
                                {isFetching && (
                                    <span className="w-4 h-4 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin" />
                                )}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {activities.length} entries across all tasks
                            </p>
                        </div>
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {filterOptions.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => setFilter(opt.key)}
                                className={clsx(
                                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5',
                                    filter === opt.key
                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                        : 'bg-board-card text-gray-400 hover:text-gray-200 border border-board-border hover:border-board-border-light'
                                )}
                            >
                                <span>{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Activity list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-board-border border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Loading activities...</p>
                        </div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="text-3xl mb-3">📭</div>
                            <p className="text-sm text-gray-400 font-medium">No activity found</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {filter !== 'all' ? 'Try a different filter' : 'Activities will appear here as you work'}
                            </p>
                            {filter !== 'all' && (
                                <button onClick={() => setFilter('all')} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                                    Clear filter
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto px-5 py-6">
                        {Object.entries(grouped).map(([dateLabel, dayActivities]) => (
                            <div key={dateLabel} className="mb-8">
                                {/* Date header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dateLabel}</h3>
                                    <div className="flex-1 h-px bg-board-border" />
                                    <span className="text-[10px] text-gray-600">{dayActivities.length}</span>
                                </div>

                                {/* Timeline */}
                                <div className="relative ml-4">
                                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-board-border" />

                                    <div className="space-y-0.5">
                                        {dayActivities.map((activity) => {
                                            const taskInfo = taskMap.get(activity.task_id)
                                            const desc = describeActivity(activity)
                                            const typeColor = activityTypeColor[activity.type] || activityTypeColor.bulk_updated

                                            return (
                                                <div key={activity.id} className="flex gap-3 py-3 relative group">
                                                    {/* Avatar */}
                                                    <div className={clsx(
                                                        'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 z-10',
                                                        getAvatarColor(activity.actor)
                                                    )}>
                                                        {getInitials(activity.actor)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                            <span className="text-[13px] font-medium text-gray-200">{activity.actor}</span>
                                                            <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', typeColor)}>
                                                                {activityTypeIcon[activity.type] || '📌'} {activity.type}
                                                            </span>
                                                            <span className="text-[11px] text-gray-600 ml-auto flex-shrink-0">
                                                                {formatRelativeTime(activity.created_at)}
                                                            </span>
                                                        </div>

                                                        {/* Task reference - show even if deleted (using payload title if needed) */}
                                                        {(taskInfo || activity.payload.title) && activity.type !== 'deleted' && (
                                                            <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">
                                                                <span className="text-gray-600">on</span>
                                                                <span className={clsx('font-medium truncate', taskInfo ? 'text-indigo-400' : 'text-gray-400 italic')}>
                                                                    {taskInfo ? taskInfo.title : activity.payload.title}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Activity description */}
                                                        {activity.type === 'commented' ? (
                                                            <div className="bg-board-card border border-board-border rounded-lg px-3 py-2 text-[13px] text-gray-300 leading-relaxed mt-1">
                                                                "{desc}"
                                                            </div>
                                                        ) : (
                                                            <p className="text-[13px] text-gray-400">{desc}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
