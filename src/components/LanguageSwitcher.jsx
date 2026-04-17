import { useLanguage } from '../contexts/LanguageContext'
import { FaGlobe } from 'react-icons/fa'

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage()
  return (
    <div className="relative inline-block">
      <div className="group">
        <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition">
          <FaGlobe /> {language === 'en' ? 'EN' : language === 'hi' ? 'हिंदी' : 'ਪੰਜਾਬੀ'}
        </button>
        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
          <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">English</button>
          <button onClick={() => changeLanguage('hi')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">हिंदी</button>
          <button onClick={() => changeLanguage('pa')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">ਪੰਜਾਬੀ</button>
        </div>
      </div>
    </div>
  )
}
export default LanguageSwitcher