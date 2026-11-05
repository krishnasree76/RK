import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Sends signed-out visitors to the sign-in page and back here afterwards.
export default function RequireAuth({ children }) {
  const { isAuthenticated, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) {
    return (
      <section className="section">
        <div className="container empty-state" aria-busy="true">
          <p>Loading your account…</p>
        </div>
      </section>
    )
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/signin?next=${next}`} replace />
  }
  return children
}
