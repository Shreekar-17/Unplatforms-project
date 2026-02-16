import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsAuthenticated, setCredentials, setLoading } from './features/auth/authSlice'
import { useLayoutEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import BoardPage from './components/BoardPage'
import ActivityPage from './components/ActivityPage'
import MembersPage from './components/MembersPage'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Component to initialize auth state
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const { isLoading } = useSelector((state: any) => state.auth)

  useLayoutEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const user = await res.json()
          dispatch(setCredentials({ user }))
        } else {
          dispatch(setLoading(false))
        }
      } catch (err) {
        dispatch(setLoading(false))
      }
    }
    checkAuth()
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-board-bg text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<BoardPage />} />
              <Route path="/activity" element={<ActivityPage onBack={() => window.history.back()} />} />
              <Route path="/members" element={<MembersPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthInitializer>
    </BrowserRouter>
  )
}

export default App

