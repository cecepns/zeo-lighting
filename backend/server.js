const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads-zero-lighting/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration for hero image uploads
const heroStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads-zero-lighting/hero');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function untuk generate nomor
const generateNumber = (prefix, lastNumber) => {
  const num = (parseInt(lastNumber) || 0) + 1;
  return `${prefix}${String(num).padStart(4, '0')}`;
};

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(query, [username, username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = results[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const queries = {
    processed: 'SELECT COUNT(*) as count FROM po WHERE status = "processed"',
    dueSoon: `SELECT COUNT(*) as count FROM po WHERE status = "active" AND rental_end <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)`,
    completed: 'SELECT COUNT(*) as count FROM po WHERE status = "returned"',
    totalIncome: 'SELECT SUM(amount) as total FROM finance WHERE transaction_type = "income"',
    totalExpense: 'SELECT SUM(amount) as total FROM finance WHERE transaction_type = "expense"'
  };

  const results = {};
  let completed = 0;

  Object.keys(queries).forEach(key => {
    db.query(queries[key], (err, result) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        return;
      }
      results[key] = result[0].count || result[0].total || 0;
      completed++;

      if (completed === Object.keys(queries).length) {
        results.balance = (results.totalIncome || 0) - (results.totalExpense || 0);
        res.json(results);
      }
    });
  });
});

// CUSTOMERS ROUTES
app.get('/api/customers', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = 'SELECT COUNT(*) as total FROM customers';
  let dataQuery = 'SELECT * FROM customers';
  const params = [];
  
  if (search) {
    const searchCondition = ' WHERE name LIKE ? OR phone LIKE ? OR ktp_number LIKE ?';
    const searchParam = `%${search}%`;
    countQuery += searchCondition;
    dataQuery += searchCondition;
    params.push(searchParam, searchParam, searchParam);
  }
  
  dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  // Get total count
  db.query(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const total = countResult[0].total;
    
    // Get paginated data
    db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name, address, ktp_number, phone } = req.body;
  
  const query = 'INSERT INTO customers (name, address, ktp_number, phone) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, ktp_number, phone], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'KTP number already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ id: result.insertId, message: 'Customer created successfully' });
  });
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
  const { name, address, ktp_number, phone } = req.body;
  const { id } = req.params;
  
  const query = 'UPDATE customers SET name = ?, address = ?, ktp_number = ?, phone = ? WHERE id = ?';
  db.query(query, [name, address, ktp_number, phone, id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'KTP number already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Customer updated successfully' });
  });
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM customers WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// ITEMS ROUTES
app.get('/api/items', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM items ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/items/available', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM items WHERE status = "available" ORDER BY name';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/items', authenticateToken, (req, res) => {
  const { name, brand, capacity, fuel_type, daily_rate, description } = req.body;
  
  const query = 'INSERT INTO items (name, brand, capacity, fuel_type, daily_rate, description) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, brand, capacity, fuel_type, daily_rate, description], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ id: result.insertId, message: 'Item created successfully' });
  });
});

app.put('/api/items/:id', authenticateToken, (req, res) => {
  const { name, brand, capacity, fuel_type, daily_rate, status, description } = req.body;
  const { id } = req.params;
  
  const query = 'UPDATE items SET name = ?, brand = ?, capacity = ?, fuel_type = ?, daily_rate = ?, status = ?, description = ? WHERE id = ?';
  db.query(query, [name, brand, capacity, fuel_type, daily_rate, status, description, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Item updated successfully' });
  });
});

app.delete('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM items WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Item deleted successfully' });
  });
});

