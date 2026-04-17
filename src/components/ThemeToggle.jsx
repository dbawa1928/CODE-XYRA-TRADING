import { useTheme } from '../contexts/ThemeContext'
import { FaSun, FaMoon } from 'react-icons/fa'

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme()
  return (
    <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition">
      {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
    </button>
  )
}
export default ThemeToggle