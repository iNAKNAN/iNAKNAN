-- Schema Database Tracking Pengiriman TrukJatim

-- Tabel Shipments (Data Pengiriman)
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    pengirim TEXT NOT NULL,
    wa TEXT,
    barang TEXT,
    asal TEXT NOT NULL,
    tujuan TEXT NOT NULL,
    armada TEXT,
    nopol TEXT,
    driver TEXT,
    status TEXT DEFAULT 'loading' CHECK (status IN ('loading', 'pickup', 'on-the-way', 'delivered')),
    lokasi TEXT,
    lat REAL DEFAULT -7.2575,
    lng REAL DEFAULT 112.7521,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    eta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Shipment History (Timeline)
CREATE TABLE IF NOT EXISTS shipment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id TEXT NOT NULL,
    label TEXT NOT NULL,
    time TEXT,
    done INTEGER DEFAULT 0,
    active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_history_shipment ON shipment_history(shipment_id);

-- Trigger untuk update timestamp
CREATE TRIGGER IF NOT EXISTS update_shipment_timestamp 
AFTER UPDATE ON shipments
BEGIN
    UPDATE shipments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
