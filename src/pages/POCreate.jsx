import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { customersAPI, itemsAPI, poAPI } from '../utils/api'
import Modal from '../components/Modal'
import SignatureCanvas from '../components/SignatureCanvas'
import CustomerSelect from '../components/CustomerSelect'
import { Plus, Minus, Save, Users, Package, Calendar, DollarSign, FileText, Ligature as Signature } from 'lucide-react'

const POCreate = () => {
  const navigate = useNavigate()
  const customerSigRef = useRef()
  const adminSigRef = useRef()
  
  const [customers, setCustomers] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [currentSignature, setCurrentSignature] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    customer_id: '',
    rental_start: '',
    rental_end: '',
    dp_amount: '',
    signature_customer: '',
    signature_admin: '',
    notes: '',
    items: []
  })

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    address: '',
    ktp_number: '',
    phone: ''
  })

  useEffect(() => {
    fetchCustomers()
    fetchAvailableItems()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll()
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchAvailableItems = async () => {
    try {
      const response = await itemsAPI.getAvailable()
      setAvailableItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', quantity: '', daily_rate: '' }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: value,
              // Auto-update daily_rate when item is selected
              ...(field === 'item_id' && value ? {
                daily_rate: availableItems.find(ai => ai.id == value)?.daily_rate || ''
              } : {})
            }
          : item
      )
    }))
  }

  const calculateTotal = () => {
    if (!formData.rental_start || !formData.rental_end) return 0
    
    const start = new Date(formData.rental_start)
    const end = new Date(formData.rental_end)
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
    
    return formData.items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0
      const dailyRate = parseInt(item.daily_rate) || 0
      return total + (quantity * dailyRate * days)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      alert('Minimal harus ada 1 item yang disewa')
      return
    }

    setLoading(true)
    
    try {
      // Convert empty strings to numbers before submit
      const submitData = {
        ...formData,
        dp_amount: parseInt(formData.dp_amount) || 0,
        items: formData.items
          .filter(item => item.item_id)
          .map(item => ({
            ...item,
            quantity: parseInt(item.quantity) || 1,
            daily_rate: parseInt(item.daily_rate) || 0
          }))
      }
      
      const response = await poAPI.create(submitData)
      
      navigate(`/admin/po/${response.data.id}`)
    } catch (error) {
      console.error('Error creating PO:', error)
      alert('Gagal membuat PO')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (e) => {
    e.preventDefault()
    
    try {
      const response = await customersAPI.create(newCustomer)
      await fetchCustomers()
      setFormData(prev => ({ ...prev, customer_id: response.data.id }))
      setCustomerModalOpen(false)
      setNewCustomer({ name: '', address: '', ktp_number: '', phone: '' })
    } catch (error) {
      console.error('Error creating customer:', error)
      alert(error.response?.data?.message || 'Gagal membuat customer')
    }
  }

  const handleSignatureSave = () => {
    const signatureData = currentSignature === 'customer' 
      ? customerSigRef.current?.getSignatureData()
      : adminSigRef.current?.getSignatureData()
    
    if (signatureData) {
      setFormData(prev => ({
        ...prev,
        [currentSignature === 'customer' ? 'signature_customer' : 'signature_admin']: signatureData
      }))
    }
    
    setSignatureModalOpen(false)
    setCurrentSignature('')
  }

  const openSignatureModal = (type) => {
    setCurrentSignature(type)
    setSignatureModalOpen(true)
  }

  const totalCost = calculateTotal()
  const remainingPayment = Math.max(0, totalCost - (parseInt(formData.dp_amount) || 0))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Purchase Order Baru</h1>
        <p className="mt-1 text-sm text-gray-600">
          Buat PO baru untuk rental genset
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Informasi Customer</h3>
            </div>
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="text-sm btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Customer Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Customer *
              </label>
              <CustomerSelect
                value={formData.customer_id}
                onChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              />
              {!formData.customer_id && (
                <p className="mt-1 text-sm text-gray-500">
                  Ketik untuk mencari customer berdasarkan nama atau telepon
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Periode Sewa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={formData.rental_start}
                onChange={(e) => setFormData(prev => ({ ...prev, rental_start: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={formData.rental_end}
                onChange={(e) => setFormData(prev => ({ ...prev, rental_end: e.target.value }))}
                className="input-field"
                required
                min={formData.rental_start}
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Item yang Disewa</h3>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="text-sm btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-5">
                  <select
                    value={item.item_id}
                    onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">-- Pilih Genset --</option>
                    {availableItems.map(availableItem => (
                      <option key={availableItem.id} value={availableItem.id}>
                        {availableItem.name} - {availableItem.brand} ({availableItem.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value)
                      updateItem(index, 'quantity', value)
                    }}
                    className="input-field"
                    min="1"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <input
                    type="number"
                    placeholder="Tarif/hari"
                    value={item.daily_rate}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value)
                      updateItem(index, 'daily_rate', value)
                    }}
                    className="input-field"
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {formData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada item yang dipilih. Klik "Tambah Item" untuk menambah.
              </div>
            )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Down Payment (DP)
              </label>
              <input
                type="number"
                value={formData.dp_amount}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value)
                  setFormData(prev => ({ ...prev, dp_amount: value }))
                }}
                className="input-field"
                min="0"
                max={totalCost}
                placeholder="0"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Biaya:</span>
                <span className="font-medium">Rp {totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DP:</span>
                <span>Rp {(formData.dp_amount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Kekurangan:</span>
                <span className="text-red-600">Rp {remainingPayment.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Signature className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tanda Tangan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanda Tangan Customer
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {formData.signature_customer ? (
                  <div>
                    <img 
                      src={formData.signature_customer} 
                      alt="Customer Signature" 
                      className="max-h-20 mx-auto mb-2" 
                    />
                    <button
                      type="button"
                      onClick={() => openSignatureModal('customer')}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Ubah Tanda Tangan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openSignatureModal('customer')}
                    className="text-sm text-gray-600 hover:text-primary-600"
                  >
                    Klik untuk menambah tanda tangan customer
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanda Tangan Admin
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {formData.signature_admin ? (
                  <div>
                    <img 
                      src={formData.signature_admin} 
                      alt="Admin Signature" 
                      className="max-h-20 mx-auto mb-2" 
                    />
                    <button
                      type="button"
                      onClick={() => openSignatureModal('admin')}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Ubah Tanda Tangan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openSignatureModal('admin')}
                    className="text-sm text-gray-600 hover:text-primary-600"
                  >
                    Klik untuk menambah tanda tangan admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Catatan</h3>
          </div>

          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="4"
            className="input-field"
            placeholder="Catatan tambahan (opsional)..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/po')}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan PO'}</span>
          </button>
        </div>
      </form>

      {/* Customer Modal */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Tambah Customer Baru"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Customer
            </label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="Masukkan nama customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat
            </label>
            <textarea
              required
              value={newCustomer.address}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
              rows="3"
              className="input-field"
              placeholder="Masukkan alamat lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. KTP
            </label>
            <input
              type="text"
              required
              value={newCustomer.ktp_number}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, ktp_number: e.target.value }))}
              className="input-field"
              placeholder="Masukkan nomor KTP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telepon
            </label>
            <input
              type="text"
              required
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setCustomerModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Signature Modal */}
      <Modal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        title={`Tanda Tangan ${currentSignature === 'customer' ? 'Customer' : 'Admin'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg">
            <SignatureCanvas
              ref={currentSignature === 'customer' ? customerSigRef : adminSigRef}
              width={500}
              height={200}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                if (currentSignature === 'customer') {
                  customerSigRef.current?.clear()
                } else {
                  adminSigRef.current?.clear()
                }
              }}
              className="btn-secondary"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={handleSignatureSave}
              className="btn-primary"
            >
              Simpan Tanda Tangan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default POCreate