import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  // Check if it's first visit (no theme set in localStorage)
  const isFirstVisit = !localStorage.getItem('theme')
  const [darkMode, setDarkMode] = useState(false) // default to light

  useEffect(() => {
    if (isFirstVisit) {
      // Force light mode on first visit
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
      setDarkMode(false)
    } else {
      const saved = localStorage.getItem('theme')
      const isDark = saved === 'dark'
      setDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev
      if (newMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return newMode
    })
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
