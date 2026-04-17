import React, { createContext, useContext } from 'react'
import toast, { Toaster } from 'react-hot-toast'

const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const showToast = (message, type = 'success') => {
    if (type === 'success') toast.success(message)
    else if (type === 'error') toast.error(message)
    else if (type === 'loading') toast.loading(message)
    else toast(message)
  }
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="top-right" />
    </ToastContext.Provider>
  )
}