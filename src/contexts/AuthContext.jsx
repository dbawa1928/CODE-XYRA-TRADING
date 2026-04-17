import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastContext'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Helper: refresh user from database
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

  // On app load, restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('cx_user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      // Super admin does not need DB refresh
      if (parsed.username === 'CodeXyra') {
        setUser(parsed)
        setLoading(false)
      } else {
        refreshUser(parsed.id).finally(() => setLoading(false))
      }
    } else {
      setLoading(false)
    }
  }, [])

  // Login (normal, biometric, super admin)
  const login = async (username, password) => {
    // Super admin fixed credentials
    if (username === 'CodeXyra' && password === 'Code@123') {
      const userData = {
        id: 'super-admin-id',
        username: 'CodeXyra',
        role: 'super_admin',
        tenantId: null
      }
      localStorage.setItem('cx_user', JSON.stringify(userData))
      setUser(userData)
      showToast('Welcome Super Admin', 'success')
      return true
    }

    // Biometric login
    if (password === 'biometric') {
      const savedUsername = localStorage.getItem('biometric_username')
      if (savedUsername !== username) {
        showToast('Biometric username mismatch', 'error')
        return false
      }
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
    setUser(null)
  }

  // Super admin only functions
  const getAllUsers = async () => {
    if (user?.role !== 'super_admin') return []
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching users:', error)
      return []
    }
    return data || []
  }

  const getAllRatings = async () => {
    if (user?.role !== 'super_admin') return []
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching ratings:', error)
      return []
    }
    return data || []
  }

  const changeSuperAdminPassword = async (newPassword) => {
    if (user?.username !== 'CodeXyra') return false
    // For demo, store in localStorage; in production use a settings table
    localStorage.setItem('super_admin_password', newPassword)
    showToast('Super admin password changed', 'success')
    return true
  }

  // Regular user functions
  const changePassword = async (oldPassword, newPassword) => {
    if (!user || user.role === 'super_admin') return false
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

  const changeUsername = async (newUsername, password) => {
    if (!user || user.role === 'super_admin') return false
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
      changePassword,
      changeUsername,
      addWorker,
      deleteWorker,
      getWorkers,
      refreshUser,
      getAllUsers,
      getAllRatings,
      changeSuperAdminPassword,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}