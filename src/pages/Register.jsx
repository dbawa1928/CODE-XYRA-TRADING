import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import { GiFarmer } from 'react-icons/gi'
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

const Register = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  // Debounced username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (username.trim().length < 3) {
        setUsernameAvailable(null)
        return
      }
      setCheckingUsername(true)
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      setCheckingUsername(false)
      if (error) {
        setUsernameAvailable(null)
      } else {
        setUsernameAvailable(!data)
      }
    }
    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (usernameAvailable === false) {
      setError('Username already taken')
      return
    }
    const success = await register(username, password)
    if (success) navigate('/home')
    else setError('Registration failed. Username may exist.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary inline-block p-4 rounded-full mb-4"><GiFarmer className="text-4xl text-white" /></div>
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600">CodeXyra Trading</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field with availability indicator */}
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pr-10"
                required
                autoComplete="username"
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                {checkingUsername && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                {!checkingUsername && usernameAvailable === true && <FaCheckCircle className="text-green-500" size={18} />}
                {!checkingUsername && usernameAvailable === false && <FaTimesCircle className="text-red-500" size={18} />}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-500 mt-1">Username already taken</p>
            )}
            {usernameAvailable === true && username.length >= 3 && (
              <p className="text-xs text-green-500 mt-1">Username available</p>
            )}
          </div>

          {/* Password field with toggle */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-10"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Confirm password field with toggle */}
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pr-10"
              required
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" className="btn-primary w-full">Register</button>
        </form>
        <div className="mt-6 text-center text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </div>
      </div>
    </div>
  )
}
export default Register
