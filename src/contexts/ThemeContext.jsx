// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  // Always start with light mode (ignore saved and system preference)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Force light mode on first load
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
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
