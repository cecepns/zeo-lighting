import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { poAPI } from '../utils/api'
import { ArrowLeft, Download, PencilIcon as Edit, Calendar, User, Phone, MapPin, PencilIcon, Package, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react'

const PODetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [po, setPO] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPO()
  }, [id])

  const fetchPO = async () => {
    try {
      const response = await poAPI.getById(id)
      setPO(response.data)
    } catch (error) {
      console.error('Error fetching PO:', error)
      navigate('/admin/po')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await poAPI.updateStatus(id, newStatus)
      await fetchPO()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengubah status PO')
    }
  }

  const handlePrintInvoice = () => {
    // Create print window
    const printWindow = window.open('', '_blank')
    
    // Calculate rental duration
    const start = new Date(po.rental_start)
    const end = new Date(po.rental_end)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${po.po_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company { font-size: 24px; font-weight: bold; color: #333; }
          .invoice-title { font-size: 20px; margin-top: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .info-item { margin-bottom: 8px; }
          .label { font-weight: bold; display: inline-block; width: 120px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; }
          .cost-summary { float: right; margin-top: 20px; }
          .cost-row { display: flex; justify-content: space-between; margin-bottom: 8px; min-width: 300px; }
          .cost-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 8px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
          .signature-area { text-align: center; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">ZEO LIGHTING</div>
          <div class="invoice-title">INVOICE / PURCHASE ORDER</div>
          <div style="margin-top: 10px; font-size: 14px;">${po.po_number}</div>
        </div>

        <div class="info-grid">
          <div class="section">
            <div class="section-title">Informasi Customer</div>
            <div class="info-item"><span class="label">Nama:</span> ${po.customer_name}</div>
            <div class="info-item"><span class="label">Alamat:</span> ${po.customer_address}</div>
            <div class="info-item"><span class="label">No. KTP:</span> ${po.customer_ktp}</div>
            <div class="info-item"><span class="label">Telepon:</span> ${po.customer_phone}</div>
          </div>

          <div class="section">
            <div class="section-title">Informasi Sewa</div>
            <div class="info-item"><span class="label">Tanggal Mulai:</span> ${new Date(po.rental_start).toLocaleDateString('id-ID')}</div>
            <div class="info-item"><span class="label">Tanggal Selesai:</span> ${new Date(po.rental_end).toLocaleDateString('id-ID')}</div>
            <div class="info-item"><span class="label">Durasi:</span> ${days} hari</div>
            <div class="info-item"><span class="label">Status:</span> ${po.status.toUpperCase()}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detail Item</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Nama Genset</th>
                <th>Merk</th>
                <th>Kapasitas</th>
                <th>Qty</th>
                <th>Tarif/Hari</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.brand || '-'}</td>
                  <td>${item.capacity || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>Rp ${parseInt(item.daily_rate).toLocaleString('id-ID')}</td>
                  <td>Rp ${(item.quantity * item.daily_rate * days).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="cost-summary">
          <div class="cost-row">
            <span>Total Biaya:</span>
            <span>Rp ${parseInt(po.total_cost).toLocaleString('id-ID')}</span>
          </div>
          <div class="cost-row">
            <span>DP Dibayar:</span>
            <span>Rp ${parseInt(po.dp_amount || 0).toLocaleString('id-ID')}</span>
          </div>
          <div class="cost-row cost-total">
            <span>Sisa Bayar:</span>
            <span>Rp ${parseInt(po.remaining_payment || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div style="clear: both;"></div>

        ${po.notes ? `
          <div class="section">
            <div class="section-title">Catatan</div>
            <p>${po.notes}</p>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-area">
            <div style="margin-bottom: 10px; font-weight: bold;">Customer</div>
            ${po.signature_customer ? `<img src="${po.signature_customer}" style="max-height: 60px;">` : ''}
            <div class="signature-line">${po.customer_name}</div>
          </div>
          
          <div class="signature-area">
            <div style="margin-bottom: 10px; font-weight: bold;">Admin</div>
            ${po.signature_admin ? `<img src="${po.signature_admin}" style="max-height: 60px;">` : ''}
            <div class="signature-line">ZEO LIGHTING</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'Di Proses' },
      active: { color: 'bg-green-100 text-green-800', label: 'Aktif' },
      returned: { color: 'bg-purple-100 text-purple-800', label: 'Selesai' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Dibatalkan' }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getStatusActions = () => {
    const actions = []
    
    switch (po.status) {
      case 'draft':
        actions.push(
          <button
            key="process"
            onClick={() => handleStatusChange('processed')}
            className="btn-primary"
          >
            <Clock className="w-4 h-4 mr-2" />
            Proses PO
          </button>
        )
        break
      case 'processed':
        actions.push(
          <button
            key="activate"
            onClick={() => handleStatusChange('active')}
            className="btn-primary bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aktivasi
          </button>
        )
        break
      case 'active':
        actions.push(
          <button
            key="return"
            onClick={() => handleStatusChange('returned')}
            className="btn-primary bg-purple-500 hover:bg-purple-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Selesaikan
          </button>
        )
        break
    }

    return actions
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">PO tidak ditemukan</p>
        <Link to="/admin/po" className="btn-primary mt-4">
          Kembali ke Daftar PO
        </Link>
      </div>
    )
  }

  // Calculate rental duration
  const start = new Date(po.rental_start)
  const end = new Date(po.rental_end)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/po')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{po.po_number}</h1>
            <p className="text-sm text-gray-600">Detail Purchase Order</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusBadge(po.status)}
          <button
            onClick={handlePrintInvoice}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Cetak Invoice</span>
          </button>
        </div>
      </div>

      {/* Status Actions */}
      {getStatusActions().length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Aksi Status</h3>
              <p className="text-sm text-gray-600">Ubah status PO sesuai dengan progress sewa</p>
            </div>
            <div className="flex space-x-3">
              {getStatusActions()}
            </div>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Informasi Customer</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Nama Customer</p>
                <p className="font-medium text-gray-900">{po.customer_name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Alamat</p>
                <p className="font-medium text-gray-900">{po.customer_address}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <PencilIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">No. KTP</p>
                <p className="font-medium text-gray-900">{po.customer_ktp}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">No. Telepon</p>
                <p className="font-medium text-gray-900">{po.customer_phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Periode Sewa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Tanggal Mulai</p>
            <p className="text-lg font-bold text-gray-900">{new Date(po.rental_start).toLocaleDateString('id-ID')}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Tanggal Selesai</p>
            <p className="text-lg font-bold text-gray-900">{new Date(po.rental_end).toLocaleDateString('id-ID')}</p>
          </div>
          
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-600">Total Durasi</p>
            <p className="text-lg font-bold text-primary-900">{days} hari</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Item yang Disewa</h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Genset</th>
                <th>Merk & Kapasitas</th>
                <th>Qty</th>
                <th>Tarif/Hari</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {po.items.map((item, index) => (
                <tr key={index}>
                  <td className="font-medium">{item.item_name}</td>
                  <td>
                    <div className="text-sm">
                      <div>{item.brand || '-'}</div>
                      <div className="text-gray-600">{item.capacity || '-'}</div>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>Rp {parseInt(item.daily_rate).toLocaleString('id-ID')}</td>
                  <td className="font-medium">
                    Rp {(item.quantity * item.daily_rate * days).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Ringkasan Biaya</h3>
        </div>

        <div className="max-w-md ml-auto space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Biaya:</span>
            <span className="font-medium">Rp {parseInt(po.total_cost).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DP Dibayar:</span>
            <span>Rp {parseInt(po.dp_amount || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Sisa Bayar:</span>
            <span className="text-red-600">Rp {parseInt(po.remaining_payment || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Catatan</h3>
          </div>
          <p className="text-gray-700">{po.notes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tanda Tangan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <p className="font-medium text-gray-900 mb-4">Customer</p>
            {po.signature_customer ? (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img 
                  src={po.signature_customer} 
                  alt="Customer Signature" 
                  className="max-h-24 mx-auto"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500">
                Belum ada tanda tangan
              </div>
            )}
            <p className="mt-2 text-sm font-medium text-gray-700">{po.customer_name}</p>
          </div>

          <div className="text-center">
            <p className="font-medium text-gray-900 mb-4">Admin</p>
            {po.signature_admin ? (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img 
                  src={po.signature_admin} 
                  alt="Admin Signature" 
                  className="max-h-24 mx-auto"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500">
                Belum ada tanda tangan
              </div>
            )}
            <p className="mt-2 text-sm font-medium text-gray-700">ZEO LIGHTING</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PODetail