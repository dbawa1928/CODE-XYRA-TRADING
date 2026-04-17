import { useEffect, useRef } from 'react'

export const useAutoSave = (key, data, delay = 1500) => {
  const timeoutRef = useRef()
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (data && data.farmerName) localStorage.setItem(key, JSON.stringify(data))
    }, delay)
    return () => clearTimeout(timeoutRef.current)
  }, [data, key, delay])
  const loadDraft = () => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  }
  const clearDraft = () => localStorage.removeItem(key)
  return { loadDraft, clearDraft }
}