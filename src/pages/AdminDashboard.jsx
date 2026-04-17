import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'
import { FaUsers, FaStar, FaTrash, FaEye } from 'react-icons/fa'
import LoadingSpinner from '../components/LoadingSpinner'

const AdminDashboard = () => {
  const { user, getAllUsers, getAllRatings } = useAuth()
  const [users, setUsers] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('users')

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
      const [usersData, ratingsData] = await Promise.all([getAllUsers(), getAllRatings()])
      setUsers(usersData || [])
      setRatings(ratingsData || [])
    } catch (err) {
      console.error('Error loading admin data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
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

  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-primary mb-6">Super Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <FaUsers className="text-4xl text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-gray-500">Total Registered Users</p>
          </div>
          <div className="card p-6 text-center">
            <FaStar className="text-4xl text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{ratings.length}</p>
            <p className="text-gray-500">Total Reviews</p>
          </div>
          <div className="card p-6 text-center">
            <FaStar className="text-4xl text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{averageRating}</p>
            <p className="text-gray-500">Average Rating</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-4 font-medium transition ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Registered Users
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`pb-2 px-4 font-medium transition ${activeTab === 'ratings' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            User Reviews
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl text-center">
            Error: {error}
            <button onClick={loadData} className="ml-4 underline">Retry</button>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
              <thead className="bg-primary text-white">
                <tr><th className="p-3 text-left">Username</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Tenant ID</th><th className="p-3 text-left">Created At</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b dark:border-gray-700">
                    <td className="p-3">{u.username}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
                    <td className="p-3 text-xs">{u.tenant_id?.slice(0,8)}...</td>
                    <td className="p-3 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map(r => (
              <div key={r.id} className="card p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < r.rating ? 'text-yellow-500' : 'text-gray-300'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="text-2xl font-bold text-primary">{r.rating}</div>
              </div>
            ))}
            {ratings.length === 0 && <p className="text-center text-gray-500">No ratings yet.</p>}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
export default AdminDashboard