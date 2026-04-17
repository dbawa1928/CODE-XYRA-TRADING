import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GiFarmer, GiWheat } from 'react-icons/gi'

const Splash = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scrollText, setScrollText] = useState('')
  const fullText = 'CODEXYRA TRADING | BY CODEXYRALABS'

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setScrollText(fullText.slice(0, index + 1))
      index++
      if (index > fullText.length) index = 0
    }, 100)
    const timer = setTimeout(() => user ? navigate('/home') : navigate('/login'), 2500)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [navigate, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-green-700 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-full p-8 mb-6 inline-block shadow-2xl">
          <GiFarmer className="text-6xl text-primary" />
          <GiWheat className="text-5xl text-yellow-600 -mt-4" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">CodeXyra Trading</h1>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 max-w-xs mx-auto">
          <p className="text-white text-sm font-mono whitespace-nowrap overflow-hidden">{scrollText}</p>
        </div>
      </div>
    </div>
  )
}
export default Splash