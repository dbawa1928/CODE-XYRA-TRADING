import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Super admin can only access admin dashboard and profile
  if (user.role === 'super_admin') {
    const currentPath = window.location.pathname
    const allowedPaths = ['/admin-dashboard', '/profile']
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/admin-dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute