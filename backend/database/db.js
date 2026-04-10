const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Use Railway PostgreSQL or local SQLite
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql');

let pool;
let sqlite3;
let db;

if (usePostgres) {
  // PostgreSQL for Railway
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Railway
    }
  });
  console.log('✅ Using PostgreSQL database');
} else {
  // SQLite for local development
  sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const DB_PATH = path.join(__dirname, 'tracking.db');
  
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });
  
  db.run('PRAGMA foreign_keys = ON');
}

class Database {
  constructor() {
    this.isPostgres = usePostgres;
  }

  // Helper for PostgreSQL
  async queryPostgres(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
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
      const result = await client.query(sql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  }

  // Helper for SQLite (existing methods)
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Initialize PostgreSQL tables
  async initPostgresTables() {
    const client = await pool.connect();
    try {
      await client.query(`
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
          status TEXT DEFAULT 'loading',
          lokasi TEXT,
          lat REAL DEFAULT -7.2575,
          lng REAL DEFAULT 112.7521,
          progress INTEGER DEFAULT 0,
          eta TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS shipment_history (
          id SERIAL PRIMARY KEY,
          shipment_id TEXT NOT NULL,
          label TEXT NOT NULL,
          time TEXT,
          done INTEGER DEFAULT 0,
          active INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ PostgreSQL tables initialized');
    } finally {
      client.release();
    }
  }

  // Initialize SQLite tables
  async initSQLiteTables() {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ SQLite tables initialized');
    }
  }

  // Initialize tables
  async initTables() {
    if (this.isPostgres) {
      await this.initPostgresTables();
    } else {
      await this.initSQLiteTables();
    }
  }

  // ==================== SHIPMENT METHODS ====================

  async getAllShipments(filters = {}) {
    if (this.isPostgres) {
      let sql = 'SELECT * FROM shipments';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = $' + (params.length + 1));
        params.push(filters.status);
      }

      if (filters.search) {
        conditions.push('(id ILIKE $' + (params.length + 1) + ' OR pengirim ILIKE $' + (params.length + 2) + ' OR nopol ILIKE $' + (params.length + 3) + ')');
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';
      return await this.queryPostgres(sql, params);
    } else {
      // SQLite
      let sql = 'SELECT * FROM shipments';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.search) {
        conditions.push('(id LIKE ? OR pengirim LIKE ? OR nopol LIKE ?)');
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';
      return await this.query(sql, params);
    }
  }

  async getShipment(id) {
    if (this.isPostgres) {
      const shipment = await this.getPostgres('SELECT * FROM shipments WHERE id = $1', [id]);
      if (!shipment) return null;

      const history = await this.queryPostgres(
        'SELECT * FROM shipment_history WHERE shipment_id = $1 ORDER BY id ASC',
        [id]
      );

      return { ...shipment, history };
    } else {
      // SQLite
      const shipment = await this.get('SELECT * FROM shipments WHERE id = ?', [id]);
      if (!shipment) return null;

      const history = await this.query(
        'SELECT * FROM shipment_history WHERE shipment_id = ? ORDER BY id ASC',
        [id]
      );

      return { ...shipment, history };
    }
  }

  async createShipment(data) {
    const {
      id, pengirim, wa, barang, asal, tujuan,
      armada, nopol, driver, status, lokasi,
      lat, lng, progress, eta, history
    } = data;

    if (this.isPostgres) {
      await this.runPostgres(`
        INSERT INTO shipments 
        (id, pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [id, pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta]);

      // Insert history
      if (history && history.length > 0) {
        for (const h of history) {
          await this.runPostgres(`
            INSERT INTO shipment_history (shipment_id, label, time, done, active)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, h.label, h.time, h.done ? 1 : 0, h.active ? 1 : 0]);
        }
      }

      return await this.getShipment(id);
    } else {
      // SQLite
      await this.run(`
        INSERT INTO shipments 
        (id, pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta]);

      if (history && history.length > 0) {
        for (const h of history) {
          await this.run(`
            INSERT INTO shipment_history (shipment_id, label, time, done, active)
            VALUES (?, ?, ?, ?, ?)
          `, [id, h.label, h.time, h.done ? 1 : 0, h.active ? 1 : 0]);
        }
      }

      return await this.getShipment(id);
    }
  }

  async updateShipment(id, data) {
    const {
      pengirim, wa, barang, asal, tujuan,
      armada, nopol, driver, status, lokasi,
      lat, lng, progress, eta
    } = data;

    if (this.isPostgres) {
      await this.runPostgres(`
        UPDATE shipments SET
          pengirim = $1, wa = $2, barang = $3, asal = $4, tujuan = $5,
          armada = $6, nopol = $7, driver = $8, status = $9, lokasi = $10,
          lat = $11, lng = $12, progress = $13, eta = $14
        WHERE id = $15
      `, [pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta, id]);

      return await this.getShipment(id);
    } else {
      await this.run(`
        UPDATE shipments SET
          pengirim = ?, wa = ?, barang = ?, asal = ?, tujuan = ?,
          armada = ?, nopol = ?, driver = ?, status = ?, lokasi = ?,
          lat = ?, lng = ?, progress = ?, eta = ?
        WHERE id = ?
      `, [pengirim, wa, barang, asal, tujuan, armada, nopol, driver, status, lokasi, lat, lng, progress, eta, id]);

      return await this.getShipment(id);
    }
  }

  async deleteShipment(id) {
    if (this.isPostgres) {
      const result = await this.runPostgres('DELETE FROM shipments WHERE id = $1', [id]);
      return result.changes > 0;
    } else {
      const result = await this.run('DELETE FROM shipments WHERE id = ?', [id]);
      return result.changes > 0;
    }
  }

  async getStats() {
    if (this.isPostgres) {
      return await this.getPostgres(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'on-the-way' THEN 1 ELSE 0 END) as jalan,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as selesai,
          SUM(CASE WHEN status IN ('loading', 'pickup') THEN 1 ELSE 0 END) as muat
        FROM shipments
      `);
    } else {
      return await this.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'on-the-way' THEN 1 ELSE 0 END) as jalan,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as selesai,
          SUM(CASE WHEN status IN ('loading', 'pickup') THEN 1 ELSE 0 END) as muat
        FROM shipments
      `);
    }
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

// Create singleton instance
const database = new Database();

// Initialize tables on startup
database.initTables().catch(console.error);

module.exports = database;
