-- =====================================================
-- MVP Schema Database - Automasi Internal Usaha Ekspedisi
-- =====================================================

-- Tabel Customers (Data Pelanggan)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    telepon TEXT,
    alamat TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Drivers (Data Sopir)
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    telepon TEXT,
    nopol_truck TEXT,
    armada TEXT,
    status TEXT DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'OFF', 'LIBUR')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Orders (Data Order/Pengiriman)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER,
    customer_nama TEXT NOT NULL,
    titik_a TEXT NOT NULL,           -- Titik Muat
    titik_b TEXT NOT NULL,           -- Titik Bongkar
    jenis_barang TEXT,
    driver_id INTEGER,
    driver_nama TEXT,
    
    -- Status Order
    status TEXT DEFAULT 'MENUNGGU' CHECK (status IN (
        'MENUNGGU',      -- Order masuk, belum diassign
        'DIJADWALKAN',   -- Sudah dijadwalkan, assign driver
        'MUAT',          -- Sedang proses muat
        'JALAN',         -- Dalam perjalanan
        'BONGKAR',       -- Sedang proses bongkar
        'SELESAI'        -- Pengiriman selesai
    )),
    
    -- Uang Jalan
    jarak_km REAL DEFAULT 0,
    konsumsi_bbm REAL DEFAULT 0,      -- km/liter
    harga_bbm REAL DEFAULT 0,         -- per liter
    biaya_tol REAL DEFAULT 0,
    biaya_makan REAL DEFAULT 0,
    total_uang_jalan REAL DEFAULT 0,
    
    -- POD (Proof of Delivery)
    pod_surat_jalan TEXT,             -- Link foto surat jalan
    pod_barang_sampai TEXT,           -- Link foto barang sampai
    pod_notes TEXT,
    pod_uploaded_at DATETIME,
    
    -- Tagihan
    nilai_tagihan REAL DEFAULT 0,
    status_tagihan TEXT DEFAULT 'BELUM' CHECK (status_tagihan IN ('BELUM', 'LUNAS')),
    tanggal_lunas DATETIME,
    
    -- Tracking
    lokasi_terakhir TEXT,
    lat_a REAL DEFAULT -7.2575,
    lng_a REAL DEFAULT 112.7521,
    lat REAL DEFAULT -7.2575,
    lng REAL DEFAULT 112.7521,
    nopol_truck TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- Tabel Driver Logs (Riwayat Update Sopir)
CREATE TABLE IF NOT EXISTS driver_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    driver_id INTEGER,
    driver_nama TEXT NOT NULL,
    status_update TEXT NOT NULL CHECK (status_update IN ('MUAT', 'JALAN', 'SAMPAI', 'BONGKAR')),
    foto_url TEXT,                    -- Link foto upload
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- Tabel Order History (Timeline Order)
CREATE TABLE IF NOT EXISTS order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    keterangan TEXT,
    created_by TEXT,                  -- 'SYSTEM' atau nama admin/driver
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabel Uang Jalan Template (Template perhitungan untuk rute tertentu)
CREATE TABLE IF NOT EXISTS uang_jalan_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_rute TEXT NOT NULL,          -- Contoh: "Surabaya - Jakarta"
    titik_a TEXT NOT NULL,
    titik_b TEXT NOT NULL,
    jarak_km REAL DEFAULT 0,
    konsumsi_bbm REAL DEFAULT 0,
    harga_bbm REAL DEFAULT 0,
    biaya_tol REAL DEFAULT 0,
    biaya_makan REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_tagihan ON orders(status_tagihan);
CREATE INDEX IF NOT EXISTS idx_orders_tanggal ON orders(tanggal);
CREATE INDEX IF NOT EXISTS idx_driver_logs_order ON driver_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id);

