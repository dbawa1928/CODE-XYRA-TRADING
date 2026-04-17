import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { GiFarmer } from 'react-icons/gi'
import { FaFingerprint } from 'react-icons/fa'
import { registerBiometric, loginWithBiometric } from '../utils/biometric'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const supported = window.PublicKeyCredential !== undefined
    setBiometricSupported(supported)
    const hasBio = localStorage.getItem('biometric_credential')
    if (hasBio) setBiometricRegistered(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/home')
      // After login, ask to enable biometric
      if (biometricSupported && !localStorage.getItem('biometric_credential')) {
        const enable = window.confirm('Enable fingerprint/Face ID for faster login next time?')
        if (enable) {
          const res = await registerBiometric(username)
          if (res.success) showToast('Biometric enabled', 'success')
          else showToast('Biometric setup failed', 'error')
        }
      }
    } else setError('Invalid credentials')
  }

  const handleBiometricLogin = async () => {
    const res = await loginWithBiometric()
    if (res.success && res.username) {
      const success = await login(res.username, 'biometric') // You need to adjust your login to accept biometric token. For simplicity, we can store a token. I'll modify AuthContext to accept a special flag.
      if (success) navigate('/home')
      else showToast('Biometric login failed', 'error')
    } else {
      showToast('Biometric authentication failed', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary inline-block p-4 rounded-full mb-4"><GiFarmer className="text-4xl text-white" /></div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600">CodeXyra Trading</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" required autoComplete="username" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required autoComplete="current-password" />
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" className="btn-primary w-full">Login</button>
        </form>
        {biometricSupported && biometricRegistered && (
          <button onClick={handleBiometricLogin} className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 rounded-lg hover:bg-gray-300 transition">
            <FaFingerprint /> Use Fingerprint / Face ID
          </button>
        )}
        <div className="mt-6 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </div>
      </div>
    </div>
  )
}
export default Login