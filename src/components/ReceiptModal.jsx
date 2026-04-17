import { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { FaDownload, FaWhatsapp, FaPrint, FaTimes } from 'react-icons/fa'

const ReceiptModal = ({ isOpen, onClose, type, data }) => {
  const receiptRef = useRef()
  const [totalKg, setTotalKg] = useState('')
  const [bagWeight, setBagWeight] = useState(50)
  const [bags, setBags] = useState('')
  const [farmerChargesPerBag, setFarmerChargesPerBag] = useState(0)
  const [buyerChargesPerBag, setBuyerChargesPerBag] = useState({ labour: 0, silai: 0 })

  const farmerCharges = { 50: 7.16, 30: 4.30 }
  const buyerCharges = {
    50: { labour: 7.50, silai: 1.71 },
    30: { labour: 4.46, silai: 1.71 }
  }

  useEffect(() => {
    if (!isOpen) return
    if (data?.weightKg) setTotalKg(data.weightKg.toString())
    else if (data?.quantity) setTotalKg((data.quantity * 100).toString())
    else setTotalKg('')
    if (data?.bagWeight) setBagWeight(data.bagWeight)
    if (data?.bags) setBags(data.bags.toString())
    if (data?.crop === 'Wheat') {
      const bw = data.bagWeight || 50
      setFarmerChargesPerBag(farmerCharges[bw] || 0)
      setBuyerChargesPerBag(buyerCharges[bw] || { labour: 0, silai: 0 })
    } else {
      setFarmerChargesPerBag(0)
      setBuyerChargesPerBag({ labour: 0, silai: 0 })
    }
  }, [isOpen, data])

  const kg = parseFloat(totalKg) || 0
  const qtl = kg / 100
  const numBags = parseFloat(bags) || (kg / bagWeight)
  const pricePerQtl = parseFloat(data?.rate) || 0
  const totalPrice = qtl * pricePerQtl

  let farmerTotal = 0, buyerLabourTotal = 0, buyerSilaiTotal = 0, finalAmount = 0
  if (type === 'I') {
    farmerTotal = farmerChargesPerBag * numBags
    finalAmount = totalPrice - farmerTotal
  } else {
    buyerLabourTotal = buyerChargesPerBag.labour * numBags
    buyerSilaiTotal = buyerChargesPerBag.silai * numBags
    finalAmount = totalPrice - (buyerLabourTotal + buyerSilaiTotal)
  }

  const formatNumber = (n) => (isNaN(n) ? '0.00' : n.toFixed(2))
  if (!isOpen) return null
  if (!data || !data.farmerName) return <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center p-4"><div className="bg-white p-6 rounded">Error: Receipt data incomplete.</div></div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex justify-between">
          <h2 className="text-2xl font-bold text-primary">{type} FORM – MANDI RECEIPT</h2>
          <button onClick={onClose}><FaTimes size={24} /></button>
        </div>
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm">Total Weight (KG)</label><input type="number" value={totalKg} onChange={(e) => setTotalKg(e.target.value)} className="input-field" /></div>
            <div><label className="text-sm">Bag Weight (KG)</label><input type="number" value={bagWeight} onChange={(e) => setBagWeight(e.target.value)} className="input-field" /></div>
          </div>
        </div>
        <div ref={receiptRef} className="p-6 bg-white dark:bg-gray-800">
          <div className="text-center border-b-2 border-primary pb-6 mb-6">
            <h1 className="text-3xl font-bold text-primary uppercase">CodeXyra Trading</h1>
            <p className="text-gray-600">Mandi Crop Transaction Receipt</p>
            <p className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm mt-2">{type} FORM | {new Date(data.date).toLocaleDateString()}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border p-4 rounded"><h3 className="font-bold">Farmer Details</h3><p>{data.farmerName}</p><p>{data.phone || 'N/A'}</p><p>{data.date}</p></div>
            <div className="border p-4 rounded"><h3 className="font-bold">Crop Details</h3><p>{data.crop}</p><p>Rate: ₹{data.rate}/Qtl</p></div>
          </div>
          <div className="bg-primary/5 p-4 rounded mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-sm">Total Weight</p><p className="font-bold">{formatNumber(kg)} KG / {formatNumber(qtl)} QTL</p></div>
              <div><p className="text-sm">Bag Weight</p><p className="font-bold">{bagWeight} KG</p></div>
              <div><p className="text-sm">Number of Bags</p><p className="font-bold">{formatNumber(numBags)}</p></div>
            </div>
          </div>
          <table className="w-full border-collapse mb-6">
            <thead><tr className="bg-primary text-white"><th className="p-2 text-left">Description</th><th className="p-2 text-right">Amount (₹)</th></tr></thead>
            <tbody>
              <tr><td className="p-2">Total Price</td><td className="p-2 text-right">{formatNumber(totalPrice)}</td></tr>
              {type === 'I' && (
                <>
                  <tr><td className="p-2">Farmer Charges (Cleaning + Commission) @ ₹{farmerChargesPerBag}/bag</td><td className="p-2 text-right">{formatNumber(farmerTotal)}</td></tr>
                  <tr className="font-bold bg-green-50"><td className="p-2">NET PAYABLE TO FARMER</td><td className="p-2 text-right text-primary">{formatNumber(finalAmount)}</td></tr>
                </>
              )}
              {type === 'J' && (
                <>
                  <tr><td className="p-2">Labour (Loading/Unloading) @ ₹{buyerChargesPerBag.labour}/bag</td><td className="p-2 text-right">{formatNumber(buyerLabourTotal)}</td></tr>
                  <tr><td className="p-2">Silai (Stitching) @ ₹{buyerChargesPerBag.silai}/bag</td><td className="p-2 text-right">{formatNumber(buyerSilaiTotal)}</td></tr>
                  <tr className="font-bold bg-blue-50"><td className="p-2">TOTAL BUYER COSTS</td><td className="p-2 text-right text-primary">{formatNumber(buyerLabourTotal + buyerSilaiTotal)}</td></tr>
                </>
              )}
            </tbody>
          </table>
          <div className="text-center text-sm text-gray-500">Thank you for your business!</div>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button onClick={() => html2pdf().set({ margin: 0.4 }).from(receiptRef.current).save()} className="flex-1 bg-primary text-white py-2 rounded">PDF</button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${type} Form for ${data.farmerName}`)}`, '_blank')} className="flex-1 bg-green-600 text-white py-2 rounded">WhatsApp</button>
          <button onClick={() => { const w = window.open('', '_blank'); w.document.write(receiptRef.current.outerHTML); w.print(); }} className="flex-1 bg-blue-600 text-white py-2 rounded">Print</button>
        </div>
      </div>
    </div>
  )
}
export default ReceiptModal