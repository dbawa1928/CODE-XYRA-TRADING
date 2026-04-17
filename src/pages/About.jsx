import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { GiFarmer, GiWheat, GiFruitTree } from 'react-icons/gi'

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold text-primary mb-2">CodeXyra Trading</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Version 2.0.0 | Multi‑tenant Mandi Platform</p>
          <div className="space-y-6">
            <div><h3 className="text-xl font-semibold text-primary mb-2">Our Mission</h3><p>CodeXyra Trading simplifies crop transaction calculations for mandi agents, farmers, and traders. We empower every mandi stakeholder with technology that saves time and reduces errors.</p></div>
            <div><h3 className="text-xl font-semibold text-primary mb-2">What We Do</h3><ul className="space-y-2"><li className="flex items-center gap-2"><GiFruitTree className="text-primary" /> • Instant crop transaction calculations</li><li className="flex items-center gap-2"><GiWheat className="text-primary" /> • Generate professional I Form & J Form</li><li className="flex items-center gap-2"><GiFarmer className="text-primary" /> • Securely save transaction history</li><li>• Share receipts via WhatsApp & PDF</li><li>• Multi‑tenant support (each user has isolated data)</li><li>• Payment tracking (Paid/Unpaid status)</li><li>• Analytics dashboard</li></ul></div>
            <div><h3 className="text-xl font-semibold text-primary mb-2">Who We Are</h3><p>Built by <span className="font-semibold">Code Xyra Labs</span> – dedicated to bringing digital solutions to India's mandi ecosystem.</p></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
export default About