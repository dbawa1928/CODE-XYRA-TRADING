import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from './ToastContext'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const storedUser = localStorage.getItem('cx_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const register = async (username, password) => {
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
    await supabase.from('users').update({ tenant_id: newUser.id }).eq('id', newUser.id)
    const userData = { id: newUser.id, username, role: 'admin', tenantId: newUser.id }
    localStorage.setItem('cx_user', JSON.stringify(userData))
    setUser(userData)
    showToast('Registration successful', 'success')
    return true
  }

  const login = async (username, password) => {
    // Super admin hardcoded login
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

    // Normal user login
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
      .insert([{ username, password, role: 'worker', created_by: user.id, tenant_id: user.tenantId }])
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

  // Super admin functions
  const getAllUsers = async () => {
    if (user?.role !== 'super_admin') return []
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    return data || []
  }

  const getAllRatings = async () => {
    if (user?.role !== 'super_admin') return []
    const { data } = await supabase.from('ratings').select('*').order('created_at', { ascending: false })
    return data || []
  }

  const getSystemLogs = async () => {
    if (user?.role !== 'super_admin') return []
    const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false })
    return data || []
  }

  const addSystemLog = async (action, details) => {
    if (!user) return
    await supabase.from('system_logs').insert([{ user_id: user.username, action, details, created_at: new Date() }])
  }

  const updateSuperAdminPassword = async (newPassword) => {
    if (user?.role !== 'super_admin') return false
    // Update the hardcoded check – we can also update in DB, but here we just update the hardcoded check? Better to update DB.
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('username', 'CodeXyra')
    if (error) {
      showToast('Failed to update password', 'error')
      return false
    }
    showToast('Super admin password updated', 'success')
    return true
  }

  const deleteUser = async (userId) => {
    if (user?.role !== 'super_admin') return false
    await supabase.from('transactions').delete().eq('user_id', userId)
    await supabase.from('transactions').delete().eq('tenant_id', userId)
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) {
      showToast('Failed to delete user', 'error')
      return false
    }
    showToast('User deleted', 'success')
    await addSystemLog('delete_user', `Deleted user ID ${userId}`)
    return true
  }

  const resetUserPassword = async (userId, newPassword = 'temp123') => {
    if (user?.role !== 'super_admin') return false
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', userId)
    if (error) {
      showToast('Failed to reset password', 'error')
      return false
    }
    showToast('Password reset', 'success')
    return true
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
      getAllUsers,
      getAllRatings,
      getSystemLogs,
      addSystemLog,
      updateSuperAdminPassword,
      deleteUser,
      resetUserPassword,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}