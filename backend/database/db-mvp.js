const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql');

let pool;
let sqlite3;
let db;

if (usePostgres) {
  // PostgreSQL for Railway
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('✅ MVP Database using PostgreSQL');
} else {
  // SQLite for local development
  sqlite3 = require('sqlite3').verbose();
  const DB_PATH = path.join(__dirname, 'mvp.db');
  
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error membuka database MVP:', err);
    } else {
      console.log('✅ Terhubung ke database MVP (SQLite)');
    }
  });

  db.run('PRAGMA foreign_keys = ON');
}

class DatabaseMVP {
  constructor() {
    this.isPostgres = usePostgres;
    
    // Ensure uploads directory exists
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    // Initialize tables on startup
    this.initTables().catch(console.error);
  }

  // PostgreSQL helpers
  async queryPostgres(sql, params = []) {
    const client = await pool.connect();
    try {
      // Convert ? to $1, $2, etc for PostgreSQL
      let pgSql = sql;
      if (!sql.includes('$1')) {
        let paramIndex = 1;
        pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      }
      const result = await client.query(pgSql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getPostgres(sql, params = []) {
    const rows = await this.queryPostgres(sql, params);
    return rows[0] || null;
  }

  async runPostgres(sql, params = []) {
    const client = await pool.connect();
    try {
      // Convert ? to $1, $2, etc for PostgreSQL
      let pgSql = sql;
      if (!sql.includes('$1')) {
        let paramIndex = 1;
        pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      }
      const result = await client.query(pgSql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  }

  // SQLite helpers
  querySQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  runSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Generic methods that work with both
  async query(sql, params = []) {
    if (this.isPostgres) {
      return await this.queryPostgres(sql, params);
    } else {
      return await this.querySQLite(sql, params);
    }
  }

  async get(sql, params = []) {
    if (this.isPostgres) {
      return await this.getPostgres(sql, params);
    } else {
      return await this.getSQLite(sql, params);
    }
  }

  async run(sql, params = []) {
    if (this.isPostgres) {
      return await this.runPostgres(sql, params);
    } else {
      return await this.runSQLite(sql, params);
    }
  }

  // Initialize tables
  async initTables() {
    try {
      if (this.isPostgres) {
        await this.initPostgresTables();
      } else {
        await this.initSQLiteTables();
      }
    } catch (error) {
      console.error('Error initializing MVP tables:', error);
    }
  }

  async initPostgresTables() {
    const client = await pool.connect();
    try {
      // Customers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          nama VARCHAR(255) NOT NULL,
          telepon VARCHAR(20),
          alamat TEXT,
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Drivers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS drivers (
          id SERIAL PRIMARY KEY,
          nama VARCHAR(255) NOT NULL,
          telepon VARCHAR(20),
          nopol_truck VARCHAR(20),
          armada VARCHAR(50),
          status VARCHAR(20) DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'OFF', 'LIBUR')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(50) PRIMARY KEY,
          tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          customer_nama VARCHAR(255) NOT NULL,
          titik_a VARCHAR(255) NOT NULL,
          titik_b VARCHAR(255) NOT NULL,
          jenis_barang VARCHAR(255),
          driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
          driver_nama VARCHAR(255),
          status VARCHAR(20) DEFAULT 'MENUNGGU' CHECK (status IN ('MENUNGGU', 'DIJADWALKAN', 'MUAT', 'JALAN', 'BONGKAR', 'SELESAI')),
          jarak_km REAL DEFAULT 0,
          konsumsi_bbm REAL DEFAULT 0,
          harga_bbm REAL DEFAULT 0,
          biaya_tol REAL DEFAULT 0,
          biaya_makan REAL DEFAULT 0,
          total_uang_jalan REAL DEFAULT 0,
          pod_surat_jalan TEXT,
          pod_barang_sampai TEXT,
          pod_notes TEXT,
          pod_uploaded_at TIMESTAMP,
          nilai_tagihan REAL DEFAULT 0,
          status_tagihan VARCHAR(20) DEFAULT 'BELUM' CHECK (status_tagihan IN ('BELUM', 'LUNAS')),
          tanggal_lunas TIMESTAMP,
          lokasi_terakhir VARCHAR(255),
          lat REAL DEFAULT -7.2575,
          lng REAL DEFAULT 112.7521,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Driver logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS driver_logs (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
          driver_nama VARCHAR(255) NOT NULL,
          status_update VARCHAR(20) NOT NULL CHECK (status_update IN ('MUAT', 'JALAN', 'SAMPAI', 'BONGKAR')),
          foto_url TEXT,
          catatan TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Order history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS order_history (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL,
          keterangan TEXT,
          created_by VARCHAR(100) DEFAULT 'SYSTEM',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Uang jalan templates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS uang_jalan_templates (
          id SERIAL PRIMARY KEY,
          nama_rute VARCHAR(255) NOT NULL,
          titik_a VARCHAR(255) NOT NULL,
          titik_b VARCHAR(255) NOT NULL,
          jarak_km REAL DEFAULT 0,
          konsumsi_bbm REAL DEFAULT 0,
          harga_bbm REAL DEFAULT 0,
          biaya_tol REAL DEFAULT 0,
          biaya_makan REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert sample data
      await this.insertSampleDataPostgres(client);

      console.log('✅ MVP PostgreSQL tables initialized');
    } finally {
      client.release();
    }
  }

  async insertSampleDataPostgres(client) {
    // Check if data already exists
    const result = await client.query('SELECT COUNT(*) as count FROM drivers');
    if (parseInt(result.rows[0].count) > 0) {
      return; // Data already exists
    }

    // Sample Drivers
    await client.query(`
      INSERT INTO drivers (nama, telepon, nopol_truck, armada, status) VALUES 
      ('Budi Santoso', '081234567890', 'L 1234 XY', 'CDD', 'AKTIF'),
      ('Ahmad Yani', '081234567891', 'L 5678 AB', 'CDE', 'AKTIF'),
      ('Slamet Riyadi', '081234567892', 'L 9012 CD', 'CDD', 'AKTIF')
    `);

    // Sample Customers
    await client.query(`
      INSERT INTO customers (nama, telepon, alamat) VALUES 
      ('PT Maju Jaya', '031-1234567', 'Jl. Raya Surabaya No. 1'),
      ('CV Sukses Abadi', '031-7654321', 'Jl. Raya Malang No. 5'),
      ('Toko Sejahtera', '081333444555', 'Jl. Raya Sidoarjo No. 10')
    `);

    // Sample Templates
    await client.query(`
      INSERT INTO uang_jalan_templates (nama_rute, titik_a, titik_b, jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan) VALUES 
      ('Surabaya - Jakarta', 'Surabaya', 'Jakarta', 800, 5, 10000, 350000, 150000),
      ('Surabaya - Bandung', 'Surabaya', 'Bandung', 750, 5, 10000, 300000, 150000),
      ('Surabaya - Malang', 'Surabaya', 'Malang', 100, 5, 10000, 50000, 50000)
    `);

    // Sample Orders
    await client.query(`
      INSERT INTO orders (
        id, tanggal, customer_id, customer_nama, titik_a, titik_b, jenis_barang,
        driver_id, driver_nama, status, jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan,
        total_uang_jalan, nilai_tagihan, status_tagihan, lokasi_terakhir
      ) VALUES 
      ('ORD-001', NOW() - INTERVAL '2 days', 1, 'PT Maju Jaya', 'Surabaya', 'Jakarta', 'Elektronik',
       1, 'Budi Santoso', 'SELESAI', 800, 5, 10000, 350000, 150000,
       1950000, 5000000, 'BELUM', 'Jakarta'),
      ('ORD-002', NOW() - INTERVAL '1 day', 2, 'CV Sukses Abadi', 'Surabaya', 'Bandung', 'Textile',
       2, 'Ahmad Yani', 'JALAN', 750, 5, 10000, 300000, 150000,
       1800000, 4500000, 'BELUM', 'Cirebon')
    `);

    console.log('✅ Sample MVP data inserted');
  }

  async initSQLiteTables() {
    const SCHEMA_PATH = path.join(__dirname, 'schema-mvp.sql');
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      await new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ MVP SQLite tables initialized');
    }
  }

  // ==================== CUSTOMERS ====================
  async getAllCustomers() {
    return await this.query('SELECT * FROM customers ORDER BY nama ASC');
  }

  async getCustomer(id) {
    return await this.get('SELECT * FROM customers WHERE id = ?', [id]);
  }

  async createCustomer({ nama, telepon, alamat, email }) {
    const result = await this.run(
      'INSERT INTO customers (nama, telepon, alamat, email) VALUES (?, ?, ?, ?)',
      [nama, telepon, alamat, email]
    );
    return await this.getCustomer(result.id || result.lastID);
  }

  async updateCustomer(id, { nama, telepon, alamat, email }) {
    await this.run(
      'UPDATE customers SET nama = ?, telepon = ?, alamat = ?, email = ? WHERE id = ?',
      [nama, telepon, alamat, email, id]
    );
    return await this.getCustomer(id);
  }

  async deleteCustomer(id) {
    const result = await this.run('DELETE FROM customers WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // ==================== DRIVERS ====================
  async getAllDrivers(status = null) {
    let sql = 'SELECT * FROM drivers';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY nama ASC';
    return await this.query(sql, params);
  }

  async getDriver(id) {
    return await this.get('SELECT * FROM drivers WHERE id = ?', [id]);
  }

  async getAvailableDrivers() {
    return await this.query(
      "SELECT * FROM drivers WHERE status = 'AKTIF' AND id NOT IN (SELECT driver_id FROM orders WHERE status IN ('DIJADWALKAN', 'MUAT', 'JALAN', 'BONGKAR') AND driver_id IS NOT NULL) ORDER BY nama ASC"
    );
  }

  async createDriver({ nama, telepon, nopol_truck, armada }) {
    const result = await this.run(
      'INSERT INTO drivers (nama, telepon, nopol_truck, armada) VALUES (?, ?, ?, ?)',
      [nama, telepon, nopol_truck, armada]
    );
    return await this.getDriver(result.id || result.lastID);
  }

  async updateDriver(id, { nama, telepon, nopol_truck, armada, status }) {
    await this.run(
      'UPDATE drivers SET nama = ?, telepon = ?, nopol_truck = ?, armada = ?, status = ? WHERE id = ?',
      [nama, telepon, nopol_truck, armada, status, id]
    );
    return await this.getDriver(id);
  }

  async deleteDriver(id) {
    const result = await this.run('DELETE FROM drivers WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // ==================== ORDERS ====================
  async getAllOrders(filters = {}) {
    let sql = `
      SELECT o.*, 
        c.nama as customer_nama_display,
        c.telepon as customer_telepon
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }

    if (filters.status_tagihan) {
      conditions.push('o.status_tagihan = ?');
      params.push(filters.status_tagihan);
    }

    if (filters.driver_id) {
      conditions.push('o.driver_id = ?');
      params.push(filters.driver_id);
    }

    if (filters.search) {
      conditions.push('(o.id LIKE ? OR o.customer_nama LIKE ? OR o.driver_nama LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY o.created_at DESC';
    return await this.query(sql, params);
  }

  async getOrder(id) {
    const order = await this.get(`
      SELECT o.*, 
        c.nama as customer_nama_display,
        c.telepon as customer_telepon,
        c.alamat as customer_alamat
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (!order) return null;

    const history = await this.query(
      'SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );

    const driverLogs = await this.query(
      'SELECT * FROM driver_logs WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );

    return { ...order, history, driverLogs };
  }

  async createOrder({
    id, customer_id, customer_nama, titik_a, titik_b, jenis_barang,
    driver_id, driver_nama, jarak_km, konsumsi_bbm, harga_bbm,
    biaya_tol, biaya_makan, nilai_tagihan
  }) {
    const bbmNeeded = jarak_km / (konsumsi_bbm || 5);
    const totalUangJalan = (bbmNeeded * (harga_bbm || 10000)) + (biaya_tol || 0) + (biaya_makan || 0);

    await this.run(`
      INSERT INTO orders (
        id, customer_id, customer_nama, titik_a, titik_b, jenis_barang,
        driver_id, driver_nama, status, jarak_km, konsumsi_bbm, harga_bbm,
        biaya_tol, biaya_makan, total_uang_jalan, nilai_tagihan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id.toUpperCase(), customer_id, customer_nama, titik_a, titik_b, jenis_barang,
      driver_id, driver_nama, driver_id ? 'DIJADWALKAN' : 'MENUNGGU',
      jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan,
      totalUangJalan, nilai_tagihan
    ]);

    await this.run(
      'INSERT INTO order_history (order_id, status, keterangan, created_by) VALUES (?, ?, ?, ?)',
      [id.toUpperCase(), driver_id ? 'DIJADWALKAN' : 'MENUNGGU', 'Order dibuat', 'SYSTEM']
    );

    return await this.getOrder(id.toUpperCase());
  }

  async updateOrder(id, data) {
    const {
      customer_id, customer_nama, titik_a, titik_b, jenis_barang,
      driver_id, driver_nama, status, jarak_km, konsumsi_bbm, harga_bbm,
      biaya_tol, biaya_makan, nilai_tagihan, status_tagihan
    } = data;

    let totalUangJalan = null;
    if (jarak_km !== undefined && konsumsi_bbm !== undefined && harga_bbm !== undefined) {
      const bbmNeeded = jarak_km / konsumsi_bbm;
      totalUangJalan = (bbmNeeded * harga_bbm) + (biaya_tol || 0) + (biaya_makan || 0);
    }

    await this.run(`
      UPDATE orders SET
        customer_id = ?, customer_nama = ?, titik_a = ?, titik_b = ?, jenis_barang = ?,
        driver_id = ?, driver_nama = ?, status = COALESCE(?, status),
        jarak_km = COALESCE(?, jarak_km),
        konsumsi_bbm = COALESCE(?, konsumsi_bbm),
        harga_bbm = COALESCE(?, harga_bbm),
        biaya_tol = COALESCE(?, biaya_tol),
        biaya_makan = COALESCE(?, biaya_makan),
        total_uang_jalan = COALESCE(?, total_uang_jalan),
        nilai_tagihan = COALESCE(?, nilai_tagihan),
        status_tagihan = COALESCE(?, status_tagihan)
      WHERE id = ?
    `, [
      customer_id, customer_nama, titik_a, titik_b, jenis_barang,
      driver_id, driver_nama, status, jarak_km, konsumsi_bbm, harga_bbm,
      biaya_tol, biaya_makan, totalUangJalan, nilai_tagihan, status_tagihan, id
    ]);

    return await this.getOrder(id);
  }

  async updateOrderStatus(id, status, keterangan = '', createdBy = 'SYSTEM') {
    await this.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    
    await this.run(
      'INSERT INTO order_history (order_id, status, keterangan, created_by) VALUES (?, ?, ?, ?)',
      [id, status, keterangan, createdBy]
    );

    return await this.getOrder(id);
  }

  async assignDriver(id, driverId, driverNama) {
    await this.run(
      'UPDATE orders SET driver_id = ?, driver_nama = ?, status = ? WHERE id = ?',
      [driverId, driverNama, 'DIJADWALKAN', id]
    );

    await this.run(
      'INSERT INTO order_history (order_id, status, keterangan, created_by) VALUES (?, ?, ?, ?)',
      [id, 'DIJADWALKAN', `Driver ${driverNama} diassign`, 'SYSTEM']
    );

    return await this.getOrder(id);
  }

  async uploadPOD(id, { pod_surat_jalan, pod_barang_sampai, pod_notes }) {
    await this.run(`
      UPDATE orders SET
        pod_surat_jalan = COALESCE(?, pod_surat_jalan),
        pod_barang_sampai = COALESCE(?, pod_barang_sampai),
        pod_notes = ?,
        pod_uploaded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [pod_surat_jalan, pod_barang_sampai, pod_notes, id]);

    return await this.getOrder(id);
  }

  async deleteOrder(id) {
    const result = await this.run('DELETE FROM orders WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // ==================== DRIVER LOGS ====================
  async createDriverLog({ order_id, driver_id, driver_nama, status_update, foto_url, catatan }) {
    await this.run(`
      INSERT INTO driver_logs (order_id, driver_id, driver_nama, status_update, foto_url, catatan)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [order_id, driver_id, driver_nama, status_update, foto_url, catatan]);

    let newStatus = status_update;
    if (status_update === 'SAMPAI') newStatus = 'BONGKAR';
    
    await this.updateOrderStatus(order_id, newStatus, catatan || `Update dari driver: ${status_update}`, driver_nama);

    return await this.getOrder(order_id);
  }

  async getDriverLogs(orderId = null) {
    if (orderId) {
      return await this.query(
        'SELECT * FROM driver_logs WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
      );
    }
    return await this.query('SELECT * FROM driver_logs ORDER BY created_at DESC LIMIT 100');
  }

  // ==================== BILLING ====================
  async getBillingList(status = null) {
    let sql = `
      SELECT o.*, 
        c.nama as customer_nama_display,
        c.telepon as customer_telepon
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.status = 'SELESAI'
    `;
    const params = [];

    if (status) {
      sql += ' AND o.status_tagihan = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.tanggal DESC';
    return await this.query(sql, params);
  }

  async getReadyForBilling() {
    return await this.query(`
      SELECT o.*, 
        c.nama as customer_nama_display,
        c.telepon as customer_telepon
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.status = 'SELESAI' 
        AND (o.pod_surat_jalan IS NOT NULL OR o.pod_barang_sampai IS NOT NULL)
      ORDER BY o.tanggal DESC
    `);
  }

  async updateBillingStatus(id, status) {
    const tanggalLunas = status === 'LUNAS' ? new Date().toISOString() : null;
    
    await this.run(
      'UPDATE orders SET status_tagihan = ?, tanggal_lunas = ? WHERE id = ?',
      [status, tanggalLunas, id]
    );

    return await this.getOrder(id);
  }

  async getBillingStats() {
    return await this.get(`
      SELECT 
        COUNT(*) as total_tagihan,
        SUM(CASE WHEN status_tagihan = 'BELUM' THEN 1 ELSE 0 END) as belum_lunas,
        SUM(CASE WHEN status_tagihan = 'LUNAS' THEN 1 ELSE 0 END) as sudah_lunas,
        SUM(CASE WHEN status_tagihan = 'BELUM' THEN nilai_tagihan ELSE 0 END) as total_piutang,
        SUM(CASE WHEN status_tagihan = 'LUNAS' THEN nilai_tagihan ELSE 0 END) as total_terbayar
      FROM orders
      WHERE status = 'SELESAI'
    `);
  }

  // ==================== UANG JALAN TEMPLATES ====================
  async getAllUangJalanTemplates() {
    return await this.query('SELECT * FROM uang_jalan_templates ORDER BY nama_rute ASC');
  }

  async getUangJalanTemplate(id) {
    return await this.get('SELECT * FROM uang_jalan_templates WHERE id = ?', [id]);
  }

  async calculateUangJalan({ jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan }) {
    const bbmNeeded = jarak_km / (konsumsi_bbm || 5);
    const totalBbm = bbmNeeded * (harga_bbm || 10000);
    const total = totalBbm + (biaya_tol || 0) + (biaya_makan || 0);

    return {
      jarak_km,
      konsumsi_bbm: konsumsi_bbm || 5,
      harga_bbm: harga_bbm || 10000,
      bbm_needed: Math.round(bbmNeeded * 100) / 100,
      total_bbm: Math.round(totalBbm),
      biaya_tol: biaya_tol || 0,
      biaya_makan: biaya_makan || 0,
      total: Math.round(total)
    };
  }

  // ==================== STATS & DASHBOARD ====================
  async getDashboardStats() {
    const orderStats = await this.get(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'MENUNGGU' THEN 1 ELSE 0 END) as menunggu,
        SUM(CASE WHEN status = 'DIJADWALKAN' THEN 1 ELSE 0 END) as dijadwalkan,
        SUM(CASE WHEN status = 'MUAT' THEN 1 ELSE 0 END) as muat,
        SUM(CASE WHEN status = 'JALAN' THEN 1 ELSE 0 END) as jalan,
        SUM(CASE WHEN status = 'BONGKAR' THEN 1 ELSE 0 END) as bongkar,
        SUM(CASE WHEN status = 'SELESAI' THEN 1 ELSE 0 END) as selesai
      FROM orders
    `);

    const billingStats = await this.getBillingStats();

    // PostgreSQL vs SQLite date syntax
    const todayDateSql = this.isPostgres
      ? `SELECT COUNT(*) as count FROM orders WHERE tanggal::date = CURRENT_DATE`
      : `SELECT COUNT(*) as count FROM orders WHERE date(tanggal) = date('now')`;
    const todayOrders = await this.get(todayDateSql);

    const activeDrivers = await this.get(`
      SELECT COUNT(DISTINCT driver_id) as count 
      FROM orders 
      WHERE status IN ('DIJADWALKAN', 'MUAT', 'JALAN', 'BONGKAR')
    `);

    return {
      orders: orderStats,
      billing: billingStats,
      today_orders: todayOrders?.count || 0,
      active_drivers: activeDrivers?.count || 0
    };
  }

  async getRecentOrders(limit = 10) {
    return await this.query(`
      SELECT o.*, c.nama as customer_nama_display
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  // Close connection
  async close() {
    if (this.isPostgres && pool) {
      await pool.end();
    } else if (db) {
      return new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

module.exports = new DatabaseMVP();
