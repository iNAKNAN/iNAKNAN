# 🚚 MVP Automasi Internal Usaha Ekspedisi

Sistem otomasi internal sederhana untuk usaha ekspedisi dengan fitur:
- Manajemen Order dengan workflow status
- Monitoring Sopir
- POD (Proof of Delivery)
- Perhitungan Uang Jalan Otomatis
- Sistem Penagihan

---

## 📁 Struktur Project

```
backend/
├── server.js              # Entry point Express server
├── package.json           # Dependencies
├── database/
│   ├── schema-mvp.sql    # Database schema
│   ├── db-mvp.js         # Database wrapper
│   └── mvp.db            # SQLite database (auto-generated)
├── routes/
│   ├── orders.js         # API orders
│   ├── drivers.js        # API drivers
│   ├── customers.js      # API customers
│   ├── billing.js        # API penagihan
│   └── uang-jalan.js     # API perhitungan uang jalan
└── uploads/              # Folder untuk foto POD

admin.html               # Dashboard admin
 driver-form.html         # Form update sopir
tracking_online.html     # Tracking untuk customer (existing)
MVP-SETUP.md            # Dokumentasi ini
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 3. Buka Aplikasi

| File | URL | Kegunaan |
|------|-----|----------|
| `admin.html` | `http://localhost:5500/admin.html` | Dashboard admin |
| `driver-form.html` | `http://localhost:5500/driver-form.html` | Form update sopir |
| `tracking_online.html` | `http://localhost:5500/tracking_online.html` | Tracking customer |

> **Note:** Gunakan Live Server VS Code atau server static lainnya untuk membuka HTML files.

---

## 📊 Workflow Sistem

```
1. Admin input order baru → Status: MENUNGGU
2. Admin assign driver → Status: DIJADWALKAN
3. Sopir update status via form:
   - MUAT → JALAN → SAMPAI → BONGKAR
4. Admin tandai SELESAI
5. Upload POD (foto surat jalan & barang)
6. Order masuk daftar penagihan
7. Admin update status tagihan: LUNAS
```

---

## 🔌 API Endpoints

### Orders
```
GET    /api/orders                 # List semua orders
GET    /api/orders/:id             # Get single order
POST   /api/orders                 # Create order baru
PUT    /api/orders/:id             # Update order
PATCH  /api/orders/:id/status      # Update status order
PATCH  /api/orders/:id/assign-driver # Assign driver
PATCH  /api/orders/:id/pod         # Upload POD
DELETE /api/orders/:id             # Delete order
```

### Drivers
```
GET    /api/drivers                # List drivers
GET    /api/drivers/available/list # List drivers tersedia
POST   /api/drivers                # Create driver
PUT    /api/drivers/:id            # Update driver
DELETE /api/drivers/:id            # Delete driver
POST   /api/drivers/logs           # Create driver log (update status)
```

### Customers
```
GET    /api/customers              # List customers
POST   /api/customers              # Create customer
PUT    /api/customers/:id          # Update customer
DELETE /api/customers/:id          # Delete customer
```

### Billing
```
GET    /api/billing                # List tagihan
GET    /api/billing/ready/list     # List order siap ditagih
GET    /api/billing/stats/summary  # Statistik penagihan
PATCH  /api/billing/:id/status     # Update status tagihan
```

### Uang Jalan
```
GET    /api/uang-jalan/templates   # List template
POST   /api/uang-jalan/calculate   # Hitung uang jalan
```

---

## 🗄️ Database Schema

### Tabel: orders
| Field | Type | Keterangan |
|-------|------|------------|
| id | TEXT PK | Nomor order |
| tanggal | DATETIME | Tanggal order |
| customer_id | INTEGER FK | ID customer |
| customer_nama | TEXT | Nama customer |
| titik_a | TEXT | Titik muat |
| titik_b | TEXT | Titik bongkar |
| jenis_barang | TEXT | Jenis barang |
| driver_id | INTEGER FK | ID driver |
| driver_nama | TEXT | Nama driver |
| status | TEXT | MENUNGGU/DIJADWALKAN/MUAT/JALAN/BONGKAR/SELESAI |
| jarak_km | REAL | Jarak dalam km |
| konsumsi_bbm | REAL | Konsumsi BBM km/liter |
| harga_bbm | REAL | Harga BBM per liter |
| biaya_tol | REAL | Biaya tol |
| biaya_makan | REAL | Biaya makan |
| total_uang_jalan | REAL | Total uang jalan (auto) |
| pod_surat_jalan | TEXT | URL foto surat jalan |
| pod_barang_sampai | TEXT | URL foto barang sampai |
| nilai_tagihan | REAL | Nilai tagihan |
| status_tagihan | TEXT | BELUM/LUNAS |

