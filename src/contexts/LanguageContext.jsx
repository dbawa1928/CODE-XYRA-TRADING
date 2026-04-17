import React, { createContext, useState, useContext, useEffect } from 'react'
import { translations } from '../utils/translations'

const LanguageContext = createContext()
export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('language')
    if (saved && ['en', 'hi', 'pa'].includes(saved)) setLanguage(saved)
  }, [])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key) => translations[language]?.[key] || translations.en[key] || key

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}