// PO ROUTES
app.get('/api/po', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = 'SELECT COUNT(*) as total FROM po p LEFT JOIN customers c ON p.customer_id = c.id';
  let dataQuery = `
    SELECT p.*, c.name as customer_name, c.phone as customer_phone
    FROM po p
    LEFT JOIN customers c ON p.customer_id = c.id
  `;
  const params = [];
  const conditions = [];
  
  if (search) {
    conditions.push('(p.po_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)');
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    countQuery += whereClause;
    dataQuery += whereClause;
  }
  
  dataQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  
  // Get total count
  db.query(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const total = countResult[0].total;
    
    // Get paginated data
    db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

app.get('/api/po/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const poQuery = `
    SELECT p.*, c.name as customer_name, c.address as customer_address, 
           c.ktp_number as customer_ktp, c.phone as customer_phone
    FROM po p
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE p.id = ?
  `;
  
  const itemsQuery = `
    SELECT pi.*, i.name as item_name, i.brand, i.capacity
    FROM po_items pi
    LEFT JOIN items i ON pi.item_id = i.id
    WHERE pi.po_id = ?
  `;
  
  db.query(poQuery, [id], (err, poResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (poResults.length === 0) {
      return res.status(404).json({ message: 'PO not found' });
    }
    
    db.query(itemsQuery, [id], (err, itemsResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const po = poResults[0];
      po.items = itemsResults;
      res.json(po);
    });
  });
});

app.post('/api/po', authenticateToken, (req, res) => {
  const {
    customer_id,
    items,
    rental_start,
    rental_end,
    dp_amount,
    signature_customer,
    signature_admin,
    notes
  } = req.body;

  // Generate PO number
  const getLastPOQuery = 'SELECT po_number FROM po ORDER BY id DESC LIMIT 1';
  
  db.query(getLastPOQuery, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const lastPO = results[0]?.po_number || 'PO0000';
    const po_number = generateNumber('PO', lastPO.replace('PO', ''));
    
    // Calculate total cost
    const startDate = new Date(rental_start);
    const endDate = new Date(rental_end);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    let total_cost = 0;
    
    items.forEach(item => {
      total_cost += item.quantity * item.daily_rate * days;
    });
    
    // Insert PO
    const poQuery = 'INSERT INTO po (po_number, customer_id, rental_start, rental_end, total_cost, dp_amount, signature_customer, signature_admin, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(poQuery, [po_number, customer_id, rental_start, rental_end, total_cost, dp_amount, signature_customer, signature_admin, notes], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const poId = result.insertId;
      
      // Insert PO items
      const itemsData = items.map(item => [poId, item.item_id, item.quantity, item.daily_rate]);
      const itemsQuery = 'INSERT INTO po_items (po_id, item_id, quantity, daily_rate) VALUES ?';
      
      db.query(itemsQuery, [itemsData], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        // Update item status to rented
        items.forEach(item => {
          db.query('UPDATE items SET status = "rented" WHERE id = ?', [item.item_id]);
        });
        
        res.json({ id: poId, po_number, message: 'PO created successfully' });
      });
    });
  });
});

app.put('/api/po/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const query = 'UPDATE po SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    // If status is returned, update item status back to available
    if (status === 'returned') {
      const updateItemsQuery = `
        UPDATE items i 
        JOIN po_items pi ON i.id = pi.item_id 
        SET i.status = 'available' 
        WHERE pi.po_id = ?
      `;
      db.query(updateItemsQuery, [id]);
    }
    
    res.json({ message: 'PO status updated successfully' });
  });
});

// INVOICES ROUTES
app.get('/api/invoices', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = `
    SELECT COUNT(*) as total FROM invoices i
    LEFT JOIN po p ON i.po_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
  `;
  let dataQuery = `
    SELECT i.*, p.po_number, c.name as customer_name
    FROM invoices i
    LEFT JOIN po p ON i.po_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
  `;
  const params = [];
  
  if (search) {
    const searchCondition = ' WHERE (i.invoice_number LIKE ? OR p.po_number LIKE ? OR c.name LIKE ?)';
    const searchParam = `%${search}%`;
    countQuery += searchCondition;
    dataQuery += searchCondition;
    params.push(searchParam, searchParam, searchParam);
  }
  
  dataQuery += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  
  // Get total count
  db.query(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const total = countResult[0].total;
    
    // Get paginated data
    db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const { po_id, amount, payment_type, payment_date, notes } = req.body;
  
  // Generate invoice number
  const getLastInvoiceQuery = 'SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1';
  
  db.query(getLastInvoiceQuery, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const lastInvoice = results[0]?.invoice_number || 'INV0000';
    const invoice_number = generateNumber('INV', lastInvoice.replace('INV', ''));
    
    // Insert invoice
    const query = 'INSERT INTO invoices (invoice_number, po_id, amount, payment_type, payment_date, notes) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [invoice_number, po_id, amount, payment_type, payment_date, notes], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      // Add to finance as income
      const financeQuery = 'INSERT INTO finance (transaction_type, amount, description, reference_type, reference_id, transaction_date) VALUES (?, ?, ?, ?, ?, ?)';
      const description = `Payment from invoice ${invoice_number}`;
      
      db.query(financeQuery, ['income', amount, description, 'invoice', result.insertId, payment_date], (err) => {
        if (err) {
          console.error('Error adding to finance:', err);
        }
      });
      
      res.json({ id: result.insertId, invoice_number, message: 'Invoice created successfully' });
    });
  });
});

// FINANCE ROUTES
app.get('/api/finance', authenticateToken, (req, res) => {
  const { start_date, end_date, type, page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = 'SELECT COUNT(*) as total FROM finance WHERE 1=1';
  let dataQuery = 'SELECT * FROM finance WHERE 1=1';
  const params = [];
  
  if (start_date && end_date) {
    const dateCondition = ' AND transaction_date BETWEEN ? AND ?';
    countQuery += dateCondition;
    dataQuery += dateCondition;
    params.push(start_date, end_date);
  }
  
  if (type && type !== 'all') {
    const typeCondition = ' AND transaction_type = ?';
    countQuery += typeCondition;
    dataQuery += typeCondition;
    params.push(type);
  }
  
  if (search) {
    const searchCondition = ' AND description LIKE ?';
    const searchParam = `%${search}%`;
    countQuery += searchCondition;
    dataQuery += searchCondition;
    params.push(searchParam);
  }
  
  dataQuery += ' ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?';
  
  // Get total count
  db.query(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    const total = countResult[0].total;
    
    // Get paginated data
    db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({
        data: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    });
  });
});

app.post('/api/finance', authenticateToken, (req, res) => {
  const { transaction_type, amount, description, transaction_date } = req.body;
  
  const query = 'INSERT INTO finance (transaction_type, amount, description, transaction_date) VALUES (?, ?, ?, ?)';
  
  db.query(query, [transaction_type, amount, description, transaction_date], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ id: result.insertId, message: 'Transaction added successfully' });
  });
});

// REPORTS ROUTES
app.get('/api/reports/summary', authenticateToken, (req, res) => {
  const { start_date, end_date } = req.query;
  
  const params = [];
  let dateFilter = '';
  
  if (start_date && end_date) {
    dateFilter = ' WHERE transaction_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  const queries = {
    totalIncome: `SELECT COALESCE(SUM(amount), 0) as total FROM finance WHERE transaction_type = 'income'${dateFilter}`,
    totalExpense: `SELECT COALESCE(SUM(amount), 0) as total FROM finance WHERE transaction_type = 'expense'${dateFilter}`,
    totalPO: `SELECT COUNT(*) as total FROM po${start_date && end_date ? ' WHERE created_at BETWEEN ? AND ?' : ''}`,
    activePO: `SELECT COUNT(*) as total FROM po WHERE status IN ('processed', 'active')${start_date && end_date ? ' AND created_at BETWEEN ? AND ?' : ''}`
  };
  
  const results = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    const queryParams = key.includes('PO') && start_date && end_date ? [start_date, end_date] : params;
    
    db.query(queries[key], queryParams, (err, result) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        return;
      }
      results[key] = result[0].total || 0;
      completed++;
      
      if (completed === Object.keys(queries).length) {
        results.balance = results.totalIncome - results.totalExpense;
        res.json(results);
      }
    });
  });
});

// ===== PRODUCTS ROUTES (Admin) =====
app.get('/api/products', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM products ORDER BY display_order ASC, created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/products', authenticateToken, upload.single('image'), (req, res) => {
  const { name, brand, capacity, power_output, fuel_type, daily_rate, description, features, display_order, status } = req.body;
  const image = req.file ? `/uploads-zero-lighting/products/${req.file.filename}` : null;
  
  const query = `INSERT INTO products (name, brand, capacity, power_output, fuel_type, daily_rate, description, features, image, display_order, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(query, [name, brand, capacity, power_output, fuel_type, daily_rate, description, features, image, display_order || 0, status || 'active'], (err, result) => {
    if (err) {
      console.error('Error creating product:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ id: result.insertId, message: 'Product created successfully', image });
  });
});

app.put('/api/products/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, brand, capacity, power_output, fuel_type, daily_rate, description, features, display_order, status } = req.body;
  
  // Check if new image uploaded
  if (req.file) {
    const newImage = `/uploads-zero-lighting/products/${req.file.filename}`;
    
    // Get old image to delete
    db.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
      if (!err && results.length > 0 && results[0].image) {
        const oldImagePath = path.join(__dirname, results[0].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    });
    
    const query = `UPDATE products SET name = ?, brand = ?, capacity = ?, power_output = ?, fuel_type = ?, daily_rate = ?, 
                   description = ?, features = ?, image = ?, display_order = ?, status = ? WHERE id = ?`;
    db.query(query, [name, brand, capacity, power_output, fuel_type, daily_rate, description, features, newImage, display_order, status, id], (err) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Product updated successfully', image: newImage });
    });
  } else {
    const query = `UPDATE products SET name = ?, brand = ?, capacity = ?, power_output = ?, fuel_type = ?, daily_rate = ?, 
                   description = ?, features = ?, display_order = ?, status = ? WHERE id = ?`;
    db.query(query, [name, brand, capacity, power_output, fuel_type, daily_rate, description, features, display_order, status, id], (err) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Product updated successfully' });
    });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Get image path before delete
  db.query('SELECT image FROM products WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (results.length > 0 && results[0].image) {
      const imagePath = path.join(__dirname, results[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    db.query('DELETE FROM products WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Product deleted successfully' });
    });
  });
});

