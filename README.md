# 🚛 TrukJatim — Sistem Otomasi Ekspedisi

> **Aplikasi manajemen pengiriman & tracking real-time** untuk usaha ekspedisi. Tersedia dalam versi **Mobile App (Flutter)** dan **Dashboard Web** dengan backend REST API yang solid.

<p align="center">
  <a href="https://flutter.dev"><img src="https://img.shields.io/badge/Flutter-3.11+-02569B?style=flat&logo=flutter&logoColor=white" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-14+-339933?style=flat&logo=node.js&logoColor=white" /></a>
  <a href="https://www.sqlite.org"><img src="https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white" /></a>
  <a href="https://github.com/iNAKNAN/iNAKNAN/releases/tag/v1.1.0"><img src="https://img.shields.io/badge/Release-v1.1.0-FF5A00?style=flat&logo=github" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat" /></a>
</p>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📦 **Manajemen Order** | Kelola pengiriman dari mulai diterima, dijemput, dalam perjalanan, hingga selesai |
| 🗺️ **Real-time Tracking** | Lacak posisi kendaraan & pengiriman langsung di peta (Maps) |
| 📸 **POD (Proof of Delivery)** | Upload foto bukti serah terima barang secara real-time |
| 🧮 **Uang Jalan Otomatis** | Perhitungan biaya perjalanan otomatis berdasarkan rute & parameter bisnis |
| 💰 **Sistem Penagihan** | Generate invoice & kelola status pembayaran customer |
| 👨‍✈️ **Monitoring Sopir** | Pantau status & lokasi sopir dalam satu dashboard |
| 📊 **Dashboard Admin** | Statistik & ringkasan performa operasional harian/bulanan |

---

## 🏗️ Arsitektur & Tech Stack

```
┌─────────────────┐      REST API      ┌─────────────────┐
│   Flutter App   │ ◄────────────────► │  Node.js + Exp  │
│  (Android/iOS)  │                    │   (Backend)     │
└─────────────────┘                    └────────┬────────┘
                                                 │
                                        ┌────────▼────────┐
                                        │  SQLite / PG    │
                                        │   (Database)    │
                                        └─────────────────┘
```

