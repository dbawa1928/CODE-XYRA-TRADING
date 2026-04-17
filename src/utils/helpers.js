// src/utils/helpers.js
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN')
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}