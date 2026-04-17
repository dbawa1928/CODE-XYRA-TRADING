import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const useInactivity = (timeoutMinutes = 3) => {
  const { logout, user } = useAuth()
  const timerRef = useRef()

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (user) {
      timerRef.current = setTimeout(() => {
        logout()
        window.location.href = '/login'
      }, timeoutMinutes * 60 * 1000)
    }
  }

  useEffect(() => {
    if (!user) return

    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll']
    resetTimer()
    events.forEach(event => window.addEventListener(event, resetTimer))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [user])
}