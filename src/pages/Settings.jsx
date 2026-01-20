import React, { useState, useEffect } from 'react'
import { Save, Settings as SettingsIcon, AlertCircle, CheckCircle, Upload, Image as ImageIcon, X } from 'lucide-react'
import axios from 'axios'

const Settings = () => {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({})
  const [heroImage, setHeroImage] = useState(null)
  const [heroImagePreview, setHeroImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('https://api-inventory.isavralabel.com/zero-lighting/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(res.data)
      
      // Initialize form data
      const initialData = {}
      res.data.forEach(setting => {
        initialData[setting.setting_key] = setting.setting_value || ''
      })
      setFormData(initialData)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    setFormData({
      ...formData,
      [key]: value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' })
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' })
        return
      }

      setHeroImage(file)
      setHeroImagePreview(URL.createObjectURL(file))
    }
  }

  const handleImageUpload = async () => {
    if (!heroImage) return

    setUploadingImage(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('image', heroImage)

      const response = await axios.post(
        'https://api-inventory.isavralabel.com/zero-lighting/api/settings/hero-image/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setMessage({ type: 'success', text: 'Hero image uploaded successfully!' })
      setHeroImage(null)
      setHeroImagePreview(null)
      
      // Refresh settings to get the updated hero_image value
      await fetchSettings()
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: 'Failed to upload hero image' })
    } finally {
      setUploadingImage(false)
    }
  }

  const clearImagePreview = () => {
    setHeroImage(null)
    setHeroImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('token')
      
      // Update each setting
      const updatePromises = Object.keys(formData).map(key => 
        axios.put(
          `https://api-inventory.isavralabel.com/zero-lighting/api/settings/${key}`,
          { setting_value: formData[key] },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )

      await Promise.all(updatePromises)
      
      setMessage({ type: 'success', text: 'Settings updated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const renderField = (setting) => {
    const value = formData[setting.setting_key] || ''
    
    // Special handling for hero_image
    if (setting.setting_key === 'hero_image') {
      return (
        <div className="space-y-4">
          {/* Current Image */}
          {value && !heroImagePreview && (
            <div className="relative">
              <p className="text-sm text-gray-600 mb-2">Current Hero Image:</p>
              <img 
                src={`https://api-inventory.isavralabel.com/zero-lighting${value}`}
                alt="Current hero"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}

          {/* Image Preview */}
          {heroImagePreview && (
            <div className="relative">
              <p className="text-sm text-gray-600 mb-2">New Image Preview:</p>
              <div className="relative inline-block">
                <img 
                  src={heroImagePreview}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={clearImagePreview}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex gap-3">
            <label className="flex-1">
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 cursor-pointer transition-colors">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Choose Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            
            {heroImage && (
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploadingImage}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Recommended: 1200x600px, Max 5MB (JPEG, PNG, GIF, WebP)
          </p>
        </div>
      )
    }
    
    switch (setting.setting_type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        )
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        )
      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        )
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        )
    }
  }

  const settingsGroups = {
    'Company Information': ['company_name', 'company_address', 'company_phone', 'company_mobile', 'company_email'],
    'Business Details': ['business_hours', 'google_maps_embed'],
    'Landing Page Content': ['hero_title', 'hero_subtitle', 'about_us', 'hero_image']
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        </div>
        <p className="text-gray-600">Kelola pengaturan website dan informasi perusahaan</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {Object.entries(settingsGroups).map(([groupName, keys]) => (
            <div key={groupName} className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                {groupName}
              </h2>
              <div className="space-y-6">
                {settings
                  .filter(setting => keys.includes(setting.setting_key))
                  .map(setting => (
                    <div key={setting.setting_key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {setting.description || setting.setting_key}
                      </label>
                      {renderField(setting)}
                      {setting.setting_key === 'google_maps_embed' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dapatkan embed URL dari Google Maps (Share → Embed a map)
                        </p>
                      )}
                      {setting.setting_key === 'features' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Pisahkan setiap fitur dengan karakter | (pipe)
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Other Settings */}
          {settings.filter(s => !Object.values(settingsGroups).flat().includes(s.setting_key)).length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Other Settings
              </h2>
              <div className="space-y-6">
                {settings
                  .filter(setting => !Object.values(settingsGroups).flat().includes(setting.setting_key))
                  .map(setting => (
                    <div key={setting.setting_key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {setting.description || setting.setting_key}
                      </label>
                      {renderField(setting)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 mt-8 -mx-6 px-6">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preview Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Preview Information</h3>
        <p className="text-sm text-blue-800 mb-4">
          Perubahan pengaturan akan langsung terlihat di landing page setelah disimpan.
        </p>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Company Name:</p>
            <p className="text-gray-900">{formData.company_name || '-'}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Phone:</p>
            <p className="text-gray-900">{formData.company_phone || '-'}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Email:</p>
            <p className="text-gray-900">{formData.company_email || '-'}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Mobile:</p>
            <p className="text-gray-900">{formData.company_mobile || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
