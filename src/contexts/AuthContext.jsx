import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastContext'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Helper: fetch user from database by id
  const refreshUser = async (userId) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, tenant_id')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    const userData = {
      id: data.id,
      username: data.username,
      role: data.role,
      tenantId: data.tenant_id || data.id
    }
    localStorage.setItem('cx_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  // On app load, restore user from localStorage and refresh if needed
  useEffect(() => {
    const storedUser = localStorage.getItem('cx_user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      refreshUser(parsed.id).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Register a new admin (each user is their own tenant)
  const register = async (username, password) => {
    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (existing) {
      showToast('Username already exists', 'error')
      return false
    }
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ username, password, role: 'admin' }])
      .select()
      .single()
    if (error) {
      showToast('Registration failed', 'error')
      return false
    }
    // Set tenant_id = own id
    await supabase.from('users').update({ tenant_id: newUser.id }).eq('id', newUser.id)
    const userData = { id: newUser.id, username, role: 'admin', tenantId: newUser.id }
    localStorage.setItem('cx_user', JSON.stringify(userData))
    setUser(userData)
    showToast('Registration successful', 'success')
    return true
  }

  // Login with username/password OR biometric (password = 'biometric')
  const login = async (username, password) => {
    // Special case for biometric login
    if (password === 'biometric') {
      const savedUsername = localStorage.getItem('biometric_username')
      if (savedUsername !== username) {
        showToast('Biometric username mismatch', 'error')
        return false
      }
      // Fetch user data from database using the username
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, tenant_id')
        .eq('username', username)
        .maybeSingle()
      if (error || !data) {
        showToast('User not found', 'error')
        return false
      }
      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        tenantId: data.tenant_id || data.id
      }
      localStorage.setItem('cx_user', JSON.stringify(userData))
      setUser(userData)
      showToast(`Welcome ${data.username}`, 'success')
      return true
    }

    // Normal password login
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, tenant_id')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()
    if (error || !data) {
      showToast('Invalid username or password', 'error')
      return false
    }
    const userData = {
      id: data.id,
      username: data.username,
      role: data.role,
      tenantId: data.tenant_id || data.id
    }
    localStorage.setItem('cx_user', JSON.stringify(userData))
    setUser(userData)
    showToast(`Welcome ${data.username}`, 'success')
    return true
  }

  const logout = () => {
    localStorage.removeItem('cx_user')
    // Do NOT remove biometric data – that would be a user choice
    setUser(null)
  }

  // Change password (requires old password)
  const changePassword = async (oldPassword, newPassword) => {
    if (!user) return false
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .eq('password', oldPassword)
      .maybeSingle()
    if (error || !data) {
      showToast('Old password is incorrect', 'error')
      return false
    }
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id)
    if (updateError) {
      showToast('Failed to update password', 'error')
      return false
    }
    showToast('Password changed successfully', 'success')
    return true
  }

  // Change username (requires password confirmation)
  const changeUsername = async (newUsername, password) => {
    if (!user) return false
    // Verify password
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .eq('password', password)
      .maybeSingle()
    if (error || !data) {
      showToast('Incorrect password', 'error')
      return false
    }
    // Check if new username already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', newUsername)
      .maybeSingle()
    if (existing) {
      showToast('Username already taken', 'error')
      return false
    }
    const { error: updateError } = await supabase
      .from('users')
      .update({ username: newUsername })
      .eq('id', user.id)
    if (updateError) {
      showToast('Failed to update username', 'error')
      return false
    }
    const updatedUser = { ...user, username: newUsername }
    localStorage.setItem('cx_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    showToast('Username changed successfully', 'success')
    return true
  }

  // Worker management (admin only)
  const addWorker = async (username, password) => {
    if (user.role !== 'admin') return false
    const { error } = await supabase
      .from('users')
      .insert([{
        username,
        password,
        role: 'worker',
        created_by: user.id,
        tenant_id: user.tenantId
      }])
    if (error) {
      showToast('Username already exists', 'error')
      return false
    }
    showToast(`Worker ${username} added`, 'success')
    return true
  }

  const deleteWorker = async (workerId) => {
    if (user.role !== 'admin') return false
    const { error } = await supabase.from('users').delete().eq('id', workerId)
    if (error) {
      showToast('Failed to delete worker', 'error')
      return false
    }
    showToast('Worker deleted', 'success')
    return true
  }

  const getWorkers = async () => {
    if (user.role !== 'admin') return []
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'worker')
      .eq('tenant_id', user.tenantId)
    return data || []
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      changePassword,
      changeUsername,
      addWorker,
      deleteWorker,
      getWorkers,
      refreshUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}