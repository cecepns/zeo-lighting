import React, { useState, useEffect } from 'react'
import { itemsAPI } from '../utils/api'
import Modal from '../components/Modal'
import { Plus, PencilIcon as Edit, Trash2, Package, Zap, Fuel, DollarSign, Search } from 'lucide-react'

const Items = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    capacity: '',
    fuel_type: 'solar',
    daily_rate: '',
    status: 'available',
    description: ''
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll()
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingItem) {
        await itemsAPI.update(editingItem.id, formData)
      } else {
        await itemsAPI.create(formData)
      }
      
      await fetchItems()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Gagal menyimpan data item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      brand: item.brand || '',
      capacity: item.capacity || '',
      fuel_type: item.fuel_type,
      daily_rate: item.daily_rate,
      status: item.status,
      description: item.description || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      try {
        await itemsAPI.delete(id)
        await fetchItems()
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Gagal menghapus item')
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingItem(null)
    setFormData({
      name: '',
      brand: '',
      capacity: '',
      fuel_type: 'solar',
      daily_rate: '',
      status: 'available',
      description: ''
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { color: 'bg-green-100 text-green-800', label: 'Tersedia' },
      rented: { color: 'bg-yellow-100 text-yellow-800', label: 'Disewa' },
      maintenance: { color: 'bg-red-100 text-red-800', label: 'Maintenance' }
    }
    
    const config = statusConfig[status] || statusConfig.available
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.capacity && item.capacity.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Data Genset</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola data item genset untuk disewakan
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Genset</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari genset berdasarkan nama, merk, atau kapasitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto min-w-[150px]"
          >
            <option value="all">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="rented">Disewa</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full">
            <div className="card p-12 text-center">
              <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' ? 'Tidak ada genset yang ditemukan' : 'Belum ada data genset'}
              </p>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.brand && (
                      <p className="text-sm text-gray-600">{item.brand}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="space-y-2 mb-4">
                {item.capacity && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>Kapasitas: {item.capacity}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Fuel className="w-4 h-4" />
                  <span>Bahan Bakar: {item.fuel_type}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm font-medium text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Rp {parseInt(item.daily_rate).toLocaleString('id-ID')}/hari</span>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(item)}
                  className="items-center flex btn-primary text-sm py-2"
                >
                  <Edit className="w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Hapus Genset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Genset' : 'Tambah Genset Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Genset
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Contoh: Genset 5KVA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merk
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="input-field"
                placeholder="Contoh: Honda, Yamaha"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas
              </label>
              <input
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="input-field"
                placeholder="Contoh: 5KVA, 10KVA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Bahan Bakar
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="solar">Solar</option>
                <option value="bensin">Bensin</option>
                <option value="gas">Gas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarif Harian (Rp)
              </label>
              <input
                type="number"
                name="daily_rate"
                required
                value={formData.daily_rate}
                onChange={handleChange}
                className="input-field"
                placeholder="Contoh: 150000"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="available">Tersedia</option>
                <option value="rented">Disewa</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Deskripsi tambahan tentang genset..."
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
              {editingItem ? 'Simpan Perubahan' : 'Tambah Genset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Items