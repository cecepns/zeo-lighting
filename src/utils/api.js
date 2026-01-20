import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data)
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
}

export const customersAPI = {
  getAll: (params = {}) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
}

export const itemsAPI = {
  getAll: () => api.get('/items'),
  getAvailable: () => api.get('/items/available'),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
}

export const poAPI = {
  getAll: (params = {}) => api.get('/po', { params }),
  getById: (id) => api.get(`/po/${id}`),
  create: (data) => api.post('/po', data),
  updateStatus: (id, status) => api.put(`/po/${id}/status`, { status })
}

export const invoicesAPI = {
  getAll: (params = {}) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data)
}

export const financeAPI = {
  getAll: (params = {}) => api.get('/finance', { params }),
  create: (data) => api.post('/finance', data)
}

export const reportsAPI = {
  getSummary: (params = {}) => api.get('/reports/summary', { params })
}