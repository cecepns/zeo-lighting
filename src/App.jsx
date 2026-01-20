import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Items from './pages/Items'
import Products from './pages/Products'
import Settings from './pages/Settings'
import PO from './pages/PO'
import POCreate from './pages/POCreate'
import PODetail from './pages/PODetail'
import Invoices from './pages/Invoices'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import LandingPage from './pages/LandingPage'
import ContactPage from './pages/ContactPage'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="items" element={<Items />} />
            <Route path="products" element={<Products />} />
            <Route path="settings" element={<Settings />} />
            <Route path="po" element={<PO />} />
            <Route path="po/create" element={<POCreate />} />
            <Route path="po/:id" element={<PODetail />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="finance" element={<Finance />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Legacy routes redirect to admin */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
          <Route path="/items" element={<Navigate to="/admin/items" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App