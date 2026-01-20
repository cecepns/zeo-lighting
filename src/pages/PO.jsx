import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { poAPI } from '../utils/api'
import Pagination from '../components/Pagination'
import { 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react'

const PO = () => {
  const [pos, setPOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchPOs()
  }, [pagination.page, searchTerm, filterStatus])

  const fetchPOs = async () => {
    setLoading(true)
    try {
      const response = await poAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: filterStatus === 'all' ? '' : filterStatus
      })
      setPOs(response.data.data)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      console.error('Error fetching POs:', error)
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

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await poAPI.updateStatus(id, newStatus)
      await fetchPOs()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengubah status PO')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { 
        color: 'bg-gray-100 text-gray-800', 
        label: 'Draft',
        icon: Clock 
      },
      processed: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Di Proses',
        icon: Clock 
      },
      active: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Aktif',
        icon: CheckCircle 
      },
      returned: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Selesai',
        icon: CheckCircle 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Dibatalkan',
        icon: XCircle 
      }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getStatusActions = (po) => {
    const actions = []
    
    switch (po.status) {
      case 'draft':
        actions.push(
          <button
            key="process"
            onClick={() => handleStatusChange(po.id, 'processed')}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200"
          >
            Proses
          </button>
        )
        break
      case 'processed':
        actions.push(
          <button
            key="activate"
            onClick={() => handleStatusChange(po.id, 'active')}
            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200"
          >
            Aktivasi
          </button>
        )
        break
      case 'active':
        actions.push(
          <button
            key="return"
            onClick={() => handleStatusChange(po.id, 'returned')}
            className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
          >
            Selesai
          </button>
        )
        break
    }

    if (po.status !== 'returned' && po.status !== 'cancelled') {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleStatusChange(po.id, 'cancelled')}
          className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200"
        >
          Batalkan
        </button>
      )
    }

    return actions
  }

  const isOverdue = (po) => {
    if (po.status !== 'active') return false
    const today = new Date()
    const endDate = new Date(po.rental_end)
    return today > endDate
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola semua purchase order rental genset ({pagination.total} PO)
          </p>
        </div>
        <Link
          to="/admin/po/create"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buat PO Baru</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="card p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor PO, customer, atau telepon..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">
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
              className="btn-secondary whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </form>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="input-field w-auto min-w-[150px]"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="processed">Di Proses</option>
              <option value="active">Aktif</option>
              <option value="returned">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
          {['draft', 'processed', 'active', 'returned', 'cancelled'].map(status => {
            const count = pos.filter(po => po.status === status).length
            return (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{
                  status === 'draft' ? 'Draft' :
                  status === 'processed' ? 'Di Proses' :
                  status === 'active' ? 'Aktif' :
                  status === 'returned' ? 'Selesai' :
                  'Dibatalkan'
                }</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PO Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. PO</th>
                <th>Customer</th>
                <th>Periode Sewa</th>
                <th>Total Biaya</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    {searchTerm || filterStatus !== 'all' ? 'Tidak ada PO yang ditemukan' : 'Belum ada data PO'}
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.id} className={`hover:bg-gray-50 ${isOverdue(po) ? 'bg-red-50' : ''}`}>
                    <td>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-primary-600">{po.po_number}</span>
                        {isOverdue(po) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" title="Jatuh Tempo" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{po.customer_name}</div>
                        <div className="text-sm text-gray-600">{po.customer_phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{new Date(po.rental_start).toLocaleDateString('id-ID')}</div>
                        <div className="text-gray-600">s/d {new Date(po.rental_end).toLocaleDateString('id-ID')}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">Rp {parseInt(po.total_cost).toLocaleString('id-ID')}</div>
                        {po.dp_amount > 0 && (
                          <div className="text-sm text-gray-600">
                            DP: Rp {parseInt(po.dp_amount).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(po.status)}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/po/${po.id}`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center space-x-1">
                          {getStatusActions(po)}
                        </div>
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
    </div>
  )
}

export default PO