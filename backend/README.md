# 🚛 TrukJatim Tracking Backend

Backend API untuk aplikasi tracking pengiriman TrukJatim. Dibangun dengan Node.js, Express, dan SQLite.

## 📋 Fitur

- ✅ REST API untuk tracking pengiriman
- ✅ CRUD shipments (Create, Read, Update, Delete)
- ✅ Real-time position updates
- ✅ SQLite database (no external DB required)
- ✅ CORS enabled untuk integrasi frontend
- ✅ Auto-generate tracking history

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

### 3. Initialize Database

```bash
npm run init-db
```

Script ini akan:
- Membuat file database SQLite (`database/tracking.db`)
- Membuat tabel `shipments` dan `shipment_history`
- Insert 5 data sample untuk testing

### 4. Start Server

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Tracking
```
GET    /api/track/:resi              # Track shipment by resi
POST   /api/track/batch              # Track multiple resi
GET    /api/track/:resi/position     # Get current position only
```

### Shipments (Admin)
```
GET    /api/shipments                # List all shipments
GET    /api/shipments/stats          # Get statistics
GET    /api/shipments/:id            # Get single shipment
POST   /api/shipments                # Create shipment
PUT    /api/shipments/:id            # Update shipment
PATCH  /api/shipments/:id/position   # Update position (GPS)
DELETE /api/shipments/:id            # Delete shipment
```

### Contoh Response

**Track Shipment:**
```json
{
  "success": true,
  "data": {
    "id": "TJ-2024-001",
    "pengirim": "Budi Widodo",
    "status": "on-the-way",
    "lat": -7.536,
    "lng": 112.238,
    "progress": 55,
    "history": [
      { "label": "Order Diterima", "time": "07:00 WIB", "done": true, "active": false },
      { "label": "Dalam Perjalanan", "time": "10:05 WIB – sekarang", "done": true, "active": true }
    ]
  }
}
```

**Stats:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "jalan": 3,
    "selesai": 1,
    "muat": 1
  }
}
```

## 🌐 Integrasi Frontend

Frontend sudah tersedia di `tracking_online.html`. Pastikan konfigurasi API URL sudah benar:

```javascript
// Di tracking_online.html
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000'  // Sesuaikan dengan URL backend
};
```

## 🚀 Deploy ke Production

### Deploy ke Railway/Render/Heroku

1. Push code ke GitHub
2. Connect repository ke platform deploy
3. Set environment variables:
   - `PORT` (otomatis diatur oleh platform)
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-domain.com`
4. Platform akan otomatis menjalankan `npm start`

### Deploy ke VPS (Ubuntu)

```bash
# Clone repository
git clone <your-repo>
cd trukjatim-tracking/backend

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit konfigurasi

# Initialize database
npm run init-db

# Install PM2
sudo npm install -g pm2

# Start dengan PM2
pm2 start server.js --name trukjatim-api
pm2 save
pm2 startup
```

### Deploy Frontend + Backend di Domain yang Sama

Jika frontend dan backend di-deploy di domain yang sama (misalnya di Vercel atau Netlify dengan serverless functions):

1. Copy seluruh file frontend ke folder `public/` backend
2. Atau gunakan konfigurasi berikut di `server.js`:

```javascript
// Serve static files
app.use(express.static(path.join(__dirname, '../')));
```

## 🔒 Keamanan (Production)

Untuk production, pertimbangkan menambahkan:

1. **API Authentication** - Tambahkan middleware untuk validasi API key
2. **Rate Limiting** - Gunakan `express-rate-limit`
3. **Input Validation** - Gunakan library seperti `joi` atau `express-validator`
4. **HTTPS** - Pastikan menggunakan SSL certificate
5. **Backup Database** - Backup berkala file SQLite

## 🗄️ Struktur Database

### Tabel: shipments
| Field | Type | Keterangan |
|-------|------|------------|
| id | TEXT PK | Nomor resi |
| pengirim | TEXT | Nama pengirim |
| wa | TEXT | Nomor WhatsApp |
| barang | TEXT | Jenis barang |
| asal | TEXT | Kota asal |
| tujuan | TEXT | Kota tujuan |
| armada | TEXT | Jenis armada |
| nopol | TEXT | Nomor polisi |
| driver | TEXT | Nama driver |
| status | TEXT | loading/pickup/on-the-way/delivered |
| lokasi | TEXT | Lokasi saat ini |
| lat | REAL | Latitude |
| lng | REAL | Longitude |
| progress | INTEGER | Persentase perjalanan |
| eta | TEXT | Estimasi tiba |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu terakhir update |

### Tabel: shipment_history
| Field | Type | Keterangan |
|-------|------|------------|
| id | INTEGER PK | Auto increment |
| shipment_id | TEXT FK | Reference ke shipments.id |
| label | TEXT | Label status |
| time | TEXT | Waktu |
| done | INTEGER | 0/1 |
| active | INTEGER | 0/1 |

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port already in use"
```bash
# Cari process yang menggunakan port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Error CORS
Pastikan `CORS_ORIGIN` di `.env` mencakup domain frontend Anda.

### Database locked
SQLite tidak mendukung concurrent writes. Untuk production dengan traffic tinggi, migrasi ke PostgreSQL/MySQL.

## 📱 Integrasi GPS Tracker

Untuk update posisi otomatis dari GPS tracker, panggil endpoint:

```bash
PATCH /api/shipments/:id/position
Content-Type: application/json

{
  "lat": -7.5360,
  "lng": 112.2384,
  "lokasi": "Tol Surabaya-Malang KM 45",
  "progress": 55
}
```

## 📄 Lisensi

MIT License
