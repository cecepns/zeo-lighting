import React, { useState } from 'react'
import AsyncSelect from 'react-select/async'
import axios from 'axios'

const CustomerSelect = ({ value, onChange, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false)

  const loadOptions = async (inputValue) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('https://api-inventory.isavralabel.com/zero-lighting/api/customers', {
        params: {
          search: inputValue,
          page: 1,
          limit: 20
        },
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const options = response.data.data.map(customer => ({
        value: customer.id,
        label: `${customer.name} - ${customer.phone}`,
        customer: customer
      }))
      
      return options
    } catch (error) {
      console.error('Error loading customers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const loadDefaultOptions = async () => {
    return loadOptions('')
  }

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#16a34a' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #16a34a' : 'none',
      '&:hover': {
        borderColor: '#16a34a'
      },
      minHeight: '42px',
      borderRadius: '0.5rem'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#16a34a' 
        : state.isFocused 
        ? '#dcfce7' 
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:active': {
        backgroundColor: '#16a34a'
      }
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af'
    }),
    loadingMessage: (provided) => ({
      ...provided,
      color: '#6b7280'
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#6b7280'
    })
  }

  const selectedValue = value 
    ? { value: value, label: 'Loading...' } 
    : null

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      onChange={(option) => onChange(option?.value || '')}
      value={selectedValue}
      placeholder="Ketik untuk mencari customer..."
      noOptionsMessage={({ inputValue }) => 
        inputValue ? 'Customer tidak ditemukan' : 'Mulai ketik untuk mencari'
      }
      loadingMessage={() => 'Mencari customer...'}
      styles={customStyles}
      isClearable
      className={className}
    />
  )
}

export default CustomerSelect