-- Trigger untuk update timestamp orders
CREATE TRIGGER IF NOT EXISTS update_order_timestamp 
AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Tabel Fuel Prices (Harga BBM)
CREATE TABLE IF NOT EXISTS fuel_prices (
    jenis TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    harga REAL NOT NULL DEFAULT 0,
    satuan TEXT DEFAULT 'liter',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default fuel prices
INSERT OR IGNORE INTO fuel_prices (jenis, nama, harga, satuan) VALUES 
('BIOSOLAR', 'Pertamina Dex / Bio Solar', 6800, 'liter'),
('SOLAR', 'Solar Industri', 7200, 'liter');

-- Trigger untuk auto-log perubahan status
CREATE TRIGGER IF NOT EXISTS log_order_status_change
AFTER UPDATE OF status ON orders
WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO order_history (order_id, status, keterangan, created_by)
    VALUES (
        NEW.id, 
        NEW.status, 
        'Status berubah dari ' || OLD.status || ' ke ' || NEW.status,
        'SYSTEM'
    );
END;

-- Insert sample data untuk testing
-- Sample Drivers
INSERT OR IGNORE INTO drivers (id, nama, telepon, nopol_truck, armada, status) VALUES 
(1, 'Budi Santoso', '081234567890', 'L 1234 XY', 'CDD', 'AKTIF'),
(2, 'Ahmad Yani', '081234567891', 'L 5678 AB', 'CDE', 'AKTIF'),
(3, 'Slamet Riyadi', '081234567892', 'L 9012 CD', 'CDD', 'AKTIF');

-- Sample Customers
INSERT OR IGNORE INTO customers (id, nama, telepon, alamat) VALUES 
(1, 'PT Maju Jaya', '031-1234567', 'Jl. Raya Surabaya No. 1'),
(2, 'CV Sukses Abadi', '031-7654321', 'Jl. Raya Malang No. 5'),
(3, 'Toko Sejahtera', '081333444555', 'Jl. Raya Sidoarjo No. 10');

-- Sample Uang Jalan Templates
INSERT OR IGNORE INTO uang_jalan_templates (id, nama_rute, titik_a, titik_b, jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan) VALUES 
(1, 'Surabaya - Jakarta', 'Surabaya', 'Jakarta', 800, 5, 10000, 350000, 150000),
(2, 'Surabaya - Bandung', 'Surabaya', 'Bandung', 750, 5, 10000, 300000, 150000),
(3, 'Surabaya - Malang', 'Surabaya', 'Malang', 100, 5, 10000, 50000, 50000),
(4, 'Surabaya - Denpasar', 'Surabaya', 'Denpasar', 450, 5, 10000, 200000, 100000);

-- Sample Orders
INSERT OR IGNORE INTO orders (
    id, tanggal, customer_id, customer_nama, titik_a, titik_b, jenis_barang,
    driver_id, driver_nama, status, jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan,
    total_uang_jalan, nilai_tagihan, status_tagihan, lokasi_terakhir
) VALUES 
(
    'ORD-001', datetime('now', '-2 days'), 1, 'PT Maju Jaya', 'Surabaya', 'Jakarta', 'Elektronik',
    1, 'Budi Santoso', 'SELESAI', 800, 5, 10000, 350000, 150000,
    1950000, 5000000, 'BELUM', 'Jakarta'
),
(
    'ORD-002', datetime('now', '-1 day'), 2, 'CV Sukses Abadi', 'Surabaya', 'Bandung', 'Textile',
    2, 'Ahmad Yani', 'JALAN', 750, 5, 10000, 300000, 150000,
    1800000, 4500000, 'BELUM', 'Cirebon'
),
(
    'ORD-003', datetime('now'), 3, 'Toko Sejahtera', 'Surabaya', 'Malang', 'Semen',
    3, 'Slamet Riyadi', 'MUAT', 100, 5, 10000, 50000, 50000,
    250000, 1200000, 'BELUM', 'Surabaya'
),
(
    'ORD-004', datetime('now'), 1, 'PT Maju Jaya', 'Surabaya', 'Denpasar', 'Plastik',
    NULL, NULL, 'MENUNGGU', 450, 5, 10000, 200000, 100000,
    1100000, 3500000, 'BELUM', NULL
);
