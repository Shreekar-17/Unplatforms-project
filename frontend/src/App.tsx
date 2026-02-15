import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './features/auth/authSlice'
import Login from './components/Login'
import Signup from './components/Signup'
import BoardPage from './components/BoardPage'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