// ===== SITE SETTINGS ROUTES (Admin) =====
app.get('/api/settings', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM site_settings ORDER BY setting_key';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.put('/api/settings/:key', authenticateToken, (req, res) => {
  const { key } = req.params;
  const { setting_value } = req.body;
  
  const query = 'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?';
  db.query(query, [setting_value, key], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json({ message: 'Setting updated successfully' });
  });
});

app.post('/api/settings', authenticateToken, (req, res) => {
  const { setting_key, setting_value, setting_type, description } = req.body;
  
  const query = 'INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)';
  db.query(query, [setting_key, setting_value, setting_type || 'text', description], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Setting key already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ id: result.insertId, message: 'Setting created successfully' });
  });
});

// Upload hero image endpoint
app.post('/api/settings/hero-image/upload', authenticateToken, heroUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const imagePath = `/uploads-zero-lighting/hero/${req.file.filename}`;
    
    // Get old hero image to delete it first
    db.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', ['hero_image'], (err, results) => {
      if (!err && results.length > 0 && results[0].setting_value) {
        const oldImagePath = path.join(__dirname, results[0].setting_value);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Update hero_image setting
      const query = `INSERT INTO site_settings (setting_key, setting_value, setting_type, description) 
                     VALUES ('hero_image', ?, 'url', 'Hero section image')
                     ON DUPLICATE KEY UPDATE setting_value = ?`;
      
      db.query(query, [imagePath, imagePath], (err) => {
        if (err) {
          console.error('Database error:', err);
          // Delete uploaded file if database update fails
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ message: 'Failed to save image path' });
        }
        
        res.json({ 
          message: 'Hero image uploaded successfully',
          imagePath: imagePath 
        });
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// ===== PUBLIC ROUTES (No Authentication) =====
app.get('/api/public/products', (req, res) => {
  const query = 'SELECT * FROM products WHERE status = "active" ORDER BY display_order ASC, created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/public/settings', (req, res) => {
  const query = 'SELECT setting_key, setting_value, setting_type FROM site_settings';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Convert to key-value object
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json(settings);
  });
});

app.post('/api/public/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }
  
  const query = 'INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, email, phone, subject, message], (err, result) => {
    if (err) {
      console.error('Error saving contact submission:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Your message has been sent successfully! We will contact you soon.' });
  });
});

// ===== CONTACT SUBMISSIONS ROUTES (Admin) =====
app.get('/api/contact-submissions', authenticateToken, (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT * FROM contact_submissions';
  const params = [];
  
  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

app.put('/api/contact-submissions/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const query = 'UPDATE contact_submissions SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Contact submission status updated successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});