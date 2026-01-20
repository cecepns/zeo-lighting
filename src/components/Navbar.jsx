import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from '../assets/logo.jpeg'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/">
              <img 
                src={Logo} 
                alt="Logo" 
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Home
            </Link>
            {/* <a 
              href="/#products" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Products
            </a> */}
            {/* <a 
              href="/#about" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              About
            </a> */}
            <Link 
              to="/contact" 
              className={`font-medium transition-colors ${
                isActive('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Contact
            </Link>
            {/* <Link 
              to="/login" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Admin Login
            </Link> */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`font-medium ${
                  isActive('/') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {/* <a 
                href="/#products" 
                className="text-gray-700 hover:text-green-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </a>
              <a 
                href="/#about" 
                className="text-gray-700 hover:text-green-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a> */}
              <Link 
                to="/contact" 
                className={`font-medium ${
                  isActive('/contact') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              {/* <Link 
                to="/login" 
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </Link> */}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
