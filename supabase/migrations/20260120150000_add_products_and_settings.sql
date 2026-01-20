-- Migration: Add products and site_settings tables
-- Date: 2026-01-20

USE genset_rental;

-- Tabel products (untuk landing page - produk genset yang ditampilkan)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(50),
  capacity VARCHAR(20),
  power_output VARCHAR(50),
  fuel_type ENUM('solar', 'bensin', 'gas') DEFAULT 'solar',
  daily_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  features TEXT,
  image VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_display_order (display_order)
);

-- Tabel site_settings (untuk konfigurasi website)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('text', 'textarea', 'number', 'url', 'email', 'phone') DEFAULT 'text',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
);

-- Tabel contact_submissions (untuk menyimpan pesan dari contact form)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'ZEO Lighting - Rental Genset', 'text', 'Nama perusahaan'),
('company_address', 'Jl. Sudirman No. 123, Jakarta Pusat 10220', 'textarea', 'Alamat perusahaan'),
('company_phone', '021-12345678', 'phone', 'Nomor telepon perusahaan'),
('company_mobile', '0812-3456-7890', 'phone', 'Nomor WhatsApp perusahaan'),
('company_email', 'info@zcolighting.com', 'email', 'Email perusahaan'),
('google_maps_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.666!2d106.822!3d-6.208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMjguOCJTIDEwNsKwNDknMTkuMiJF!5e0!3m2!1sen!2sid!4v1234567890', 'url', 'Google Maps embed URL'),
('business_hours', 'Senin - Sabtu: 08:00 - 17:00, Minggu: Tutup', 'textarea', 'Jam operasional'),
('hero_title', 'Sewa Genset Berkualitas & Terpercaya', 'text', 'Judul hero section'),
('hero_subtitle', 'Solusi listrik cadangan untuk kebutuhan bisnis dan acara Anda. Tersedia berbagai kapasitas dengan harga kompetitif.', 'textarea', 'Subtitle hero section'),
('about_us', 'ZEO Lighting adalah penyedia layanan rental genset terpercaya dengan pengalaman Lebih dari 5 tahun. Kami menyediakan genset berkualitas tinggi dari berbagai merek ternama untuk memenuhi kebutuhan listrik cadangan Anda.', 'textarea', 'Tentang kami')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert sample products
INSERT INTO products (name, brand, capacity, power_output, fuel_type, daily_rate, description, features, display_order, status) VALUES
('Genset Silent 5 KVA', 'Honda', '5 KVA', '4000 Watt', 'bensin', 200000, 'Genset portable ideal untuk kebutuhan rumah tangga, warung, atau acara outdoor kecil.', 'Silent operation|Portable & compact|Fuel efficient|Auto start system', 1, 'active'),
('Genset Diesel 10 KVA', 'Yamaha', '10 KVA', '8000 Watt', 'solar', 350000, 'Genset diesel handal untuk kebutuhan toko, warung makan, atau acara menengah.', 'Low noise|Long runtime|Durable engine|Emergency stop button', 2, 'active'),
('Genset Industrial 20 KVA', 'Cummins', '20 KVA', '16000 Watt', 'solar', 600000, 'Genset industrial untuk pabrik kecil, gudang, atau acara besar yang membutuhkan daya stabil.', 'Heavy duty|Weather resistant|Digital control panel|24/7 operation capable', 3, 'active'),
('Genset Super Silent 30 KVA', 'Perkins', '30 KVA', '24000 Watt', 'solar', 900000, 'Genset super silent untuk kebutuhan gedung perkantoran, hotel, atau fasilitas yang memerlukan operasi senyap.', 'Super silent (<65dB)|Automatic voltage regulator|Remote monitoring|Water cooled system', 4, 'active'),
('Genset Portable 3 KVA', 'Firman', '3 KVA', '2500 Watt', 'bensin', 150000, 'Genset portable ringan cocok untuk camping, stand pameran, atau kebutuhan listrik darurat kecil.', 'Lightweight|Easy to move|Recoil start|Low fuel consumption', 5, 'active'),
('Genset Heavy Duty 50 KVA', 'Caterpillar', '50 KVA', '40000 Watt', 'solar', 1500000, 'Genset heavy duty untuk industri besar, data center, atau rumah sakit yang memerlukan power backup handal.', 'High reliability|Automatic transfer switch|Multiple protection systems|Synchronized operation ready', 6, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);
