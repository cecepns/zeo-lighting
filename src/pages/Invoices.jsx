import React, { useState, useEffect } from 'react'
import { invoicesAPI, poAPI } from '../utils/api'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Receipt, Calendar, DollarSign, FileText, Search, Download } from 'lucide-react'
import jsPDF from 'jspdf'

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const [availablePOs, setAvailablePOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [formData, setFormData] = useState({
    po_id: '',
    amount: '',
    payment_type: 'dp',
    payment_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchInvoices()
    fetchAvailablePOs()
  }, [pagination.page, searchTerm])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await invoicesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      })
      setInvoices(response.data.data)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePOs = async () => {
    try {
      const response = await poAPI.getAll({ limit: 100 })
      // Filter PO yang aktif atau sudah di proses
      const activePOs = response.data.data.filter(po => 
        po.status === 'processed' || po.status === 'active' || po.status === 'returned'
      )
      setAvailablePOs(activePOs)
    } catch (error) {
      console.error('Error fetching POs:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchTerm(searchInput)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await invoicesAPI.create({
        ...formData,
        amount: parseInt(formData.amount)
      })
      
      await fetchInvoices()
      handleCloseModal()
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Gagal membuat kwitansi')
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setFormData({
      po_id: '',
      amount: '',
      payment_type: 'dp',
      payment_date: '',
      notes: ''
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const getPaymentTypeBadge = (type) => {
    const typeConfig = {
      dp: { color: 'bg-blue-100 text-blue-800', label: 'DP' },
      full: { color: 'bg-green-100 text-green-800', label: 'Lunas' },
      installment: { color: 'bg-yellow-100 text-yellow-800', label: 'Cicilan' }
    }
    
    const config = typeConfig[type] || typeConfig.dp
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentTypeLabel = (type) => {
    const typeLabels = {
      dp: 'DP (Down Payment)',
      full: 'Lunas',
      installment: 'Cicilan'
    }
    return typeLabels[type] || 'DP'
  }

  const numberToWords = (num) => {
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh']
    const scales = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun']

    if (num === 0) return 'Nol'

    const convertLessThanThousand = (n) => {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n === 10) return 'Sepuluh'
      if (n === 11) return 'Sebelas'
      if (n < 20) return ones[n - 10] + ' Belas'
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      
      const hundred = Math.floor(n / 100)
      const rest = n % 100
      return (hundred === 1 ? 'Seratus' : ones[hundred] + ' Ratus') + (rest !== 0 ? ' ' + convertLessThanThousand(rest) : '')
    }

    let result = ''
    let scaleIndex = 0
    
    while (num > 0) {
      const chunk = num % 1000
      if (chunk !== 0) {
        const chunkWords = convertLessThanThousand(chunk)
        if (scaleIndex === 1 && chunk === 1) {
          result = 'Seribu' + (result ? ' ' + result : '')
        } else {
          result = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (result ? ' ' + result : '')
        }
      }
      num = Math.floor(num / 1000)
      scaleIndex++
    }

    return result.trim() + ' Rupiah'
  }

  const downloadInvoicePDF = (invoice) => {
    try {
      const doc = new jsPDF()
      
      // Set font
      doc.setFont('helvetica')
      
      // Header - Company Info
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('KWITANSI PEMBAYARAN', 105, 20, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('ZEO Lighting - Rental Genset', 105, 27, { align: 'center' })
      doc.text('Jakarta, Indonesia', 105, 32, { align: 'center' })
      
      // Line separator
      doc.setLineWidth(0.5)
      doc.line(20, 38, 190, 38)
      
      // Invoice Number
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`No. Kwitansi: ${invoice.invoice_number}`, 20, 48)
      
      // Invoice Details Box
      const startY = 58
      const boxHeight = 80
      
      // Draw box
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(20, startY, 170, boxHeight)
      
      // Content inside box
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Sudah terima dari:', 25, startY + 8)
      doc.setFont('helvetica', 'normal')
      doc.text(invoice.customer_name, 25, startY + 15)
      
      doc.setFont('helvetica', 'bold')
      doc.text('Jumlah:', 25, startY + 25)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Rp ${parseInt(invoice.amount).toLocaleString('id-ID')}`, 25, startY + 32)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Terbilang:', 25, startY + 42)
      doc.setFont('helvetica', 'italic')
      
      // Split terbilang text if too long
      const terbilang = numberToWords(parseInt(invoice.amount))
      const terbilangLines = doc.splitTextToSize(terbilang, 160)
      doc.text(terbilangLines, 25, startY + 49)
      
      const lastTerbilangY = startY + 49 + (terbilangLines.length - 1) * 5
      
      doc.setFont('helvetica', 'bold')
      doc.text('Untuk pembayaran:', 25, lastTerbilangY + 8)
      doc.setFont('helvetica', 'normal')
      doc.text(`${getPaymentTypeLabel(invoice.payment_type)} - PO ${invoice.po_number}`, 25, lastTerbilangY + 15)
      
      if (invoice.notes) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text(`Catatan: ${invoice.notes}`, 25, lastTerbilangY + 22)
      }
      
      // Payment Info
      const infoY = startY + boxHeight + 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Tanggal Pembayaran: ${new Date(invoice.payment_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`, 20, infoY)
      doc.text(`Jenis Pembayaran: ${getPaymentTypeLabel(invoice.payment_type)}`, 20, infoY + 7)
      
      // Signature area
      const signY = infoY + 25
      doc.setFontSize(10)
      doc.text('Hormat kami,', 140, signY)
      
      // Space for signature
      doc.line(135, signY + 25, 180, signY + 25)
      doc.text('Petugas', 150, signY + 30, { align: 'center' })
      
      // Footer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(128)
      doc.text('Kwitansi ini sah tanpa tanda tangan basah.', 105, 280, { align: 'center' })
      doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 285, { align: 'center' })
      
      // Save PDF
      doc.save(`Kwitansi_${invoice.invoice_number}_${invoice.customer_name}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF. Silakan coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kwitansi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola semua kwitansi pembayaran rental ({pagination.total} invoice)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kwitansi</span>
        </button>
      </div>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor kwitansi, PO, atau customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          <button type="submit" className="btn-primary">
            Cari
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSearchInput('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="btn-secondary"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Kwitansi', value: invoices.length, color: 'bg-blue-50 text-blue-600' },
          { 
            label: 'Total Nilai', 
            value: `Rp ${invoices.reduce((sum, inv) => sum + parseInt(inv.amount), 0).toLocaleString('id-ID')}`, 
            color: 'bg-green-50 text-green-600' 
          },
          { 
            label: 'Bulan Ini', 
            value: invoices.filter(inv => {
              const invDate = new Date(inv.payment_date)
              const now = new Date()
              return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
            }).length,
            color: 'bg-purple-50 text-purple-600' 
          }
        ].map((stat, index) => (
          <div key={index} className="card p-6">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${stat.color}`}>
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Kwitansi</th>
                <th>No. PO</th>
                <th>Customer</th>
                <th>Jumlah</th>
                <th>Jenis Bayar</th>
                <th>Tanggal</th>
                <th>Catatan</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-500">
                    {searchTerm ? 'Tidak ada kwitansi yang ditemukan' : 'Belum ada data kwitansi'}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="font-medium text-primary-600">{invoice.invoice_number}</td>
                    <td className="font-medium">{invoice.po_number}</td>
                    <td>{invoice.customer_name}</td>
                    <td className="font-medium text-green-600">
                      Rp {parseInt(invoice.amount).toLocaleString('id-ID')}
                    </td>
                    <td>{getPaymentTypeBadge(invoice.payment_type)}</td>
                    <td>{new Date(invoice.payment_date).toLocaleDateString('id-ID')}</td>
                    <td className="max-w-xs truncate text-sm text-gray-600">
                      {invoice.notes || '-'}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => downloadInvoicePDF(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Buat Kwitansi Baru"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih PO
            </label>
            <select
              name="po_id"
              value={formData.po_id}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">-- Pilih Purchase Order --</option>
              {availablePOs.map(po => (
                <option key={po.id} value={po.id}>
                  {po.po_number} - {po.customer_name} (Rp {parseInt(po.total_cost).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Bayar
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="Masukkan jumlah bayar"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Pembayaran
              </label>
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="dp">DP (Down Payment)</option>
                <option value="installment">Cicilan</option>
                <option value="full">Lunas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pembayaran
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Buat Kwitansi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Invoices