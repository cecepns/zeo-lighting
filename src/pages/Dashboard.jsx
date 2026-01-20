import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../utils/api'
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Di Proses',
      value: stats.processed || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      link: '/po?status=processed'
    },
    {
      title: 'Jatuh Tempo',
      value: stats.dueSoon || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      link: '/po?status=due'
    },
    {
      title: 'Selesai',
      value: stats.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      link: '/po?status=completed'
    },
    {
      title: 'Saldo',
      value: `Rp ${(stats.balance || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: stats.balance >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.balance >= 0 ? 'bg-green-50' : 'bg-red-50',
      borderColor: stats.balance >= 0 ? 'border-green-200' : 'border-red-200',
      link: '/finance'
    }
  ]

  const quickActions = [
    {
      title: 'Buat PO Baru',
      description: 'Tambah purchase order baru',
      link: '/po',
      icon: FileText,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Kelola Customer',
      description: 'Tambah atau edit data customer',
      link: '/customers',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Kelola Genset',
      description: 'Tambah atau edit item genset',
      link: '/items',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Laporan Keuangan',
      description: 'Lihat laporan dan analisis',
      link: '/reports',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview status transaksi dan statistik rental genset
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              to={stat.link}
              className={`card p-6 hover:shadow-lg transition-shadow duration-200 ${stat.bgColor} ${stat.borderColor} border`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Keuangan</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Pemasukan</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                Rp {(stats.totalIncome || 0).toLocaleString('id-ID')}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Pengeluaran</span>
              </div>
              <span className="text-lg font-bold text-red-600">
                Rp {(stats.totalExpense || 0).toLocaleString('id-ID')}
              </span>
            </div>
            
            <hr className="my-4" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Saldo Akhir</span>
              <span className={`text-xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rp {(stats.balance || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  to={action.link}
                  className={`p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-300 ${action.bgColor} hover:shadow-md transition-all duration-200`}
                >
                  <div className={`p-2 rounded-lg ${action.bgColor} w-fit mb-3`}>
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard