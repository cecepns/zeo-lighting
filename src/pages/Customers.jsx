import React, { useState, useEffect } from 'react'
import { customersAPI } from '../utils/api'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, PencilIcon as Edit, Trash2, Phone, PencilIcon, Search } from 'lucide-react'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    ktp_number: '',
    phone: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, searchTerm])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await customersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      })
      setCustomers(response.data.data)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
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
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData)
      } else {
        await customersAPI.create(formData)
      }
      
      await fetchCustomers()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving customer:', error)
      alert(error.response?.data?.message || 'Gagal menyimpan data customer')
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      address: customer.address,
      ktp_number: customer.ktp_number,
      phone: customer.phone
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      try {
        await customersAPI.delete(id)
        await fetchCustomers()
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Gagal menghapus customer')
      }
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingCustomer(null)
    setFormData({
      name: '',
      address: '',
      ktp_number: '',
      phone: ''
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
          <h1 className="text-2xl font-bold text-gray-900">Data Customer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola data customer untuk rental genset ({pagination.total} customer)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari customer berdasarkan nama, KTP, atau telepon..."
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

      {/* Customer Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Customer</th>
                <th>Alamat</th>
                <th>No. KTP</th>
                <th>Telepon</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    {searchTerm ? 'Tidak ada customer yang ditemukan' : 'Belum ada data customer'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="font-medium">{customer.name}</td>
                    <td className="max-w-xs truncate">{customer.address}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <PencilIcon className="w-4 h-4 text-gray-400" />
                        <span>{customer.ktp_number}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Hapus Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Customer
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Masukkan nama customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat
            </label>
            <textarea
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
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
              name="ktp_number"
              required
              value={formData.ktp_number}
              onChange={handleChange}
              className="input-field"
              placeholder="Masukkan nomor KTP"
              maxLength="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telepon
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Masukkan nomor telepon"
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
              {editingCustomer ? 'Simpan Perubahan' : 'Tambah Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Customers