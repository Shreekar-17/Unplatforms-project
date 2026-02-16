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

    const handleLogout = () => {
        dispatch(logout())
    }

    return (
        <div className="min-h-screen bg-board-bg text-gray-100 font-sans flex">
            <Sidebar
                currentSort={sortMode}
                onSortChange={setSortMode}
                currentUser={currentUser}
                onLogout={handleLogout}
            />
            <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
                <Outlet context={{ sortMode, setSortMode }} />
            </div>
        </div>
    )
}
