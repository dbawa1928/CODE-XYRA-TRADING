import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { GiFarmer, GiWheat } from 'react-icons/gi'
import { FaSignOutAlt } from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = () => {
  const { logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-shrink min-w-0"
            onClick={() => navigate('/home')}
          >
            <div className="bg-white rounded-full p-1.5 shadow-md flex-shrink-0">
              <GiFarmer className="text-primary text-xl sm:text-2xl" />
              <GiWheat className="text-yellow-500 text-base sm:text-lg -mt-2 ml-0.5" />
            </div>
            <h1 className="text-white font-bold text-sm sm:text-base md:text-lg truncate">
              {t('appName')}
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium"
            >
              <FaSignOutAlt size={14} className="sm:text-base" />
              <span className="hidden xs:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
export default Navbar