const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
// Allow all origins in production/Railway
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins - no restrictions
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
};

app.use(cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes - Legacy (TrukJatim Tracking)
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/track', require('./routes/tracking'));

// Routes - MVP Ekspedisi
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/uang-jalan', require('./routes/uang-jalan'));

// Serve static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Ekspedisi MVP API',
    version: '2.0.0',
    description: 'API untuk automasi internal usaha ekspedisi',
    endpoints: {
      orders: {
        'GET /api/orders': 'List semua orders',
        'GET /api/orders/:id': 'Get single order',
        'POST /api/orders': 'Create order baru',
        'PUT /api/orders/:id': 'Update order',
        'PATCH /api/orders/:id/status': 'Update status order',
        'PATCH /api/orders/:id/assign-driver': 'Assign driver ke order',
        'PATCH /api/orders/:id/pod': 'Upload POD',
        'DELETE /api/orders/:id': 'Delete order'
      },
      customers: {
        'GET /api/customers': 'List customers',
        'POST /api/customers': 'Create customer',
        'PUT /api/customers/:id': 'Update customer',
        'DELETE /api/customers/:id': 'Delete customer'
      },
      drivers: {
        'GET /api/drivers': 'List drivers',
        'GET /api/drivers/available/list': 'List drivers tersedia',
        'POST /api/drivers': 'Create driver',
        'PUT /api/drivers/:id': 'Update driver',
        'DELETE /api/drivers/:id': 'Delete driver',
        'POST /api/drivers/logs': 'Create driver log (update dari sopir)'
      },
      billing: {
        'GET /api/billing': 'List tagihan',
        'GET /api/billing/ready/list': 'List order siap ditagih',
        'PATCH /api/billing/:id/status': 'Update status tagihan'
      },
      uang_jalan: {
        'GET /api/uang-jalan/templates': 'List template uang jalan',
        'POST /api/uang-jalan/calculate': 'Hitung uang jalan'
      },
      legacy: {
        'GET /api/track/:resi': 'Track shipment (legacy)',
        'GET /api/shipments': 'List shipments (legacy)'
      }
    }
  });
});

// Serve static files (frontend) - selalu aktif
app.use(express.static(path.join(__dirname, 'public')));

// Serve tracking_online.html sebagai default di root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracking_online.html'));
});

// Redirect /admin ke admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Redirect /driver ke driver-form.html
app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'driver-form.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak oleh CORS'
    });
  }
  
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🚛 Ekspedisi MVP API Server                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Environment: ${NODE_ENV.padEnd(38)} ║`);
  console.log(`║  Port: ${PORT.toString().padEnd(45)} ║`);
  console.log(`║  API URL: ${`http://localhost:${PORT}/api`.padEnd(42)} ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
