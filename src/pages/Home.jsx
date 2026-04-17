import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { 
  FaCalculator, FaHistory, FaStar, FaInfoCircle, FaFileContract, FaEnvelope, 
  FaChartLine, FaUserCog, FaUsers, FaTractor, FaTachometerAlt 
} from 'react-icons/fa'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'

const Home = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [todaySummary, setTodaySummary] = useState({ totalBags: 0, totalWeight: 0, netAmount: 0 })
  const [summaryError, setSummaryError] = useState(null)

  // Super admin home page – only admin dashboard and profile
  if (user?.role === 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Super Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage platform users and reviews</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="card p-8 text-center hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <FaTachometerAlt className="text-5xl text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
              <p className="text-gray-500 text-sm mt-2">View users and ratings</p>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="card p-8 text-center hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <FaUserCog className="text-5xl text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold">Profile</h2>
              <p className="text-gray-500 text-sm mt-2">Change your password</p>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ========== NORMAL USER HOME PAGE ==========
  useEffect(() => {
    if (user) fetchTodaySummary()
  }, [user])

  const fetchTodaySummary = async () => {
    if (!user?.tenantId) return
    const today = new Date().toISOString().split('T')[0]
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('bags, weight_kg, net_amount')
        .eq('date', today)
        .eq('tenant_id', user.tenantId)
      if (error) throw error
      const totalBags = data?.reduce((s, t) => s + (parseFloat(t.bags) || 0), 0) || 0
      const totalWeight = data?.reduce((s, t) => s + (parseFloat(t.weight_kg) || 0), 0) || 0
      const netAmount = data?.reduce((s, t) => s + (parseFloat(t.net_amount) || 0), 0) || 0
      setTodaySummary({ totalBags, totalWeight, netAmount })
      setSummaryError(null)
    } catch (err) {
      setSummaryError(err.message)
    }
  }

  const menuItems = [
    { title: t('calculation'), icon: FaCalculator, path: '/calculation', bg: 'bg-green-500' },
    { title: t('history'), icon: FaHistory, path: '/history', bg: 'bg-blue-500' },
    { title: t('analytics'), icon: FaChartLine, path: '/analytics', bg: 'bg-indigo-500' },
    { title: t('rateUs'), icon: FaStar, path: '/rate-us', bg: 'bg-yellow-500' },
    { title: t('about'), icon: FaInfoCircle, path: '/about', bg: 'bg-purple-500' },
    { title: t('privacy'), icon: FaFileContract, path: '/privacy', bg: 'bg-gray-500' },
    { title: t('contact'), icon: FaEnvelope, path: '/contact', bg: 'bg-red-500' },
    { title: 'Profile', icon: FaUserCog, path: '/profile', bg: 'bg-teal-500' },
  ]
  if (user?.role === 'admin') {
    menuItems.push({ title: 'Manage Workers', icon: FaUsers, path: '/manage-workers', bg: 'bg-orange-500' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-primary to-green-600 text-white py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold px-4">CODEXYRA TRADING</h1>
          <p className="text-green-100 mt-3 text-lg px-4">Mandi Crop Transaction Platform</p>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Today's Summary Card */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 border-l-8 border-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <FaTractor className="text-2xl text-primary flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  Today's Summary ({new Date().toLocaleDateString()})
                </h2>
              </div>
            </div>
            {summaryError ? (
              <div className="text-red-500 text-center py-4">Unable to load summary: {summaryError}</div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-around gap-4 sm:gap-6">
                <div className="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Bags</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{todaySummary.totalBags.toFixed(0)}</p>
                </div>
                <div className="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Weight (KG)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{todaySummary.totalWeight.toFixed(0)}</p>
                </div>
                <div className="flex-1 text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Net Amount (₹)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">₹{todaySummary.netAmount.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map(item => (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden transform hover:-translate-y-1"
              >
                <div className={`${item.bg} p-6 flex justify-center`}>
                  <item.icon className="text-5xl text-white group-hover:scale-110 transition" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tap to open</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default Home