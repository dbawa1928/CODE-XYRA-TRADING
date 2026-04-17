import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { supabase } from '../supabaseClient'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Analytics = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => { if (user) fetchTransactions() }, [user])

  const fetchTransactions = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('transactions').select('*').eq('tenant_id', user.tenantId)
    if (!error) setTransactions(data || [])
    setLoading(false)
  }

  const totalTransactions = transactions.length
  const totalCommission = transactions.reduce((s, t) => s + (t.commission * t.total_amount / 100), 0)
  const totalNetAmount = transactions.reduce((s, t) => s + t.net_amount, 0)

  const farmerStats = transactions.reduce((acc, t) => { acc[t.farmer_name] = (acc[t.farmer_name] || 0) + t.net_amount; return acc }, {})
  const topFarmers = Object.entries(farmerStats).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name, amount]) => ({ name, amount }))
  const cropStats = transactions.reduce((acc, t) => { acc[t.crop] = (acc[t.crop] || 0) + t.quantity; return acc }, {})
  const cropData = Object.entries(cropStats).map(([name, value]) => ({ name, value }))
  const COLORS = ['#15803d', '#eab308', '#3b82f6', '#ef4444', '#8b5cf6']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h2 className="text-3xl font-bold text-primary mb-8">{t('analytics')}</h2>
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="card p-6 text-center"><p>{t('totalTransactions')}</p><p className="text-3xl font-bold text-primary">{totalTransactions}</p></div>
              <div className="card p-6 text-center"><p>{t('totalCommission')}</p><p className="text-3xl font-bold text-primary">₹{totalCommission.toFixed(2)}</p></div>
              <div className="card p-6 text-center"><p>{t('totalNetAmount')}</p><p className="text-3xl font-bold text-primary">₹{totalNetAmount.toFixed(2)}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6"><h3 className="text-xl font-semibold mb-4">{t('topFarmers')}</h3><ResponsiveContainer width="100%" height={300}><BarChart data={topFarmers}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#15803d" /></BarChart></ResponsiveContainer></div>
              <div className="card p-6"><h3 className="text-xl font-semibold mb-4">{t('cropDistribution')}</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={cropData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{cropData.map((e,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
export default Analytics