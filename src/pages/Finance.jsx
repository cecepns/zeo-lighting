import React, { useState, useEffect } from 'react'
import { financeAPI } from '../utils/api'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  Search
} from 'lucide-react'

const Finance = () => {
  const [transactions, setTransactions] = useState([])
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
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    type: 'all'
  })
  const [formData, setFormData] = useState({
    transaction_type: 'income',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchTransactions()
  }, [pagination.page, searchTerm, filters])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await financeAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      })
      setTransactions(response.data.data)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      console.error('Error fetching transactions:', error)
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

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await financeAPI.create({
        ...formData,
        amount: parseInt(formData.amount)
      })
      
      await fetchTransactions()
      handleCloseModal()
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Gagal menambah transaksi')
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setFormData({
      transaction_type: 'income',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }


  const calculateSummary = () => {
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseInt(t.amount), 0)
    
    const expense = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseInt(t.amount), 0)
    
    return {
      income,
      expense,
      balance: income - expense
    }
  }

  const summary = calculateSummary()

  const getTransactionIcon = (type) => {
    return type === 'income' 
      ? <TrendingUp className="w-5 h-5 text-green-600" />
      : <TrendingDown className="w-5 h-5 text-red-600" />
  }

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Jenis', 'Jumlah', 'Deskripsi']
    const csvData = [
      headers,
      ...transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString('id-ID'),
        t.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.amount,
        t.description
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-keuangan-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-bold text-gray-900">Keuangan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kelola pencatatan keuangan dan transaksi ({pagination.total} transaksi)
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-900">
                Rp {summary.income.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-900">
                Rp {summary.expense.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className={`card p-6 ${summary.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                Saldo Akhir
              </p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                Rp {summary.balance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`w-6 h-6 ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan deskripsi transaksi..."
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Selesai
            </label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Transaksi
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={(e) => handleFilterChange(e.target.name, e.target.value)}
              className="input-field"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setFilters({ start_date: '', end_date: '', type: 'all' })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Transaksi</h3>
          <p className="text-sm text-gray-600">
            {transactions.length} transaksi ditemukan
          </p>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Jumlah</th>
                <th>Deskripsi</th>
                <th>Referensi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    Belum ada data transaksi
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td>{new Date(transaction.transaction_date).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <span className={`font-medium ${
                          transaction.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transaction.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </div>
                    </td>
                    <td className={`font-medium ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'} 
                      Rp {parseInt(transaction.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="max-w-xs truncate">{transaction.description}</td>
                    <td className="text-sm text-gray-600">
                      {transaction.reference_type ? (
                        <span className="capitalize">{transaction.reference_type}</span>
                      ) : '-'}
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

      {/* Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Tambah Transaksi"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Transaksi
            </label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input-field"
              placeholder="Masukkan jumlah"
              min="0"
              required
            />
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
              placeholder="Deskripsi transaksi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              className="input-field"
              required
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
              Simpan Transaksi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Finance