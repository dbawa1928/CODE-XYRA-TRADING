import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../supabaseClient'
import { FaUsers, FaStar, FaTrash, FaKey, FaDownload, FaSearch, FaChartLine, FaHistory, FaExclamationTriangle } from 'react-icons/fa'
import LoadingSpinner from '../components/LoadingSpinner'
import { exportToCSV } from '../utils/exportToCSV'
import html2pdf from 'html2pdf.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ========== UTC to IST conversion helpers ==========
const toISTDate = (utcDateStr) => {
  if (!utcDateStr) return null
  const date = new Date(utcDateStr)
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
  return istTime
}

const formatISTDate = (utcDateStr) => {
  const ist = toISTDate(utcDateStr)
  return ist ? ist.toLocaleDateString('en-IN') : 'Never'
}

const formatISTDateTime = (utcDateStr) => {
  const ist = toISTDate(utcDateStr)
  return ist ? ist.toLocaleString('en-IN', { hour12: true }) : 'Never'
}

const getISTDateString = (utcDateStr) => {
  const ist = toISTDate(utcDateStr)
  return ist ? ist.toISOString().split('T')[0] : ''
}

const AdminDashboard = () => {
  const { user, getAllUsers, getAllRatings, deleteUser, resetUserPassword, getSystemLogs, updateSuperAdminPassword, addSystemLog } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [ratings, setRatings] = useState([])
  const [logs, setLogs] = useState([])
  const [transactionsCount, setTransactionsCount] = useState(0)
  const [todayRegistrations, setTodayRegistrations] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('users')
  const [searchUser, setSearchUser] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [searchRating, setSearchRating] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [registrationData, setRegistrationData] = useState([])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadData()
    } else {
      setError('Access denied. Super admin only.')
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, ratingsData, logsData] = await Promise.all([
        getAllUsers(),
        getAllRatings(),
        getSystemLogs(200)
      ])
      setUsers(usersData || [])
      setRatings(ratingsData || [])
      setLogs(logsData || [])

      const { count: totalTx, error: txError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
      if (!txError) setTransactionsCount(totalTx || 0)

      const todayIST = formatISTDate(new Date().toISOString())
      const todayReg = usersData.filter(u => formatISTDate(u.created_at) === todayIST).length
      setTodayRegistrations(todayReg)

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const istDate = toISTDate(d.toISOString())
        return istDate ? istDate.toISOString().split('T')[0] : ''
      }).reverse()
      const counts = last7Days.map(date => ({
        date,
        count: usersData.filter(u => getISTDateString(u.created_at) === date).length
      }))
      setRegistrationData(counts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const lowRatings = ratings.filter(r => r.rating <= 2)

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Delete user "${username}"? All their transactions will also be deleted.`)) {
      await deleteUser(userId)
      await addSystemLog('delete_user', `Deleted user ${username}`)
      loadData()
      showToast('User deleted', 'success')
    }
  }

  const handleResetPassword = async (userId, username) => {
    const newPass = prompt(`Enter new password for ${username}`, 'temp123')
    if (newPass) {
      await resetUserPassword(userId, newPass)
      await addSystemLog('reset_password', `Reset password for ${username}`)
      loadData()
      showToast('Password reset', 'success')
    }
  }

  const handleExportUsers = () => {
    let filtered = users
    if (searchUser) filtered = filtered.filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()))
    if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter)
    const exportData = filtered.map(u => ({
      Username: u.username,
      Role: u.role,
      'Tenant ID': u.tenant_id,
      'Created At': formatISTDateTime(u.created_at),
      'Last Login': u.last_login ? formatISTDateTime(u.last_login) : 'Never'
    }))
    exportToCSV(exportData, `users_export_${new Date().toISOString().slice(0,10)}.csv`)
    showToast('Users exported to CSV', 'success')
  }

  const handleExportRatings = () => {
    const filtered = ratings.filter(r => r.rating.toString().includes(searchRating) || (r.username && r.username.toLowerCase().includes(searchRating.toLowerCase())))
    const exportData = filtered.map(r => ({
      Username: r.username || 'anonymous',
      Rating: r.rating,
      Date: formatISTDateTime(r.created_at)
    }))
    exportToCSV(exportData, `ratings_export_${new Date().toISOString().slice(0,10)}.csv`)
    showToast('Ratings exported to CSV', 'success')
  }

  const handleExportPDF = (data, title) => {
    const element = document.createElement('div')
    element.innerHTML = `<h1>${title}</h1><table border="1">${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</table>`
    const opt = { margin: 0.4, filename: `${title}.pdf`, image: { type: 'jpeg' }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4' } }
    html2pdf().set(opt).from(element).save()
  }

  const handleUpdateAdminPassword = async (e) => {
    e.preventDefault()
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordMessage('Passwords do not match')
      return
    }
    if (newAdminPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      return
    }
    const success = await updateSuperAdminPassword(newAdminPassword)
    if (success) {
      setPasswordMessage('Password updated successfully')
      setNewAdminPassword('')
      setConfirmAdminPassword('')
      await addSystemLog('change_super_admin_password', 'Password changed')
      showToast('Super admin password updated', 'success')
    } else {
      setPasswordMessage('Failed to update password')
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchUser.toLowerCase())
    const matchesRole = roleFilter ? u.role === roleFilter : true
    return matchesSearch && matchesRole
  })
  const filteredRatings = ratings.filter(r => r.rating.toString().includes(searchRating) || (r.username && r.username.toLowerCase().includes(searchRating.toLowerCase())))
  const averageRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Super Admin Dashboard</h1>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <div className="card p-3 sm:p-4 text-center"><FaUsers className="text-2xl sm:text-3xl text-primary mx-auto mb-1" /><p className="text-xl sm:text-2xl font-bold">{users.length}</p><p className="text-xs text-gray-500">Total Users</p></div>
          <div className="card p-3 sm:p-4 text-center"><FaStar className="text-2xl sm:text-3xl text-yellow-500 mx-auto mb-1" /><p className="text-xl sm:text-2xl font-bold">{ratings.length}</p><p className="text-xs text-gray-500">Reviews</p></div>
          <div className="card p-3 sm:p-4 text-center"><FaStar className="text-2xl sm:text-3xl text-yellow-500 mx-auto mb-1" /><p className="text-xl sm:text-2xl font-bold">{averageRating}</p><p className="text-xs text-gray-500">Avg Rating</p></div>
          <div className="card p-3 sm:p-4 text-center"><FaHistory className="text-2xl sm:text-3xl text-primary mx-auto mb-1" /><p className="text-xl sm:text-2xl font-bold">{logs.length}</p><p className="text-xs text-gray-500">System Logs</p></div>
          <div className="card p-3 sm:p-4 text-center col-span-2 sm:col-span-1"><FaChartLine className="text-2xl sm:text-3xl text-primary mx-auto mb-1" /><p className="text-xl sm:text-2xl font-bold">{transactionsCount}</p><p className="text-xs text-gray-500">Total Transactions</p></div>
        </div>

        {/* Today's Registrations & Low Ratings Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="card p-4 text-center bg-green-50 dark:bg-green-900/20">
            <p className="text-base sm:text-lg font-semibold">📅 Today's Registrations</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{todayRegistrations}</p>
          </div>
          {lowRatings.length > 0 && (
            <div className="card p-4 text-center bg-red-50 dark:bg-red-900/20">
              <p className="text-base sm:text-lg font-semibold flex items-center justify-center gap-2"><FaExclamationTriangle className="text-red-500" /> Low Ratings (1-2 stars)</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{lowRatings.length}</p>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
          )}
        </div>

        {/* Tabs - Responsive wrap */}
        <div className="flex flex-wrap gap-2 sm:gap-4 border-b mb-6">
          <button onClick={() => setActiveTab('users')} className={`pb-2 px-3 sm:px-4 text-sm sm:text-base font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Users</button>
          <button onClick={() => setActiveTab('ratings')} className={`pb-2 px-3 sm:px-4 text-sm sm:text-base font-medium ${activeTab === 'ratings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Ratings</button>
          <button onClick={() => setActiveTab('chart')} className={`pb-2 px-3 sm:px-4 text-sm sm:text-base font-medium ${activeTab === 'chart' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Registration Chart</button>
          <button onClick={() => setActiveTab('logs')} className={`pb-2 px-3 sm:px-4 text-sm sm:text-base font-medium ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>System Logs</button>
          <button onClick={() => setActiveTab('settings')} className={`pb-2 px-3 sm:px-4 text-sm sm:text-base font-medium ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Admin Settings</button>
        </div>

        {loading ? <LoadingSpinner /> : error ? <div className="text-red-500 text-center">Error: {error}</div> : (
          <>
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative"><FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search username" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="input-field pl-10 w-40 sm:w-48" /></div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-32 sm:w-36">
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="worker">Worker</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleExportUsers} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><FaDownload size={12} /> CSV</button>
                    <button onClick={() => handleExportPDF(filteredUsers.map(u => ({ Username: u.username, Role: u.role, Created: formatISTDate(u.created_at), 'Last Login': u.last_login ? formatISTDateTime(u.last_login) : 'Never' })), 'users_report')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><FaDownload size={12} /> PDF</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] bg-white dark:bg-gray-800 rounded-xl shadow">
                    <thead className="bg-primary text-white text-sm">
                      <tr><th className="p-2 sm:p-3">Username</th><th>Role</th><th>Tenant ID</th><th>Created (IST)</th><th>Last Login (IST)</th><th>Actions</th></tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b dark:border-gray-700">
                          <td className="p-2 sm:p-3">{u.username}</td>
                          <td className="p-2 sm:p-3">{u.role}</td>
                          <td className="p-2 sm:p-3 text-xs">{u.tenant_id?.slice(0,8)}...</td>
                          <td className="p-2 sm:p-3">{formatISTDate(u.created_at)}</td>
                          <td className="p-2 sm:p-3 text-sm">{u.last_login ? formatISTDateTime(u.last_login) : 'Never'}</td>
                          <td className="p-2 sm:p-3"><div className="flex gap-2"><button onClick={() => handleResetPassword(u.id, u.username)} className="text-blue-500"><FaKey /></button><button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-500"><FaTrash /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RATINGS TAB */}
            {activeTab === 'ratings' && (
              <div>
                <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center">
                  <div className="relative"><FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search rating or username" value={searchRating} onChange={(e) => setSearchRating(e.target.value)} className="input-field pl-10 w-full sm:w-64" /></div>
                  <div className="flex gap-2"><button onClick={handleExportRatings} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><FaDownload size={12} /> CSV</button><button onClick={() => handleExportPDF(filteredRatings.map(r => ({ Username: r.username || 'anonymous', Rating: r.rating, Date: formatISTDateTime(r.created_at) })), 'ratings_report')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><FaDownload size={12} /> PDF</button></div>
                </div>
                <div className="space-y-3">
                  {filteredRatings.map(r => (
                    <div key={r.id} className={`card p-4 flex justify-between items-center ${r.rating <= 2 ? 'border-l-4 border-red-500' : ''}`}>
                      <div><div className="flex gap-1 text-yellow-500">{[...Array(5)].map((_, i) => (<FaStar key={i} className={i < r.rating ? 'text-yellow-500' : 'text-gray-300'} />))}</div><p className="text-xs sm:text-sm text-gray-500 mt-1">{r.username || 'anonymous'} • {formatISTDateTime(r.created_at)}</p></div>
                      <div className="text-xl sm:text-2xl font-bold text-primary">{r.rating}</div>
                    </div>
                  ))}
                  {filteredRatings.length === 0 && <p className="text-center text-gray-500">No ratings found.</p>}
                </div>
              </div>
            )}

            {/* REGISTRATION CHART TAB */}
            {activeTab === 'chart' && (
              <div className="card p-4 sm:p-6">
                <h3 className="text-base sm:text-xl font-semibold mb-4">User Registrations (Last 7 Days) – IST Date</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationData}><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#15803d" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* SYSTEM LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] bg-white dark:bg-gray-800 rounded-xl shadow">
                  <thead className="bg-primary text-white text-sm"><tr><th className="p-2 sm:p-3">Time (IST)</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
                  <tbody className="text-sm">{logs.map(log => (<tr key={log.id} className="border-b dark:border-gray-700"><td className="p-2 sm:p-3">{formatISTDateTime(log.created_at)}</td><td className="p-2 sm:p-3">{log.user_id}</td><td className="p-2 sm:p-3">{log.action}</td><td className="p-2 sm:p-3">{log.details}</td></tr>))}</tbody>
                </table>
              </div>
            )}

            {/* ADMIN SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="card p-6 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-primary mb-4">Change Super Admin Password</h3>
                <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                  <input type="password" placeholder="New Password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="input-field" required minLength="6" />
                  <input type="password" placeholder="Confirm New Password" value={confirmAdminPassword} onChange={(e) => setConfirmAdminPassword(e.target.value)} className="input-field" required />
                  {passwordMessage && <div className={`text-sm text-center ${passwordMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage}</div>}
                  <button type="submit" className="btn-primary w-full">Update Password</button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
export default AdminDashboard