### Tabel: drivers
| Field | Type | Keterangan |
|-------|------|------------|
| id | INTEGER PK | ID driver |
| nama | TEXT | Nama driver |
| telepon | TEXT | Nomor telepon |
| nopol_truck | TEXT | Nomor polisi truck |
| armada | TEXT | Jenis armada (CDD/CDE/Fuso/etc) |
| status | TEXT | AKTIF/OFF/LIBUR |

---

## 💰 Formula Uang Jalan

```
BBM Dibutuhkan = Jarak (km) / Konsumsi BBM (km/liter)
Total BBM = BBM Dibutuhkan × Harga BBM per liter
Total Uang Jalan = Total BBM + Biaya Tol + Biaya Makan
```

Contoh:
- Jarak: 800 km
- Konsumsi: 5 km/liter
- Harga BBM: Rp 10.000/liter
- Tol: Rp 350.000
- Makan: Rp 150.000

Perhitungan:
```
BBM = 800 / 5 = 160 liter
Total BBM = 160 × 10.000 = Rp 1.600.000
Total Uang Jalan = 1.600.000 + 350.000 + 150.000 = Rp 2.100.000
```

---

## 📱 Cara Pakai

### Sebagai Admin:

1. **Buka Dashboard**: `admin.html`
2. **Tambah Order**: Klik "+ Order Baru", isi form, simpan
3. **Assign Driver**: Pilih order → Update → Assign driver
4. **Update Status**: Pilih order → Update Status
5. **Upload POD**: Setelah selesai, upload foto surat jalan & barang
6. **Penagihan**: Lihat daftar tagihan, tandai LUNAS jika sudah dibayar

### Sebagai Sopir:

1. **Buka Form**: `driver-form.html`
2. **Isi Nomor Order**: Contoh: ORD-001
3. **Isi Nama**: Nama lengkap sopir
4. **Pilih Status**: MUAT / JALAN / SAMPAI / BONGKAR
5. **Upload Foto** (opsional): Foto surat jalan atau barang
6. **Kirim**: Klik tombol "Kirim Update"

---

## 🎨 Status Order

| Status | Warna | Keterangan |
|--------|-------|------------|
| MENUNGGU | Abu-abu | Order masuk, belum diassign |
| DIJADWALKAN | Biru | Sudah assign driver |
| MUAT | Ungu | Sedang proses muat |
| JALAN | Kuning | Dalam perjalanan |
| BONGKAR | Orange | Sedang proses bongkar |
| SELESAI | Hijau | Pengiriman selesai |

---

## 🚀 Next Steps (Future Enhancement)

- [ ] WhatsApp bot untuk notifikasi
- [ ] Real-time GPS tracking
- [ ] Dashboard analytics dengan chart
- [ ] Multi-user authentication
- [ ] Mobile app untuk sopir
- [ ] Auto-sync dengan Google Sheets
- [ ] PDF invoice generator
- [ ] Email notifications

---

## 🐛 Troubleshooting

### Database error
```bash
# Reset database (akan menghapus semua data)
rm backend/database/mvp.db
cd backend
npm run dev  # Database akan auto-initialize
```

### Port already in use
```bash
# Ganti port di backend/.env
PORT=3001
```

### Frontend tidak connect ke API
1. Pastikan backend running di port 3000
2. Check CORS settings di `backend/server.js`
3. Pastikan `API_URL` di frontend sesuai

---

## 📞 Support

Untuk pertanyaan atau issue, silakan hubungi developer.

---

**Selamat menggunakan!** 🚚💨