### Mobile App
![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat&logo=flutter&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=flat&logo=dart&logoColor=white)
![Provider](https://img.shields.io/badge/Provider-State%20Management-orange)

**Packages utama:**
- `flutter_map` + `latlong2` — Peta & routing
- `image_picker` — Upload foto POD
- `http` — Komunikasi dengan REST API
- `shared_preferences` — Local storage
- `intl` — Format tanggal & mata uang

### Backend & Web
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

**Libraries:** CORS, UUID, dotenv

### Frontend Web (Tracking & Admin)
- **Leaflet.js** — Maps interaktif untuk tracking online
- **Vanilla JS + CSS3** — Dashboard admin & customer tracking page

---

## 📁 Struktur Project

```
├── backend/                    # REST API Server
│   ├── database/
│   │   ├── schema.sql          # Skema database
│   │   ├── db.js               # Database wrapper
│   │   └── init-db.js          # Seeder data sample
│   ├── routes/
│   │   ├── shipments.js        # API pengiriman
│   │   ├── tracking.js         # API tracking
│   │   ├── orders.js           # API order (MVP)
│   │   ├── drivers.js          # API sopir (MVP)
│   │   ├── customers.js        # API customer (MVP)
│   │   ├── billing.js          # API penagihan (MVP)
│   │   └── uang-jalan.js       # API perhitungan uang jalan
│   ├── uploads/                # Folder foto POD
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env
│
├── ekspedisi_app/              # Aplikasi Flutter
│   ├── lib/
│   │   ├── models/             # Data models (Order, Driver, dll)
│   │   ├── screens/            # UI Screens
│   │   ├── providers/          # State management
│   │   ├── services/           # API service layer
│   │   └── widgets/            # Reusable widgets
│   └── pubspec.yaml
│
├── tracking_online.html        # Halaman tracking untuk customer
├── admin.html                  # Dashboard admin (web)
├── driver-form.html            # Form update status sopir
└── ekspedisi-app-debug.apk     # APK installer (Android)
```

---

## 🚀 Quick Start

### 👤 Untuk User (Install Aplikasi)

Cukup download dan install APK, tidak perlu clone repo:

1. **Download APK** dari [GitHub Releases](https://github.com/iNAKNAN/iNAKNAN/releases/tag/v1.1.0)
2. **Install** di Android (aktifkan *Install from unknown sources* jika diminta)
3. **Buka aplikasi** dan mulai gunakan

> **Note:** Aplikasi ini membutuhkan backend server. Untuk demo lokal, backend perlu dijalankan terlebih dahulu (lihat bagian Developer di bawah).

---

### 🧑‍💻 Untuk Developer (Setup Project)

Jika ingin develop, modifikasi, atau run project ini dari source code:

#### 1. Clone Repository

```bash
git clone https://github.com/iNAKNAN/iNAKNAN.git
cd iNAKNAN
```

#### 2. Jalankan Backend

```bash
cd backend
npm install

# Init database (SQLite)
npm run init-db

# Start server
npm run dev
```
Server berjalan di `http://localhost:3000`

#### 3. Jalankan Mobile App (Flutter)

```bash
cd ekspedisi_app
flutter pub get
flutter run
```

#### 4. Buka Web Dashboard

- **Tracking Customer:** Buka `tracking_online.html` di browser
- **Admin Dashboard:** Buka `admin.html` di browser

---

## 📱 Download APK

| Platform | File |
|----------|------|
| Android | [**Download APK v5**](https://github.com/iNAKNAN/iNAKNAN/releases/download/v1.1.0/ekspedisi-app-release-v5.apk) |

> **Note:** Untuk install, aktifkan **"Install from unknown sources"** di pengaturan Android.

---

## 🔥 Fitur

### 🗺️ Real-time Tracking dengan Maps
Customer dan admin bisa melihat posisi kendaraan pengiriman secara langsung di peta. Data posisi diupdate secara berkala melalui REST API.

### 📸 Proof of Delivery (POD) dengan Foto
Sopir dapat mengambil foto bukti serah terima barang langsung dari aplikasi mobile. Foto tersimpan di server dan bisa diakses kapan saja untuk verifikasi.

---

## 🖼️ Preview

### 📊 Dashboard Admin
Ringkasan statistik operasional: total order, perjalanan aktif, penyelesaian, dan piutang.

<p align="center">
  <img src="screenshots/dashboard_new.jpeg" width="280" />
</p>

### 📦 Manajemen Orders
Kelola semua pengiriman dengan filter status dan form order baru.

<p align="center">
  <img src="screenshots/order.jpeg" width="280" />
  <img src="screenshots/order_baru.jpeg" width="280" />
</p>

### 🗺️ Real-time Tracking
Lacak posisi kendaraan & detail pengiriman langsung di peta.

<p align="center">
  <img src="screenshots/tracking.jpeg" width="280" />
</p>

### 📸 Update Perjalanan & POD
Sopir update status perjalanan dan upload foto bukti pengiriman.

<p align="center">
  <img src="screenshots/form_update_sopir.jpeg" width="280" />
</p>

---

## 🎬 Demo Video

Klik thumbnail di bawah untuk menonton simulasi lengkap aplikasi TrukJatim (2 menit):

<p align="center">
  <a href="https://youtube.com/shorts/jB-oOtbvcmg?feature=share" target="_blank">
    <img src="https://img.youtube.com/vi/jB-oOtbvcmg/0.jpg" width="360" alt="TrukJatim Demo Video" />
  </a>
</p>

<p align="center">
  <a href="https://youtube.com/shorts/jB-oOtbvcmg?feature=share">▶️ Tonton di YouTube</a>
</p>

---

## 📥 Postman Collection

Import file collection ini ke Postman untuk test semua API secara instan:

📄 [`TrukJatim-API.postman_collection.json`](./TrukJatim-API.postman_collection.json)

**Cara import:**
1. Buka Postman → **File → Import**
2. Pilih file `TrukJatim-API.postman_collection.json`
3. Klik **Import**
4. Semua endpoint siap di-test!

---

## 🗄️ Database Schema

Sistem ini menggunakan **2 database**:

### 1. Tracking Database (SQLite)
| Tabel | Deskripsi |
|-------|-----------|
| `shipments` | Data pengiriman legacy (tracking online) |
| `shipment_history` | Timeline/status history setiap pengiriman |

### 2. MVP Database (SQLite)
| Tabel | Deskripsi |
|-------|-----------|
| `customers` | Data pelanggan |
| `drivers` | Data sopir & kendaraan |
| `orders` | Order pengiriman lengkap dengan uang jalan, POD, tagihan |
| `driver_logs` | Log update dari sopir (foto, status, catatan) |
| `order_history` | Riwayat perubahan status order |
| `uang_jalan_templates` | Template perhitungan biaya perjalanan |

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  customers  │◄──────┤    orders   │──────►│   drivers   │
│  (pelanggan)│  1:N  │  (pengiriman)│  N:1  │   (sopir)   │
└─────────────┘       └──────┬──────┘       └─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │driver_logs  │ │order_history│ │uang_jalan_  │
     │(update sopir)│ │(timeline)   │ │  templates  │
     └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 📡 API Documentation

Base URL: `http://localhost:3000`

### Shipments

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/shipments` | List semua pengiriman |
| `POST` | `/api/shipments` | Buat pengiriman baru |
| `GET` | `/api/shipments/:id` | Detail pengiriman |

#### Contoh: Buat Pengiriman Baru

**Request:**
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "ORD-005",
    "sender_name": "PT Maju Jaya",
    "origin": "Surabaya",
    "destination": "Jakarta",
    "driver_id": 1,
    "status": "Menunggu"
  }'
```

**Response:**
```json
{
  "id": 5,
  "tracking_number": "ORD-005",
  "sender_name": "PT Maju Jaya",
  "origin": "Surabaya",
  "destination": "Jakarta",
  "status": "Menunggu",
  "created_at": "2026-05-09T10:00:00.000Z"
}
```

### Tracking

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `PUT` | `/api/tracking/:id` | Update posisi & status tracking |
| `GET` | `/api/tracking/:id` | Riwayat tracking pengiriman |

#### Contoh: Update Tracking

**Request:**
```bash
curl -X PUT http://localhost:3000/api/tracking/5 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Dalam Perjalanan",
    "location": "Klaten",
    "latitude": -7.7156,
    "longitude": 110.6122
  }'
```

**Response:**
```json
{
  "message": "Tracking updated",
  "tracking": {
    "id": 5,
    "status": "Dalam Perjalanan",
    "location": "Klaten",
    "updated_at": "2026-05-09T10:15:00.000Z"
  }
}
```

---

## ⛽ Harga BBM (Admin Dashboard)

Harga BBM (Bio Solar, Pertalite, Pertamax) diatur oleh **admin via dashboard web**. Aplikasi Flutter akan mengambil harga terbaru dari backend saat form order dibuka.

### Daftar Harga Default

| Jenis BBM | Harga Default |
|-----------|---------------|
| Bio Solar / Pertamina Dex | Rp 6.800/liter |
| Solar Industri | Rp 7.200/liter |

### Cara Update Harga BBM

1. Buka **Admin Dashboard** (`admin.html`)
2. Klik menu **⛽ Harga BBM**
3. Edit harga → klik **Update**
4. Harga tersimpan di database backend
5. Aplikasi Flutter otomatis ambil harga terbaru saat buka form order baru

### API Endpoint

```
GET    /api/uang-jalan/fuel-prices          → List semua harga BBM
GET    /api/uang-jalan/fuel-prices/BIOSOLAR → Detail harga Bio Solar
PUT    /api/uang-jalan/fuel-prices/BIOSOLAR → Update harga Bio Solar
```

---

## 🛣️ Roadmap

- [x] Harga BBM via Admin Dashboard
- [ ] Push Notification
- [ ] Export laporan ke PDF/Excel
- [ ] Multi-role autentikasi (Admin, Sopir, Customer)
- [ ] Integrasi Midtrans untuk pembayaran digital
- [ ] Optimasi peta dengan rute terbaik (OSRM)

---

## 📝 License

MIT License

---

## 👤 Author

Dibuat untuk memenuhi kebutuhan otomasi internal usaha ekspedisi.

---

<p align="center">
  <b>⭐ Star repo ini kalau projectnya bermanfaat!</b>
</p>
