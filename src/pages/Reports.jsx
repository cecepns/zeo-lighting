import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../utils/api'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Download,
  FileText
} from 'lucide-react'

const Reports = () => {
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [dateRange])

  const fetchSummary = async () => {
    try {
      const response = await reportsAPI.getSummary(dateRange)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (e) => {
    setDateRange(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const generateReport = () => {
    const reportData = {
      periode: dateRange.start_date && dateRange.end_date 
        ? `${new Date(dateRange.start_date).toLocaleDateString('id-ID')} - ${new Date(dateRange.end_date).toLocaleDateString('id-ID')}`
        : 'Semua Periode',
      tanggalGenerate: new Date().toLocaleString('id-ID'),
      ...summary
    }

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan - Genset Rental</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company { font-size: 24px; font-weight: bold; color: #333; }
          .report-title { font-size: 20px; margin: 10px 0; }
          .periode { font-size: 14px; color: #666; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .summary-card h3 { margin-top: 0; color: #333; font-size: 16px; }
          .summary-card .amount { font-size: 24px; font-weight: bold; }
          .income { border-left: 4px solid #10b981; }
          .expense { border-left: 4px solid #ef4444; }
          .balance { border-left: 4px solid #3b82f6; }
          .po-stats { border-left: 4px solid #8b5cf6; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">GENSET RENTAL</div>
          <div class="report-title">LAPORAN KEUANGAN</div>
          <div class="periode">Periode: ${reportData.periode}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card income">
            <h3>Total Pemasukan</h3>
            <div class="amount" style="color: #10b981;">Rp ${(reportData.totalIncome || 0).toLocaleString('id-ID')}</div>
          </div>
          
          <div class="summary-card expense">
            <h3>Total Pengeluaran</h3>
            <div class="amount" style="color: #ef4444;">Rp ${(reportData.totalExpense || 0).toLocaleString('id-ID')}</div>
          </div>
          
          <div class="summary-card balance">
            <h3>Saldo Bersih</h3>
            <div class="amount" style="color: ${(reportData.balance || 0) >= 0 ? '#10b981' : '#ef4444'};">
              Rp ${(reportData.balance || 0).toLocaleString('id-ID')}
            </div>
          </div>
          
          <div class="summary-card po-stats">
            <h3>Statistik PO</h3>
            <div>Total PO: ${reportData.totalPO || 0}</div>
            <div>PO Aktif: ${reportData.activePO || 0}</div>
          </div>
        </div>

        <div class="footer">
          <p>Laporan dibuat pada: ${reportData.tanggalGenerate}</p>
          <p>Genset Rental Management System</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(reportHTML)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const quickDateRanges = [
    { label: 'Hari Ini', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { 
      label: 'Bulan Ini', 
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    { 
      label: 'Bulan Lalu',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    },
    { 
      label: 'Tahun Ini',
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Laporan keuangan dan analisis bisnis
          </p>
        </div>
        <button
          onClick={generateReport}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Cetak Laporan</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="start_date"
              value={dateRange.start_date}
              onChange={handleDateChange}
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
              value={dateRange.end_date}
              onChange={handleDateChange}
              className="input-field"
            />
          </div>

          <div>
            <button
              onClick={() => setDateRange({ start_date: '', end_date: '' })}
              className="btn-secondary w-full"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
          <div className="flex flex-wrap gap-2">
            {quickDateRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => setDateRange({ start_date: range.start, end_date: range.end })}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-700">
                Rp {(summary.totalIncome || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-700">
                Rp {(summary.totalExpense || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className={`card p-6 border-l-4 ${(summary.balance || 0) >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${(summary.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                Saldo Bersih
              </p>
              <p className={`text-2xl font-bold ${(summary.balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                Rp {(summary.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(summary.balance || 0) >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`w-6 h-6 ${(summary.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total PO</p>
              <p className="text-2xl font-bold text-purple-700">{summary.totalPO || 0}</p>
              <p className="text-sm text-gray-600">Aktif: {summary.activePO || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Analisis Kinerja</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Profit Margin</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-medium">Rp {(summary.totalIncome || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-medium">Rp {(summary.totalExpense || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-medium text-gray-900">Profit:</span>
                <span className={`font-bold ${(summary.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {(summary.balance || 0).toLocaleString('id-ID')}
                </span>
              </div>
              {summary.totalIncome > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Margin:</span>
                  <span className={`font-medium ${((summary.balance || 0) / summary.totalIncome * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((summary.balance || 0) / summary.totalIncome * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Status PO</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total PO:</span>
                <span className="font-medium">{summary.totalPO || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">PO Aktif:</span>
                <span className="font-medium">{summary.activePO || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">PO Selesai:</span>
                <span className="font-medium">{(summary.totalPO || 0) - (summary.activePO || 0)}</span>
              </div>
              {summary.totalPO > 0 && (
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium text-blue-600">
                    {(((summary.totalPO || 0) - (summary.activePO || 0)) / summary.totalPO * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Information */}
      <div className="card p-6 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div>
            <h4 className="font-medium text-gray-900">Informasi Laporan</h4>
            <p className="text-sm text-gray-600">
              Periode: {
                dateRange.start_date && dateRange.end_date 
                  ? `${new Date(dateRange.start_date).toLocaleDateString('id-ID')} - ${new Date(dateRange.end_date).toLocaleDateString('id-ID')}`
                  : 'Semua Periode'
              }
            </p>
            <p className="text-sm text-gray-600">
              Dibuat pada: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports