const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'tracking.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Baca schema SQL
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Buat/connect database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error membuka database:', err);
    process.exit(1);
  }
  console.log('✅ Terhubung ke database SQLite');
});

// Jalankan schema
db.exec(schema, (err) => {
  if (err) {
    console.error('Error membuat tabel:', err);
    db.close();
    process.exit(1);
  }
  console.log('✅ Schema database berhasil dibuat');
  
  // Insert data sample
  insertSampleData();
});

function insertSampleData() {
  const sampleData = [
    {
      id: 'TJ-2024-001',
      pengirim: 'Budi Widodo',
      wa: '08123456789',
      barang: 'Furniture & Elektronik',
      asal: 'Surabaya',
      tujuan: 'Malang',
      armada: 'CDD',
      nopol: 'L 4821 GH',
      driver: 'Slamet Riyadi',
      status: 'on-the-way',
      lokasi: 'Tol Surabaya-Malang, KM 45',
      lat: -7.536,
      lng: 112.238,
      progress: 55,
      eta: '±1,5 jam lagi',
      history: [
        { label: 'Order Diterima', time: '07:00 WIB', done: 1, active: 0 },
        { label: 'Proses Muat Barang', time: '08:30 WIB', done: 1, active: 0 },
        { label: 'Berangkat dari Surabaya', time: '10:00 WIB', done: 1, active: 0 },
        { label: 'Dalam Perjalanan', time: '10:05 WIB – sekarang', done: 1, active: 1 },
        { label: 'Tiba di Malang', time: 'Estimasi 14:00 WIB', done: 0, active: 0 },
      ]
    },
    {
      id: 'TJ-2024-002',
      pengirim: 'PT Maju Bersama',
      wa: '08129876543',
      barang: 'Material Bangunan',
      asal: 'Gresik',
      tujuan: 'Banyuwangi',
      armada: 'Tronton',
      nopol: 'W 8812 KL',
      driver: 'Agus Setiawan',
      status: 'on-the-way',
      lokasi: 'Jl. Raya Probolinggo KM 12',
      lat: -7.755,
      lng: 113.215,
      progress: 72,
      eta: '±3 jam lagi',
      history: [
        { label: 'Order Diterima', time: '06:00 WIB', done: 1, active: 0 },
        { label: 'Proses Muat Barang', time: '07:00 WIB', done: 1, active: 0 },
        { label: 'Berangkat dari Gresik', time: '08:30 WIB', done: 1, active: 0 },
        { label: 'Dalam Perjalanan', time: '08:35 WIB – sekarang', done: 1, active: 1 },
        { label: 'Tiba di Banyuwangi', time: 'Estimasi 17:00 WIB', done: 0, active: 0 },
      ]
    },
    {
      id: 'TJ-2024-003',
      pengirim: 'Dewi Nurhayati',
      wa: '08127654321',
      barang: 'Paket Online Shop',
      asal: 'Sidoarjo',
      tujuan: 'Kediri',
      armada: 'Pickup',
      nopol: 'W 2234 AB',
      driver: 'Hendra Gunawan',
      status: 'delivered',
      lokasi: 'Gudang Kediri — Sudah Tiba',
      lat: -7.816,
      lng: 112.011,
      progress: 100,
      eta: 'Sudah tiba',
      history: [
        { label: 'Order Diterima', time: '05:30 WIB', done: 1, active: 0 },
        { label: 'Proses Muat Barang', time: '06:30 WIB', done: 1, active: 0 },
        { label: 'Berangkat dari Sidoarjo', time: '07:00 WIB', done: 1, active: 0 },
        { label: 'Dalam Perjalanan', time: '07:05 – 10:30 WIB', done: 1, active: 0 },
        { label: 'Tiba di Kediri', time: '10:30 WIB ✅', done: 1, active: 0 },
      ]
    },
    {
      id: 'TJ-2024-004',
      pengirim: 'CV Sejahtera Makmur',
      wa: '081298765432',
      barang: 'Mesin Produksi',
      asal: 'Surabaya',
      tujuan: 'Pasuruan',
      armada: 'Fuso',
      nopol: 'L 9901 MN',
      driver: 'Rizal Fauzi',
      status: 'loading',
      lokasi: 'Pool Armada Margomulyo, Surabaya',
      lat: -7.257,
      lng: 112.752,
      progress: 5,
      eta: 'Belum berangkat',
      history: [
        { label: 'Order Diterima', time: '08:00 WIB', done: 1, active: 0 },
        { label: 'Proses Muat Barang', time: '10:00 WIB – sekarang', done: 1, active: 1 },
        { label: 'Berangkat dari Surabaya', time: 'Estimasi 12:00 WIB', done: 0, active: 0 },
        { label: 'Dalam Perjalanan', time: '—', done: 0, active: 0 },
        { label: 'Tiba di Pasuruan', time: 'Estimasi 14:00 WIB', done: 0, active: 0 },
      ]
    },
    {
      id: 'TJ-2024-005',
      pengirim: 'Ahmad Hasan',
      wa: '08111234567',
      barang: 'Barang Elektronik',
      asal: 'Malang',
      tujuan: 'Jember',
      armada: 'CDD',
      nopol: 'N 5543 PQ',
      driver: 'Yanto Prasetyo',
      status: 'on-the-way',
      lokasi: 'Jl. Raya Lumajang KM 8',
      lat: -8.132,
      lng: 113.215,
      progress: 65,
      eta: '±2 jam lagi',
      history: [
        { label: 'Order Diterima', time: '06:30 WIB', done: 1, active: 0 },
        { label: 'Proses Muat Barang', time: '07:30 WIB', done: 1, active: 0 },
        { label: 'Berangkat dari Malang', time: '09:00 WIB', done: 1, active: 0 },
        { label: 'Dalam Perjalanan', time: '09:05 WIB – sekarang', done: 1, active: 1 },
        { label: 'Tiba di Jember', time: 'Estimasi 14:30 WIB', done: 0, active: 0 },
      ]
    }
  ];

  const insertShipment = db.prepare(`
    INSERT OR REPLACE INTO shipments 
    (id, pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO shipment_history (shipment_id, label, time, done, active)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Hapus data lama
  db.run('DELETE FROM shipment_history');
  db.run('DELETE FROM shipments');

  // Insert data baru
  sampleData.forEach((s) => {
    insertShipment.run(
      s.id, s.pengirim, s.wa, s.barang, s.asal, s.tujuan, 
      s.armada, s.nopol, s.driver, s.status, s.lokasi, 
      s.lat, s.lng, s.progress, s.eta
    );

    s.history.forEach((h) => {
      insertHistory.run(s.id, h.label, h.time, h.done, h.active);
    });
  });

  insertShipment.finalize();
  insertHistory.finalize();

  console.log('✅ Data sample berhasil diinsert');
  console.log(`📊 Total shipments: ${sampleData.length}`);
  
  db.close(() => {
    console.log('\n🎉 Database berhasil diinisialisasi!');
    console.log(`📁 Database file: ${DB_PATH}`);
  });
}
