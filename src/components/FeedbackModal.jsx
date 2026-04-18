import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import StarRatings from 'react-star-ratings'
import { FaTimes } from 'react-icons/fa'

const FeedbackModal = ({ isOpen, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error')
      return
    }
    setSubmitting(true)
    const { error } = await supabase
      .from('user_feedback')
      .insert([{
        user_id: user?.id,
        rating,
        review,
        created_at: new Date()
      }])
    setSubmitting(false)
    if (error) {
      console.error('Failed to save feedback', error)
      showToast('Failed to save feedback. Please try again.', 'error')
    } else {
      localStorage.setItem('feedback_given', 'true')
      showToast('Thank you for your feedback!', 'success')
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-primary">We value your feedback!</h2>
          <button onClick={onClose} className="text-gray-500"><FaTimes /></button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            How would you rate your experience?
          </p>
          <div className="flex justify-center mb-4">
            <StarRatings
              rating={rating}
              starRatedColor="#fbbf24"
              starHoverColor="#f59e0b"
              changeRating={setRating}
              numberOfStars={5}
              starDimension="35px"
              starSpacing="4px"
            />
          </div>
          <textarea
            placeholder="Optional: Write a short review (e.g., 'Easy to use, great features')"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            className="input-field w-full"
          />
        </div>
        <div className="p-4 border-t flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Maybe later</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackModal
