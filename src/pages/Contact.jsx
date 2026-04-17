import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BackButton from '../components/BackButton'
import { FaPhone, FaEnvelope, FaInstagram, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa'

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <BackButton />
      <main className="flex-grow max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">Contact CodeXyra Trading</h2>
          <div className="space-y-4">
            <ContactItem icon={<FaPhone />} label="Phone" value="+91 63295 20582" href="tel:6329520582" />
            <ContactItem icon={<FaEnvelope />} label="Email" value="codexyra.connect@gmail.com" href="mailto:codexyra.connect@gmail.com" />
            <ContactItem icon={<FaInstagram />} label="Instagram" value="@codexyralabs" href="https://instagram.com/codexyralabs" />
            <ContactItem icon={<FaGlobe />} label="Website" value="codexyralabs.site" href="https://codexyralabs.site" />
            <ContactItem icon={<FaMapMarkerAlt />} label="Office" value="Chandigarh, India" href="#" />
          </div>
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"><p className="text-center text-sm">For support, feature requests, or partnership inquiries, please email us.</p></div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
const ContactItem = ({ icon, label, value, href }) => (
  <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:shadow transition">
    <div className="text-primary text-2xl">{icon}</div>
    <div><p className="font-semibold">{label}</p><a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-primary break-all">{value}</a></div>
  </div>
)
export default Contact