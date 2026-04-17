import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import StarRatings from 'react-star-ratings'

const RateUs = () => {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const { showToast } = useToast()
  const { t } = useLanguage()

  const submitRating = async () => {
    if (rating === 0) return showToast('Select a rating', 'error')
    const { error } = await supabase.from('ratings').insert([{ rating }])
    if (error) showToast('Error saving rating', 'error')
    else { setSubmitted(true); showToast('Thank you!', 'success') }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="card p-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">⭐ {t('rateUs')}</h2>
          <p className="text-gray-600 mb-8">Your feedback helps us improve!</p>
          {!submitted ? (
            <>
              <div className="flex justify-center mb-6"><StarRatings rating={rating} starRatedColor="#fbbf24" starHoverColor="#f59e0b" changeRating={setRating} numberOfStars={5} starDimension="40px" starSpacing="8px" /></div>
              <button onClick={submitRating} className="btn-primary">Submit Rating</button>
            </>
          ) : (
            <div><p className="text-green-600 text-lg mb-4">Thank you for rating us!</p><button onClick={() => setSubmitted(false)} className="btn-primary">Rate Again</button></div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default RateUs