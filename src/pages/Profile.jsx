import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { user, changePassword, changeUsername } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [message, setMessage] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage('Passwords do not match'); return }
    const success = await changePassword(oldPassword, newPassword)
    if (success) { setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setMessage('Password changed') }
    else setMessage('Old password is incorrect')
  }

  const handleChangeUsername = async (e) => {
    e.preventDefault()
    if (!newUsername.trim()) { setMessage('Username cannot be empty'); return }
    const success = await changeUsername(newUsername, usernamePassword)
    if (success) { setNewUsername(''); setUsernamePassword(''); setMessage('Username changed') }
    else setMessage('Failed to change username (incorrect password or username taken)')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Profile</h2>
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Role:</strong> {user?.role === 'admin' ? 'Administrator' : 'Worker'}</p>
            <p><strong>Tenant ID:</strong> {user?.tenantId?.slice(0,8)}...</p>
          </div>
          {message && <div className="mb-4 p-2 rounded text-center bg-blue-100 text-blue-700">{message}</div>}
          <div className="mb-8 border-b pb-6">
            <h3 className="text-lg font-semibold mb-3">Change Username</h3>
            <form onSubmit={handleChangeUsername} className="space-y-4">
              <input type="text" placeholder="New Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="input-field" required />
              <input type="password" placeholder="Confirm with your password" value={usernamePassword} onChange={(e) => setUsernamePassword(e.target.value)} className="input-field" required autoComplete="current-password" />
              <button type="submit" className="btn-primary w-full">Update Username</button>
            </form>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="input-field" required autoComplete="current-password" />
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required autoComplete="new-password" />
              <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
              <button type="submit" className="btn-primary w-full">Update Password</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default Profile