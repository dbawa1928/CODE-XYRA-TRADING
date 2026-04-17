import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Privacy Policy</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Last updated: April 2025 | Effective: April 2025</p>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>At CodeXyra Trading, we respect your privacy and are committed to protecting your personal data.</p>
            <h3 className="font-semibold text-primary mt-4">1. Information We Collect</h3><p>We collect transaction data including farmer names, phone numbers, crop details, transaction amounts, and payment status.</p>
            <h3 className="font-semibold text-primary mt-4">2. How We Use Your Data</h3><p>Your data is used solely for generating transaction forms, maintaining history, providing calculation services, and analytics. We do not sell your data to third parties.</p>
            <h3 className="font-semibold text-primary mt-4">3. Data Storage & Security</h3><p>All data is stored using Supabase with industry-standard encryption. Access is restricted to authenticated users of your tenant only.</p>
            <h3 className="font-semibold text-primary mt-4">4. Data Retention</h3><p>We retain transaction records indefinitely unless you request deletion. You can delete individual records from the history page.</p>
            <h3 className="font-semibold text-primary mt-4">5. Your Rights</h3><p>You have the right to access, correct, or delete your data. Contact us at codexyra.connect@gmail.com.</p>
            <h3 className="font-semibold text-primary mt-4">6. Contact Us</h3><p>Email: codexyra.connect@gmail.com | Phone: 6329520582</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default PrivacyPolicy