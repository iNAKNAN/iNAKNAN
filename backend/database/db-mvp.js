const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'mvp.db');
const SCHEMA_PATH = path.join(__dirname, 'schema-mvp.sql');

class DatabaseMVP {
  constructor() {
    // Ensure uploads directory exists
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error membuka database:', err);
      } else {
        console.log('✅ Terhubung ke database MVP');
        this.initSchema();
      }
    });

    this.db.run('PRAGMA foreign_keys = ON');
  }

  // Initialize schema
  initSchema() {
    try {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing schema:', err);
        } else {
          console.log('✅ Schema database siap');
        }
      });
    } catch (error) {
      console.error('Error reading schema file:', error);
    }
  }

  // Helper methods
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
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
    return await this.getCustomer(result.id);
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
    return await this.getDriver(result.id);
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

    // Get order history
    const history = await this.query(
      'SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );

    // Get driver logs
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
    // Calculate total uang jalan
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

    // Log initial status
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

    // Calculate total uang jalan if relevant fields changed
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

    // Update order status
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
    // Orders that are SELESAI and have POD
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

    const todayOrders = await this.get(`
      SELECT COUNT(*) as count FROM orders WHERE date(tanggal) = date('now')
    `);

    const activeDrivers = await this.get(`
      SELECT COUNT(DISTINCT driver_id) as count 
      FROM orders 
      WHERE status IN ('DIJADWALKAN', 'MUAT', 'JALAN', 'BONGKAR')
    `);

    return {
      orders: orderStats,
      billing: billingStats,
      today_orders: todayOrders.count,
      active_drivers: activeDrivers.count
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
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new DatabaseMVP();
