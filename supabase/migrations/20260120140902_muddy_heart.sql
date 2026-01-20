-- Database: genset_rental
-- Struktur tabel untuk aplikasi sewa genset

CREATE DATABASE IF NOT EXISTS genset_rental;
USE genset_rental;

-- Tabel users (admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'superadmin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel customers
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  ktp_number VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel items (genset)
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(50),
  capacity VARCHAR(20),
  fuel_type ENUM('solar', 'bensin', 'gas') DEFAULT 'solar',
  daily_rate DECIMAL(10,2) NOT NULL,
  status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel po (purchase order)
CREATE TABLE po (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  rental_start DATE NOT NULL,
  rental_end DATE NOT NULL,
  rental_days INT GENERATED ALWAYS AS (DATEDIFF(rental_end, rental_start)) STORED,
  total_cost DECIMAL(12,2) NOT NULL,
  dp_amount DECIMAL(12,2) DEFAULT 0,
  remaining_payment DECIMAL(12,2) GENERATED ALWAYS AS (total_cost - dp_amount) STORED,
  signature_customer TEXT,
  signature_admin TEXT,
  notes TEXT,
  status ENUM('draft', 'processed', 'active', 'returned', 'cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabel po_items (detail barang dalam PO)
CREATE TABLE po_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  daily_rate DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (po_id) REFERENCES po(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- View untuk menghitung subtotal otomatis
CREATE VIEW po_items_with_subtotal AS
SELECT 
  pi.id,
  pi.po_id,
  pi.item_id,
  pi.quantity,
  pi.daily_rate,
  (pi.quantity * pi.daily_rate * p.rental_days) AS subtotal,
  i.name AS item_name,
  i.brand AS item_brand,
  i.capacity AS item_capacity
FROM po_items pi
JOIN po p ON pi.po_id = p.id
JOIN items i ON pi.item_id = i.id;

-- Tabel invoices (kwitansi)
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  po_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_type ENUM('dp', 'full', 'installment') NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES po(id) ON DELETE CASCADE
);

-- Tabel finance (pencatatan keuangan)
CREATE TABLE finance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_type ENUM('po', 'invoice', 'other') DEFAULT 'other',
  reference_id INT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@genset.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');

-- Insert sample items (genset)
INSERT INTO items (name, brand, capacity, fuel_type, daily_rate, description) VALUES
('Genset 5KVA', 'Honda', '5KVA', 'bensin', 150000, 'Genset Honda 5KVA untuk kebutuhan rumah tangga'),
('Genset 10KVA', 'Yamaha', '10KVA', 'solar', 250000, 'Genset Yamaha 10KVA untuk kebutuhan komersial'),
('Genset 15KVA', 'Cummins', '15KVA', 'solar', 350000, 'Genset Cummins 15KVA untuk industri kecil'),
('Genset 20KVA', 'Perkins', '20KVA', 'solar', 450000, 'Genset Perkins 20KVA untuk industri menengah');

-- Insert sample customers
INSERT INTO customers (name, address, ktp_number, phone) VALUES
('PT. Maju Mundur', 'Jl. Sudirman No. 123, Jakarta', '3171010101010001', '021-12345678'),
('Toko Berkah', 'Jl. Kebon Jeruk No. 45, Jakarta', '3171020202020002', '021-87654321');