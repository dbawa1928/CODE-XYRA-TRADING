import { useNavigate, useLocation } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'

const BackButton = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const hidePaths = ['/login', '/', '/home', '/register']
  if (hidePaths.includes(location.pathname)) return null
  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-7xl mt-2">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-medium transition text-sm sm:text-base"
      >
        <FaArrowLeft size={14} className="sm:text-base" /> Back
      </button>
    </div>
  )
}
export default BackButton