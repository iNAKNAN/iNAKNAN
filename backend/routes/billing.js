const express = require('express');
const router = express.Router();
const db = require('../database/db-mvp');

// GET /api/billing - List semua tagihan
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const billings = await db.getBillingList(status);
    res.json({
      success: true,
      count: billings.length,
      data: billings
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data tagihan'
    });
  }
});

// GET /api/billing/ready - List order yang siap ditagih (SELESAI + ada POD)
router.get('/ready/list', async (req, res) => {
  try {
    const orders = await db.getReadyForBilling();
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching ready for billing:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data order siap tagih'
    });
  }
});

// GET /api/billing/stats - Get statistik penagihan
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await db.getBillingStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik penagihan'
    });
  }
});

// PATCH /api/billing/:id/status - Update status tagihan
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['BELUM', 'LUNAS'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status harus BELUM atau LUNAS'
      });
    }

    const updated = await db.updateBillingStatus(id.toUpperCase(), status);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: `Status tagihan berhasil diupdate ke ${status}`,
      data: updated
    });
  } catch (error) {
    console.error('Error updating billing status:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate status tagihan'
    });
  }
});

// GET /api/billing/report - Generate laporan piutang
router.get('/report/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        o.id,
        o.tanggal,
        o.customer_nama,
        o.titik_a,
        o.titik_b,
        o.nilai_tagihan,
        o.status_tagihan,
        o.tanggal_lunas,
        o.pod_surat_jalan,
        o.pod_barang_sampai
      FROM orders o
      WHERE o.status = 'SELESAI'
    `;
    const params = [];

    if (start_date) {
      sql += ' AND date(o.tanggal) >= date(?)';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND date(o.tanggal) <= date(?)';
      params.push(end_date);
    }

    sql += ' ORDER BY o.tanggal DESC';

    const report = await db.query(sql, params);
    const stats = await db.getBillingStats();

    res.json({
      success: true,
      data: {
        summary: stats,
        details: report
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal generate laporan'
    });
  }
});

module.exports = router;
