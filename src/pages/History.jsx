import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { FaSearch, FaEye, FaDownload, FaCheckCircle, FaTimesCircle, FaTrash, FaFilePdf, FaCalendarAlt } from 'react-icons/fa'
import { exportToCSV } from '../utils/exportToCSV'
import LoadingSpinner from '../components/LoadingSpinner'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import html2pdf from 'html2pdf.js'

const History = () => {
  const [transactions, setTransactions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const { showToast } = useToast()
  const { t } = useLanguage()
  const { user } = useAuth()
  const pdfRef = useRef()

  const fetchTransactions = async () => {
    if (!user) return
    if (!user.tenantId) {
      setError('User tenant not found. Please log out and log in again.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error: supabaseError } = await supabase
        .from('transactions')
        .select(`*, users!user_id (username)`)
        .eq('tenant_id', user.tenantId)
        .order('created_at', { ascending: false })
      if (supabaseError) throw supabaseError
      setTransactions(data || [])
    } catch (err) {
      setError(err.message)
      showToast('Failed to load transactions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  // Apply filters: search + date range
  useEffect(() => {
    let filteredData = [...transactions]
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filteredData = filteredData.filter(t => t.farmer_name?.toLowerCase().includes(lowerSearch))
    }
    if (startDate) {
      filteredData = filteredData.filter(t => t.date >= startDate)
    }
    if (endDate) {
      filteredData = filteredData.filter(t => t.date <= endDate)
    }
    setFiltered(filteredData)
  }, [search, startDate, endDate, transactions])

  const handleRefresh = async () => {
    await fetchTransactions()
    showToast('Refreshed', 'success')
  }
  usePullToRefresh(handleRefresh)

  const togglePaymentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    const { error } = await supabase.from('transactions').update({ payment_status: newStatus }).eq('id', id)
    if (error) showToast('Error updating status', 'error')
    else { showToast(`Marked as ${newStatus}`, 'success'); fetchTransactions() }
  }

  const deleteTransaction = async (id, farmerName, creatorId) => {
    const canDelete = user?.role === 'admin' || creatorId === user?.id
    if (!canDelete) return showToast('You cannot delete this transaction', 'error')
    if (window.confirm(`Delete transaction for ${farmerName}?`)) {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) showToast('Error deleting', 'error')
      else { showToast('Deleted', 'success'); fetchTransactions(); setSelectedIds(prev => prev.filter(i => i !== id)) }
    }
  }

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return showToast('No transactions selected', 'error')
    if (!window.confirm(`Delete ${selectedIds.length} selected transactions? This cannot be undone.`)) return
    const { error } = await supabase.from('transactions').delete().in('id', selectedIds)
    if (error) showToast('Error deleting transactions', 'error')
    else { showToast(`${selectedIds.length} transactions deleted`, 'success'); fetchTransactions(); setSelectedIds([]) }
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) return showToast('No data to export', 'error')
    const exportData = filtered.map(t => ({
      Farmer: t.farmer_name, Phone: t.phone || '', Crop: t.crop, Date: t.date,
      Quantity: t.quantity, Rate: t.rate, Commission: t.commission, Labour: t.labour,
      Total: t.total_amount, Net: t.net_amount, Status: t.payment_status || 'unpaid',
      'Created By': t.users?.username || 'Unknown'
    }))
    exportToCSV(exportData, `transactions_${new Date().toISOString().slice(0,10)}.csv`)
    showToast('Exported to CSV', 'success')
  }

  const handleExportPDF = () => {
    if (filtered.length === 0) return showToast('No data to export', 'error')
    const element = pdfRef.current
    const opt = { margin: 0.4, filename: `transactions_report_${new Date().toISOString().slice(0,10)}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }
    html2pdf().set(opt).from(element).save()
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([])
    else setSelectedIds(filtered.map(t => t.id))
  }

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <BackButton />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8"><div className="text-red-500 text-xl mb-4">⚠️ Error</div><p>{error}</p><button onClick={fetchTransactions} className="btn-primary mt-4">Retry</button></div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-primary">{t('history')}</h2>
          <div className="flex gap-2 flex-wrap">
            {selectedIds.length > 0 && user?.role === 'admin' && (
              <button onClick={bulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><FaTrash /> Delete Selected ({selectedIds.length})</button>
            )}
            <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><FaDownload /> CSV</button>
            <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><FaFilePdf /> PDF Report</button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex-1 min-w-[200px]"><label className="block text-sm font-medium mb-1">Search Farmer</label><div className="relative"><FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div></div>
          <div><label className="block text-sm font-medium mb-1">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" /></div>
          <button onClick={() => { setStartDate(''); setEndDate(''); setSearch('') }} className="btn-secondary">Clear Filters</button>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? <div className="text-center py-12">{t('noRecords')}</div> : (
          <>
            {/* Hidden PDF template */}
            <div ref={pdfRef} className="hidden">
              <div className="p-6 bg-white">
                <h1 className="text-2xl font-bold text-center mb-4">CodeXyra Trading – Transaction Report</h1>
                <p className="text-center mb-6">Generated on {new Date().toLocaleString()}</p>
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="bg-primary text-white"><th className="p-2">Farmer</th><th>Crop</th><th>Date</th><th>Quantity</th><th>Rate</th><th>Net</th><th>Status</th></tr></thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b"><td className="p-2">{t.farmer_name}</td><td>{t.crop}</td><td>{t.date}</td><td>{t.quantity}</td><td>₹{t.rate}</td><td>₹{t.net_amount?.toFixed(2)}</td><td>{t.payment_status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow">
                <thead className="bg-primary text-white">
                  <tr>
                    {user?.role === 'admin' && <th className="p-3 w-10"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="w-4 h-4" /></th>}
                    <th className="p-3 text-left">Farmer</th><th className="p-3 text-left">Crop</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Qty</th><th className="p-3 text-left">Rate</th><th className="p-3 text-left">Net</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Created By</th><th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const canDelete = user?.role === 'admin' || t.user_id === user?.id
                    return (
                      <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        {user?.role === 'admin' && <td className="p-3"><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelectOne(t.id)} className="w-4 h-4" /></td>}
                        <td className="p-3 font-medium">{t.farmer_name}</td><td className="p-3">{t.crop}</td><td className="p-3">{t.date}</td><td className="p-3">{t.quantity}</td><td className="p-3">₹{t.rate}</td><td className="p-3 font-semibold">₹{t.net_amount?.toFixed(2)}</td>
                        <td className="p-3"><button onClick={() => togglePaymentStatus(t.id, t.payment_status)} className={`px-2 py-1 rounded-full text-xs ${t.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</button></td>
                        <td className="p-3 text-xs text-gray-500">{t.users?.username || 'Unknown'}</td>
                        <td className="p-3 text-center"><div className="flex gap-2 justify-center"><button onClick={() => setSelected(t)} className="text-primary"><FaEye /></button>{canDelete && <button onClick={() => deleteTransaction(t.id, t.farmer_name, t.user_id)} className="text-red-500"><FaTrash /></button>}</div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      {selected && <TransactionModal transaction={selected} onClose={() => setSelected(null)} />}
      <Footer />
    </div>
  )
}

const TransactionModal = ({ transaction, onClose }) => {
  const { t } = useLanguage()
  if (!transaction) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-5">
        <div className="flex justify-between"><h3 className="text-xl font-bold text-primary">Details</h3><button onClick={onClose} className="text-gray-500 text-2xl">&times;</button></div>
        <div className="space-y-2 mt-4">
          <DetailRow label={t('farmerName')} value={transaction.farmer_name} /><DetailRow label={t('phone')} value={transaction.phone || 'N/A'} />
          <DetailRow label={t('cropType')} value={transaction.crop} /><DetailRow label={t('date')} value={transaction.date} />
          <DetailRow label={t('quantity')} value={`${transaction.quantity} Qtls`} /><DetailRow label={t('rate')} value={`₹${transaction.rate}/Qtl`} />
          <DetailRow label={t('commission')} value={`${transaction.commission}%`} /><DetailRow label="Labour" value={`₹${transaction.labour}`} />
          <DetailRow label="Total Amount" value={`₹${transaction.total_amount?.toFixed(2)}`} />
          <DetailRow label={t('netPayable')} value={`₹${transaction.net_amount?.toFixed(2)}`} className="font-bold text-primary" />
          <DetailRow label={t('paymentStatus')} value={transaction.payment_status === 'paid' ? t('paid') : t('unpaid')} />
          <DetailRow label="Created By" value={transaction.users?.username || 'Unknown'} />
        </div>
      </div>
    </div>
  )
}
const DetailRow = ({ label, value, className = '' }) => (
  <div className="flex justify-between py-1 border-b"><span className="font-medium">{label}:</span><span className={className}>{value}</span></div>
)
export default History