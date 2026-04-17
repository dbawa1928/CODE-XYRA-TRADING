import { useEffect, useRef } from 'react'

export const usePullToRefresh = (onRefresh, threshold = 80) => {
  const startY = useRef(0)
  const refreshing = useRef(false)
  useEffect(() => {
    const handleTouchStart = (e) => { if (window.scrollY === 0) startY.current = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      const deltaY = e.touches[0].clientY - startY.current
      if (window.scrollY === 0 && deltaY > threshold && !refreshing.current) {
        refreshing.current = true
        onRefresh().finally(() => { refreshing.current = false })
      }
    }
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [onRefresh, threshold])
}