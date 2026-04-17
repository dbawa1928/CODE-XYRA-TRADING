import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      showToast('Error fetching transactions', 'error')
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  const addTransaction = async (record) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([record])
      .select()
    if (error) {
      showToast('Error saving transaction', 'error')
      return null
    }
    showToast('Transaction saved', 'success')
    fetchTransactions()
    return data[0]
  }

  const updatePaymentStatus = async (id, status) => {
    const { error } = await supabase
      .from('transactions')
      .update({ payment_status: status })
      .eq('id', id)
    if (error) {
      showToast('Error updating status', 'error')
    } else {
      showToast(`Status updated to ${status}`, 'success')
      fetchTransactions()
    }
  }

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      showToast('Error deleting transaction', 'error')
    } else {
      showToast('Transaction deleted', 'success')
      fetchTransactions()
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return { transactions, loading, addTransaction, updatePaymentStatus, deleteTransaction, refresh: fetchTransactions }
}