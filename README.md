# 🚛 TrukJatim — Sistem Otomasi Ekspedisi

> **Aplikasi manajemen pengiriman & tracking real-time** untuk usaha ekspedisi. Tersedia dalam versi **Mobile App (Flutter)** dan **Dashboard Web** dengan backend REST API yang solid.

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

### 1. Clone Repository

```bash
git clone https://github.com/guramaipedas-prog/iHandPump.git
cd iHandPump
```

### 2. Jalankan Backend

```bash
cd backend
npm install

# Init database (SQLite)
npm run init-db

# Start server
cd ..
npm run dev
```
Server berjalan di `http://localhost:3000`

### 3. Jalankan Mobile App

```bash
cd ekspedisi_app
flutter pub get
flutter run
```

### 4. Buka Web Dashboard

- **Tracking Customer:** Buka `tracking_online.html` di browser
- **Admin Dashboard:** Buka `admin.html` di browser

---

## 📱 Download APK

| Platform | File |
|----------|------|
| Android | [**Download APK**](https://github.com/guramaipedas-prog/iHandPump/releases/download/v1.0.0/ekspedisi-app-release.apk) |

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
  <img src="screenshots/dashboard.jpeg" width="280" />
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
  <a href="https://youtube.com/shorts/QXYaPUxnELk?feature=share" target="_blank">
    <img src="https://img.youtube.com/vi/QXYaPUxnELk/0.jpg" width="360" alt="TrukJatim Demo Video" />
  </a>
</p>

<p align="center">
  <a href="https://youtube.com/shorts/QXYaPUxnELk?feature=share">▶️ Tonton di YouTube</a>
</p>

---

## 📡 API Endpoints (Contoh)

```
GET    /api/shipments          → List semua pengiriman
POST   /api/shipments          → Buat pengiriman baru
GET    /api/shipments/:id      → Detail pengiriman
PUT    /api/tracking/:id       → Update posisi tracking
GET    /api/tracking/:id       → Riwayat tracking
```

*Dokumentasi lengkap API tersedia di folder `backend/README.md`*

---

## 🛣️ Roadmap

- [ ] Push Notification (Firebase Cloud Messaging)
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
