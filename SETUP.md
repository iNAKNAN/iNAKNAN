# 🚀 Setup Tracking Online TrukJatim

Panduan lengkap setup backend agar tracking bisa berjalan secara online.

## 📁 File yang Sudah Dibuat

```
backend/
├── server.js              # Entry point Express server
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables
├── .env.example           # Contoh environment variables
├── .gitignore            # Git ignore rules
├── README.md             # Dokumentasi lengkap backend
├── database/
│   ├── schema.sql        # Database schema
│   ├── init-db.js        # Script inisialisasi data sample
│   └── db.js             # Database wrapper class
└── routes/
    ├── shipments.js      # API routes untuk shipments
    └── tracking.js       # API routes untuk tracking

tracking_online.html       # Frontend yang sudah terhubung ke API
```

## ⚡ Quick Start (Local Development)

### 1. Install Backend

```bash
cd backend
npm install
```

### 2. Init Database

```bash
npm run init-db
```

### 3. Start Server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

### 4. Buka Frontend

Buka `tracking_online.html` di browser (bisa pakai Live Server VS Code).

> **Note:** Frontend otomatis detect localhost dan connect ke `http://localhost:3000`

## 🌐 Deploy Online

### Opsi 1: Deploy ke Railway (Recommended - Gratis)

1. Push project ke GitHub
2. Login ke [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Pilih repository Anda
5. Railway otomatis detect Node.js dan deploy
6. Dapatkan public URL (contoh: `https://trukjatim-api.up.railway.app`)
7. Update `CORS_ORIGIN` di environment variables dengan URL frontend Anda

### Opsi 2: Deploy ke Render (Gratis)

1. Push project ke GitHub
2. Login ke [render.com](https://render.com)
3. Click "New Web Service"
4. Pilih repository
5. Settings:
   - Build Command: `npm install && npm run init-db`
   - Start Command: `npm start`
6. Add environment variables:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-domain.com`
7. Deploy!

### Opsi 3: Deploy Frontend + Backend Bersama (Vercel/Netlify + Serverless)

Jika ingin deploy frontend dan backend di platform yang sama:

1. Copy `tracking_online.html` ke folder `backend/public/index.html`
2. Uncomment baris serve static files di `server.js`:
   ```javascript
   app.use(express.static(path.join(__dirname, 'public')));
   ```
3. Deploy folder `backend` ke Vercel/Netlify
4. Frontend akan tersedia di root domain, API di `/api/*`

## 🔧 Konfigurasi API URL

### Local Development
Frontend otomatis detect localhost:
```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000'
};
```

### Production
Jika backend di domain yang berbeda, edit `tracking_online.html`:

```javascript
const API_CONFIG = {
  // Ganti dengan URL backend Anda
  BASE_URL: 'https://api.trukjatim.com'
};
```

Jika backend dan frontend di domain yang sama (subpath `/api`):
```javascript
const API_CONFIG = {
  BASE_URL: ''  // Kosong = same origin
};
```

## 📱 Fitur API

### Tracking (Customer)
- `GET /api/track/:resi` - Cek status pengiriman
- `GET /api/track/:resi/position` - Get posisi real-time

### Admin
- `GET /api/shipments` - List semua pengiriman
- `GET /api/shipments/stats` - Statistik dashboard
- `POST /api/shipments` - Tambah pengiriman baru
- `PUT /api/shipments/:id` - Update data pengiriman
- `PATCH /api/shipments/:id/position` - Update posisi GPS
- `DELETE /api/shipments/:id` - Hapus pengiriman

## 🔒 Keamanan Production

Sebelum deploy ke production, pertimbangkan:

1. **Tambahkan API Key/Auth** untuk endpoint admin
2. **Enable HTTPS** (Railway/Render otomatis handle ini)
3. **Set CORS_ORIGIN** spesifik ke domain frontend Anda, jangan pakai `*`
4. **Backup database** secara berkala

## 🐛 Troubleshooting

### Frontend tidak bisa connect ke API
1. Check CORS_ORIGIN di backend sudah include domain frontend
2. Check browser console untuk error detail
3. Pastikan API_URL di frontend benar

### Database error
```bash
# Re-initialize database
rm backend/database/tracking.db
cd backend
npm run init-db
```

### Port already in use
```bash
# Ganti port di .env
PORT=3001
```

## 📞 Butuh Bantuan?

Lihat `backend/README.md` untuk dokumentasi lebih detail.
