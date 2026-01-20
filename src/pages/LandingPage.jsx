import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Zap, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Shield,
  HeadphonesIcon,
  ArrowRight,
  MessageCircle
} from 'lucide-react'
import axios from 'axios'

const LandingPage = () => {
  const [settings, setSettings] = useState({})
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, productsRes] = await Promise.all([
        axios.get('https://api-inventory.isavralabel.com/zero-lighting/api/public/settings'),
        axios.get('https://api-inventory.isavralabel.com/zero-lighting/api/public/products')
      ])
      setSettings(settingsRes.data)
      setProducts(productsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Format phone number for WhatsApp (convert to international format)
  const formatWhatsAppNumber = (phoneNumber) => {
    if (!phoneNumber) return null
    
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // If starts with 0, replace with 62 (Indonesia country code)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1)
    }
    // If doesn't start with 62, add it
    else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned
    }
    
    return cleaned
  }

  const handleWhatsAppClick = (productName = null) => {
    const whatsappNumber = formatWhatsAppNumber(settings.company_mobile)
    
    if (!whatsappNumber) {
      alert('Nomor WhatsApp tidak tersedia. Silakan hubungi admin.')
      return
    }

    let message = `Halo, saya tertarik untuk menyewa genset`
    
    if (productName) {
      message += ` *${productName}*`
    }
    
    message += `. Mohon informasi lebih lanjut.`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const features = [
    {
      icon: Shield,
      title: 'Kualitas Terjamin',
      description: 'Genset berkualitas tinggi dari merek-merek ternama dunia'
    },
    {
      icon: TrendingUp,
      title: 'Harga Kompetitif',
      description: 'Harga sewa yang bersaing dengan sistem pembayaran fleksibel'
    },
    {
      icon: HeadphonesIcon,
      title: 'Support 24/7',
      description: 'Tim teknis kami siap membantu kapan pun Anda membutuhkan'
    },
    {
      icon: CheckCircle,
      title: 'Pengiriman Cepat',
      description: 'Layanan antar-jemput untuk area Jakarta dan sekitarnya'
    }
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {settings.hero_title || 'Sewa Genset Berkualitas & Terpercaya'}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {settings.hero_subtitle || 'Solusi listrik cadangan untuk kebutuhan bisnis dan acara Anda. Tersedia berbagai kapasitas dengan harga kompetitif.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#products" 
                  className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-center flex items-center justify-center gap-2"
                >
                  Lihat Produk
                  <ArrowRight size={20} />
                </a>
                <Link 
                  to="/contact" 
                  className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg hover:bg-green-50 transition-colors font-semibold text-center"
                >
                  Hubungi Kami
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-8 shadow-2xl overflow-hidden">
                {settings.hero_image ? (
                  <img 
                    src={`https://api-inventory.isavralabel.com/zero-lighting${settings.hero_image}`}
                    alt="Hero"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <Zap className="w-64 h-64 text-white mx-auto" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-xl text-gray-600">Komitmen kami untuk memberikan layanan terbaik</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Produk Genset Kami</h2>
            <p className="text-xl text-gray-600">Pilihan genset berkualitas untuk berbagai kebutuhan</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={`https://api-inventory.isavralabel.com/zero-lighting${product.image}`} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Zap className="w-32 h-32 text-gray-400" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {product.capacity}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {product.fuel_type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    {product.features && (
                      <ul className="space-y-2 mb-4">
                        {product.features.split('|').slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Harga sewa/hari</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(product.daily_rate)}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleWhatsAppClick(product.name)}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <MessageCircle size={18} />
                          Sewa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Tentang Kami</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {settings.about_us || 'ZEO Lighting adalah penyedia layanan rental genset terpercaya dengan pengalaman Lebih dari 5 tahun. Kami menyediakan genset berkualitas tinggi dari berbagai merek ternama untuk memenuhi kebutuhan listrik cadangan Anda.'}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Berpengalaman</h4>
                    <p className="text-gray-600">Lebih dari 5 tahun melayani kebutuhan genset di Indonesia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Profesional</h4>
                    <p className="text-gray-600">Tim teknisi bersertifikat dan berpengalaman</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Terpercaya</h4>
                    <p className="text-gray-600">Dipercaya oleh ratusan perusahaan dan individu</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-12 text-white">
              <div className="space-y-8">
                <div>
                  <p className="text-6xl font-bold mb-2">5+</p>
                  <p className="text-xl">Tahun Pengalaman</p>
                </div>
                <div>
                  <p className="text-6xl font-bold mb-2">500+</p>
                  <p className="text-xl">Klien Puas</p>
                </div>
                <div>
                  <p className="text-6xl font-bold mb-2">50+</p>
                  <p className="text-xl">Unit Genset</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Hubungi Kami</h2>
            <p className="text-xl opacity-90">Kami siap melayani kebutuhan Anda</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Telepon</h3>
              <p className="opacity-90">{settings.company_phone || '021-12345678'}</p>
              <p className="opacity-90">{settings.company_mobile || '0812-3456-7890'}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Email</h3>
              <p className="opacity-90">{settings.company_email || 'info@zcolighting.com'}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Alamat</h3>
              <p className="opacity-90">{settings.company_address || 'Jakarta'}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">Jam Operasional</h3>
              <p className="opacity-90">{settings.business_hours || 'Senin - Sabtu: 08:00 - 17:00'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <img 
              src="/src/assets/logo.jpeg" 
              alt="Logo" 
              className="h-16 w-auto mx-auto object-contain mb-4"
            />
            <p className="text-gray-400">
              {settings.company_name || 'ZEO Lighting - Rental Genset'}
            </p>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} {settings.company_name || 'ZEO Lighting'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <button
        onClick={() => handleWhatsAppClick()}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-50 group"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat via WhatsApp
        </span>
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
      </button>
    </div>
  )
}

export default LandingPage
