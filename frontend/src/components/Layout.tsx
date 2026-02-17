import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import { useState } from 'react'

import { SortMode } from './Board'

export function Layout() {
    const currentUser = useSelector(selectCurrentUser)
    const dispatch = useDispatch()
    const [sortMode, setSortMode] = useState<SortMode>('manual')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        dispatch(logout())
    }

    return (
        <div className="min-h-screen bg-board-bg text-gray-100 font-sans flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-board-surface border-b border-board-border flex items-center justify-between px-4 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-board-card rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-lg tracking-tight text-white">TaskFlow</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black border-2 border-board-surface">
                    {currentUser?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
            </div>

            <Sidebar
                currentSort={sortMode}
                onSortChange={setSortMode}
                currentUser={currentUser}
                onLogout={handleLogout}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden">
                <Outlet context={{ sortMode, setSortMode }} />
            </div>
        </div>
    )
}
