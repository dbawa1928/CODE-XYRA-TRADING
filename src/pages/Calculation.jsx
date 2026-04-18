import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import ReceiptModal from '../components/ReceiptModal'
import FeedbackModal from '../components/FeedbackModal'
import { supabase } from '../supabaseClient'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useAutoSave } from '../hooks/useAutoSave'
import { useAuth } from '../contexts/AuthContext'
import { FaCalculator, FaFileInvoice, FaFileAlt, FaPlus, FaStar } from 'react-icons/fa'

const Calculation = () => {
  const { showToast } = useToast()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    crop: 'Wheat',
    farmerName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    bagWeight: 50,
    bags: '',
    weightKg: '',
    quantity: '',
    rate: 2585,
    commissionPercent: 2.5,
    labourCost: 40,
    farmerChargesPerBag: 7.16,
    farmerChargesTotal: 0
  })
  const [calculationResult, setCalculationResult] = useState(null)
  const [showIModal, setShowIModal] = useState(false)
  const [showJModal, setShowJModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [lastSavedHash, setLastSavedHash] = useState(null)
  const { loadDraft, clearDraft } = useAutoSave('calc_draft', formData)

  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.farmerName) setFormData(draft)
  }, [])

  const cropDefaults = {
    Wheat: { rate: 2585, commissionPercent: 2.5, labourCost: 40 },
    Paddy: { rate: 2370, commissionPercent: 2.5, labourCost: 40 },
    Basmati: { rate: 4000, commissionPercent: 2.5, labourCost: 40 }
  }

  useEffect(() => {
    const defaults = cropDefaults[formData.crop]
    setFormData(prev => ({
      ...prev,
      rate: defaults.rate,
      commissionPercent: defaults.commissionPercent,
      labourCost: defaults.labourCost
    }))
  }, [formData.crop])

  useEffect(() => {
    if (formData.crop === 'Wheat') {
      const bagWt = parseFloat(formData.bagWeight)
      let perBag = 0
      if (bagWt === 50) perBag = 7.16
      else if (bagWt === 30) perBag = 4.30
      else perBag = 0
      setFormData(prev => ({ ...prev, farmerChargesPerBag: perBag }))
    }
  }, [formData.crop, formData.bagWeight])

  useEffect(() => {
    const bagWt = parseFloat(formData.bagWeight) || 50
    const numBags = parseFloat(formData.bags)
    if (!isNaN(numBags) && numBags > 0) {
      const totalKg = numBags * bagWt
      const totalQtls = totalKg / 100
      setFormData(prev => ({
        ...prev,
        weightKg: totalKg.toFixed(2),
        quantity: totalQtls.toFixed(2),
        farmerChargesTotal: (prev.farmerChargesPerBag * numBags).toFixed(2)
      }))
    } else {
      setFormData(prev => ({ ...prev, weightKg: '', quantity: '', farmerChargesTotal: 0 }))
    }
  }, [formData.bags, formData.bagWeight, formData.farmerChargesPerBag])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateHash = (data) => `${data.farmerName}|${data.crop}|${data.date}|${data.weightKg}|${data.bagWeight}|${data.rate}|${data.commissionPercent}|${data.labourCost}|${data.farmerChargesPerBag}`

  const calculateAndSave = async () => {
    if (!formData.farmerName.trim()) {
      showToast('Enter farmer name', 'error')
      return
    }
    const kg = parseFloat(formData.weightKg) || 0
    if (kg <= 0) {
      showToast('Enter valid number of bags', 'error')
      return
    }
    const qty = kg / 100
    const rate = parseFloat(formData.rate) || 0
    const totalPrice = qty * rate

    let totalCharges = 0
    if (formData.crop === 'Wheat') {
      totalCharges = parseFloat(formData.farmerChargesTotal) || 0
    } else {
      const commissionAmount = (totalPrice * parseFloat(formData.commissionPercent)) / 100
      const labourCost = parseFloat(formData.labourCost) || 0
      totalCharges = commissionAmount + labourCost
    }
    const netAmount = totalPrice - totalCharges

    const result = {
      farmerName: formData.farmerName,
      quantity: qty,
      rate: rate,
      totalAmount: totalPrice,
      totalCharges: totalCharges,
      netAmount: netAmount,
      weightKg: kg,
      bagWeight: formData.bagWeight,
      bags: formData.bags,
      farmerChargesPerBag: formData.farmerChargesPerBag,
      farmerChargesTotal: totalCharges
    }
    setCalculationResult(result)

    const currentHash = generateHash(formData)
    if (lastSavedHash === currentHash) {
      showToast('Duplicate transaction not saved', 'error')
      return
    }

    const record = {
      farmer_name: formData.farmerName,
      phone: formData.phone,
      crop: formData.crop,
      date: formData.date,
      quantity: qty,
      rate: rate,
      commission: formData.crop === 'Wheat' ? 0 : parseFloat(formData.commissionPercent),
      labour: formData.crop === 'Wheat' ? 0 : parseFloat(formData.labourCost),
      transport: 0,
      total_amount: totalPrice,
      net_amount: netAmount,
      payment_status: 'unpaid',
      weight_kg: kg,
      bag_weight: formData.bagWeight,
      bags: formData.bags,
      farmer_charges_per_bag: formData.farmerChargesPerBag,
      farmer_charges_total: totalCharges,
      user_id: user?.id,
      tenant_id: user?.tenantId
    }

    const { error } = await supabase.from('transactions').insert([record])
    if (error) {
      showToast('Error saving', 'error')
    } else {
      showToast('Saved!', 'success')
      setLastSavedHash(currentHash)
      clearDraft()
      // ❌ Removed automatic feedback popup – now only manual button
    }
  }

  const resetForm = () => {
    setFormData({
      crop: 'Wheat',
      farmerName: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      bagWeight: 50,
      bags: '',
      weightKg: '',
      quantity: '',
      rate: 2585,
      commissionPercent: 2.5,
      labourCost: 40,
      farmerChargesPerBag: 7.16,
      farmerChargesTotal: 0
    })
    setCalculationResult(null)
    clearDraft()
    showToast('New transaction ready', 'success')
  }

  const transactionData = { ...formData, ...calculationResult }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full">
        <h2 className="text-3xl font-bold text-primary mb-6">Crop Transaction Calculator</h2>
        <div className="card p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block font-medium mb-1">Crop Type</label><select name="crop" value={formData.crop} onChange={handleInputChange} className="input-field"><option>Wheat</option><option>Paddy</option><option>Basmati</option></select></div>
            <div><label className="block font-medium mb-1">Farmer Name *</label><input name="farmerName" value={formData.farmerName} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block font-medium mb-1">Phone Number</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block font-medium mb-1">Date</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="input-field" /></div>
            <div><label className="block font-medium mb-1">Weight per Bag (KG)</label><input type="number" name="bagWeight" value={formData.bagWeight} onChange={handleInputChange} className="input-field" step="1" /></div>
            <div><label className="block font-medium mb-1">Number of Bags</label><input type="number" name="bags" value={formData.bags} onChange={handleInputChange} className="input-field" step="any" placeholder="e.g., 100" /></div>
            <div><label className="block font-medium mb-1">Total Weight (KG)</label><input type="number" name="weightKg" value={formData.weightKg} disabled className="input-field bg-gray-100 dark:bg-gray-800" /></div>
            <div><label className="block font-medium mb-1">Quantity (Quintal)</label><input type="number" name="quantity" value={formData.quantity} disabled className="input-field bg-gray-100 dark:bg-gray-800" /></div>
            {formData.crop === 'Wheat' ? (
              <>
                <div><label className="block font-medium mb-1">Farmer Charges (₹ per bag)</label><input type="number" name="farmerChargesPerBag" value={formData.farmerChargesPerBag} onChange={handleInputChange} className="input-field" step="0.01" /></div>
                <div><label className="block font-medium mb-1">Total Farmer Charges (₹)</label><input type="number" name="farmerChargesTotal" value={formData.farmerChargesTotal} disabled className="input-field bg-gray-100 dark:bg-gray-800" /></div>
              </>
            ) : (
              <>
                <div><label className="block font-medium mb-1">Commission (%)</label><input type="number" name="commissionPercent" value={formData.commissionPercent} onChange={handleInputChange} className="input-field" step="0.1" /></div>
                <div><label className="block font-medium mb-1">Labour (₹)</label><input type="number" name="labourCost" value={formData.labourCost} onChange={handleInputChange} className="input-field" step="0.01" /></div>
              </>
            )}
            <div><label className="block font-medium mb-1">Rate (₹ per Quintal)</label><input type="number" name="rate" value={formData.rate} onChange={handleInputChange} className="input-field" step="0.01" /></div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button onClick={calculateAndSave} className="btn-primary flex-1"><FaCalculator className="inline mr-2" /> Calculate & Save</button>
            <button onClick={resetForm} className="btn-secondary flex-1"><FaPlus className="inline mr-2" /> New Transaction</button>
          </div>
        </div>
        {calculationResult && (
          <div className="card p-6 mt-8">
            <h3 className="text-xl font-bold text-primary mb-4">📋 Net Payable</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Farmer:</span><span>{calculationResult.farmerName}</span></div>
              <div className="flex justify-between"><span>Total Weight:</span><span>{calculationResult.weightKg} KG ({(calculationResult.weightKg/100).toFixed(2)} QTL)</span></div>
              <div className="flex justify-between"><span>Bags ({calculationResult.bagWeight} KG/bag):</span><span>{calculationResult.bags}</span></div>
              <div className="flex justify-between"><span>Total Price:</span><span>₹{calculationResult.totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Total Charges:</span><span>₹{calculationResult.totalCharges.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold text-primary text-lg"><span>Net Payable:</span><span>₹{calculationResult.netAmount.toFixed(2)}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button onClick={() => setShowIModal(true)} className="bg-green-600 text-white px-5 py-2 rounded-xl"><FaFileInvoice className="inline mr-2" /> Generate I Form</button>
              <button onClick={() => setShowJModal(true)} className="bg-orange-600 text-white px-5 py-2 rounded-xl"><FaFileAlt className="inline mr-2" /> Generate J Form</button>
              {/* Highlighted feedback button – user clicks to open modal */}
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <FaStar /> Give Feedback
              </button>
            </div>
          </div>
        )}
      </main>
      <ReceiptModal isOpen={showIModal} onClose={() => setShowIModal(false)} type="I" data={transactionData} />
      <ReceiptModal isOpen={showJModal} onClose={() => setShowJModal(false)} type="J" data={transactionData} />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSuccess={() => console.log('Feedback saved')}
      />
      <Footer />
    </div>
  )
}
export default Calculation
