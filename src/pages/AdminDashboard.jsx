import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'
import { FaUsers, FaStar, FaTrash, FaKey, FaDownload, FaSearch, FaChartLine, FaHistory } from 'react-icons/fa'
import LoadingSpinner from '../components/LoadingSpinner'
import { exportToCSV } from '../utils/exportToCSV'
import html2pdf from 'html2pdf.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const AdminDashboard = () => {
  const { 
    user, 
    getAllUsers, 
    getAllRatings, 
    deleteUser, 
    resetUserPassword, 
    getSystemLogs, 
    updateSuperAdminPassword, 
    addSystemLog 
  } = useAuth()
  
  const [users, setUsers] = useState([])
  const [ratings, setRatings] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('users')
  const [searchUser, setSearchUser] = useState('')
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
      
      // Prepare chart data (last 7 days registration counts)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()
      const counts = last7Days.map(date => ({
        date,
        count: usersData.filter(u => u.created_at?.startsWith(date)).length
      }))
      setRegistrationData(counts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Delete user "${username}"? All their transactions will also be deleted.`)) {
      await deleteUser(userId)
      await addSystemLog('delete_user', `Deleted user ${username}`)
      loadData()
    }
  }

  const handleResetPassword = async (userId, username) => {
    const newPass = prompt(`Enter new password for ${username}`, 'temp123')
    if (newPass) {
      await resetUserPassword(userId, newPass)
      await addSystemLog('reset_password', `Reset password for ${username}`)
      loadData()
    }
  }

  const handleExportUsers = () => {
    const filtered = users.filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()))
    const exportData = filtered.map(u => ({
      Username: u.username,
      Role: u.role,
      'Tenant ID': u.tenant_id,
      'Created At': new Date(u.created_at).toLocaleString()
    }))
    exportToCSV(exportData, `users_export_${new Date().toISOString().slice(0,10)}.csv`)
  }

  const handleExportRatings = () => {
    const filtered = ratings.filter(r => 
      r.rating.toString().includes(searchRating) || 
      (r.username && r.username.toLowerCase().includes(searchRating.toLowerCase()))
    )
    const exportData = filtered.map(r => ({
      Username: r.username || 'anonymous',
      Rating: r.rating,
      Date: new Date(r.created_at).toLocaleString()
    }))
    exportToCSV(exportData, `ratings_export_${new Date().toISOString().slice(0,10)}.csv`)
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
      await addSystemLog('change_super_admin_password', 'Super admin password changed')
    } else {
      setPasswordMessage('Failed to update password')
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()))
  const filteredRatings = ratings.filter(r => 
    r.rating.toString().includes(searchRating) || 
    (r.username && r.username.toLowerCase().includes(searchRating.toLowerCase()))
  )
  const averageRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-primary mb-6">Super Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 text-center">
            <FaUsers className="text-4xl text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-gray-500">Total Users</p>
          </div>
          <div className="card p-6 text-center">
            <FaStar className="text-4xl text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{ratings.length}</p>
            <p className="text-gray-500">Reviews</p>
          </div>
          <div className="card p-6 text-center">
            <FaStar className="text-4xl text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{averageRating}</p>
            <p className="text-gray-500">Avg Rating</p>
          </div>
          <div className="card p-6 text-center">
            <FaHistory className="text-4xl text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-gray-500">System Logs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 border-b mb-6">
          <button onClick={() => setActiveTab('users')} className={`pb-2 px-4 font-medium ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Users</button>
          <button onClick={() => setActiveTab('ratings')} className={`pb-2 px-4 font-medium ${activeTab === 'ratings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Ratings</button>
          <button onClick={() => setActiveTab('chart')} className={`pb-2 px-4 font-medium ${activeTab === 'chart' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Registration Chart</button>
          <button onClick={() => setActiveTab('logs')} className={`pb-2 px-4 font-medium ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>System Logs</button>
          <button onClick={() => setActiveTab('settings')} className={`pb-2 px-4 font-medium ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Admin Settings</button>
        </div>

        {loading ? <LoadingSpinner /> : error ? <div className="text-red-500 text-center">Error: {error}</div> : (
          <>
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div>
                <div className="flex flex-wrap gap-4 mb-4 justify-between items-center">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search by username" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="input-field pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleExportUsers} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaDownload /> CSV</button>
                    <button onClick={() => handleExportPDF(filteredUsers.map(u => ({ Username: u.username, Role: u.role, Created: new Date(u.created_at).toLocaleDateString() })), 'users_report')} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaDownload /> PDF</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white dark:bg-gray-800 rounded-xl shadow">
                    <thead className="bg-primary text-white">
                      <tr><th className="p-3">Username</th><th>Role</th><th>Tenant ID</th><th>Created</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b dark:border-gray-700">
                          <td className="p-3">{u.username}</td>
                          <td className="p-3">{u.role}</td>
                          <td className="p-3 text-xs">{u.tenant_id?.slice(0,8)}...</td>
                          <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button onClick={() => handleResetPassword(u.id, u.username)} className="text-blue-500 hover:text-blue-700" title="Reset Password"><FaKey /></button>
                              <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-500 hover:text-red-700" title="Delete User"><FaTrash /></button>
                            </div>
                          </td>
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
                <div className="flex flex-wrap gap-4 mb-4 justify-between items-center">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search by rating (1-5) or username" value={searchRating} onChange={(e) => setSearchRating(e.target.value)} className="input-field pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleExportRatings} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaDownload /> CSV</button>
                    <button onClick={() => handleExportPDF(filteredRatings.map(r => ({ Username: r.username || 'anonymous', Rating: r.rating, Date: new Date(r.created_at).toLocaleString() })), 'ratings_report')} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaDownload /> PDF</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredRatings.map(r => (
                    <div key={r.id} className="card p-4 flex justify-between items-center">
                      <div>
                        <div className="flex gap-1 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < r.rating ? 'text-yellow-500' : 'text-gray-300'} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {r.username || 'anonymous'} • {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary">{r.rating}</div>
                    </div>
                  ))}
                  {filteredRatings.length === 0 && <p className="text-center text-gray-500">No ratings found.</p>}
                </div>
              </div>
            )}

            {/* REGISTRATION CHART TAB */}
            {activeTab === 'chart' && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4">User Registrations (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={registrationData}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#15803d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* SYSTEM LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-800 rounded-xl shadow">
                  <thead className="bg-primary text-white">
                    <tr><th className="p-3">Time</th><th>User</th><th>Action</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b dark:border-gray-700">
                        <td className="p-3 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3">{log.user_id}</td>
                        <td className="p-3">{log.action}</td>
                        <td className="p-3 text-sm">{log.details}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="4" className="text-center p-4">No logs found.</td></tr>}
                  </tbody>
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