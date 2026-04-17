import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'

const ManageWorkers = () => {
  const { user, addWorker, deleteWorker, getWorkers } = useAuth()
  const [workers, setWorkers] = useState([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  const loadWorkers = async () => { setWorkers(await getWorkers()) }

  useEffect(() => { loadWorkers() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const success = await addWorker(newUsername, newPassword)
    if (success) { setNewUsername(''); setNewPassword(''); loadWorkers(); setMessage(`Worker ${newUsername} added`) }
    else setMessage('Failed to add worker')
  }

  const handleDelete = async (id, username) => {
    if (window.confirm(`Delete worker "${username}"?`)) { await deleteWorker(id); loadWorkers() }
  }

  if (user?.role !== 'admin') return <div className="min-h-screen flex justify-center items-center"><div className="card p-8 text-center"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p>Only administrators can manage workers.</p></div></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Manage Workers</h2>
          {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
          <form onSubmit={handleAdd} className="mb-8 space-y-4">
            <input type="text" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="input-field" required />
            <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required />
            <button type="submit" className="btn-primary w-full">Add Worker</button>
          </form>
          <h3 className="text-lg font-semibold mb-3">Existing Workers</h3>
          {workers.length === 0 && <p className="text-gray-500">No workers added yet.</p>}
          <ul className="space-y-2">
            {workers.map(w => (
              <li key={w.id} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">{w.username}</span>
                <button onClick={() => handleDelete(w.id, w.username)} className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded border border-red-300 hover:bg-red-50">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default ManageWorkers