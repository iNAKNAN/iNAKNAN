const express = require('express');
const router = express.Router();
const db = require('../database/db-mvp');
const dbTracking = require('../database/db');

// GET /api/orders/active-for-tracking - Get orders yang belum selesai
router.get('/active-for-tracking', async (req, res) => {
  try {
    // Get all active orders
    const orders = await db.query(`
      SELECT o.*, 
        c.nama as customer_nama,
        c.telepon as customer_telepon,
        d.nama as driver_nama,
        d.telepon as driver_telepon,
        d.nopol_truck
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      WHERE o.status != 'SELESAI'
      ORDER BY o.created_at DESC
    `);
    
    // Get all shipment IDs from tracking database
    let shipmentIds = new Set();
    try {
      const shipments = await dbTracking.getAllShipments();
      shipments.forEach(s => shipmentIds.add(s.id));
    } catch (e) {
      // shipments table might not exist, ignore
    }
    
    // Filter out orders that already have shipments
    const availableOrders = orders.filter(o => !shipmentIds.has(o.id));
    
    res.json({
      success: true,
      count: availableOrders.length,
      data: availableOrders
    });
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data order aktif'
    });
  }
});

// GET /api/orders - List semua orders
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = await db.getAllOrders({ status, search });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data order'
    });
  }
});

// GET /api/orders/stats/dashboard - Get statistik dashboard (with month/year filter)
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { month, year } = req.query;
    const stats = await db.getDashboardStats({ month: month ? parseInt(month) : null, year: year ? parseInt(year) : null });
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik'
    });
  }
});

// GET /api/orders/available-periods - Get list of months/years that have data
router.get('/available-periods', async (req, res) => {
  try {
    const periods = await db.getAvailablePeriods();
    res.json({
      success: true,
      data: periods
    });
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil periode'
    });
  }
});

// GET /api/orders/recent/list - Get recent orders
router.get('/recent/list', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const orders = await db.getRecentOrders(parseInt(limit));
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data order terbaru'
    });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id.toUpperCase());
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data order'
    });
  }
});

// POST /api/orders - Create order
router.post('/', async (req, res) => {
  try {
    const {
      id, customer_id, customer_nama, titik_a, titik_b, jenis_barang,
      driver_id, driver_nama, jarak_km, konsumsi_bbm, harga_bbm,
      biaya_tol, biaya_makan, nilai_tagihan
    } = req.body;

    // Validasi required fields
    if (!id || !customer_nama || !titik_a || !titik_b) {
      return res.status(400).json({
        success: false,
        error: 'Nomor order, nama customer, titik muat, dan titik bongkar wajib diisi'
      });
    }

    // Check if ID already exists
    const existing = await db.getOrder(id.toUpperCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Nomor order sudah digunakan'
      });
    }

    const newOrder = await db.createOrder({
      id: id.toUpperCase(),
      customer_id,
      customer_nama,
      titik_a,
      titik_b,
      jenis_barang: jenis_barang || '',
      driver_id,
      driver_nama,
      jarak_km: jarak_km || 0,
      konsumsi_bbm: konsumsi_bbm || 5,
      harga_bbm: harga_bbm || 10000,
      biaya_tol: biaya_tol || 0,
      biaya_makan: biaya_makan || 0,
      nilai_tagihan: nilai_tagihan || 0,
      lat_a: req.body.lat_a,
      lng_a: req.body.lng_a,
      lat: req.body.lat,
      lng: req.body.lng
    });

    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat order'
    });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getOrder(id.toUpperCase());
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    const updated = await db.updateOrder(id.toUpperCase(), req.body);
    res.json({
      success: true,
      message: 'Order berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate order'
    });
  }
});

// PATCH /api/orders/:id/status - Update status order
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan, updated_by } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status wajib diisi'
      });
    }

    const existing = await db.getOrder(id.toUpperCase());
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    const updated = await db.updateOrderStatus(
      id.toUpperCase(),
      status,
      keterangan || '',
      updated_by || 'SYSTEM'
    );

    res.json({
      success: true,
      message: 'Status order berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate status order'
    });
  }
});

// PATCH /api/orders/:id/assign-driver - Assign driver to order
router.patch('/:id/assign-driver', async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, driver_nama } = req.body;

    if (!driver_id || !driver_nama) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID dan nama wajib diisi'
      });
    }

    const existing = await db.getOrder(id.toUpperCase());
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    const updated = await db.assignDriver(id.toUpperCase(), driver_id, driver_nama);

    res.json({
      success: true,
      message: 'Driver berhasil diassign ke order',
      data: updated
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal assign driver'
    });
  }
});

// PATCH /api/orders/:id/pod - Upload POD
router.patch('/:id/pod', async (req, res) => {
  try {
    const { id } = req.params;
    const { pod_surat_jalan, pod_barang_sampai, pod_notes } = req.body;

    const existing = await db.getOrder(id.toUpperCase());
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    const updated = await db.uploadPOD(id.toUpperCase(), {
      pod_surat_jalan,
      pod_barang_sampai,
      pod_notes
    });

    res.json({
      success: true,
      message: 'POD berhasil diupload',
      data: updated
    });
  } catch (error) {
    console.error('Error uploading POD:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal upload POD'
    });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteOrder(id.toUpperCase());
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Order tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Order berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus order'
    });
  }
});

module.exports = router;
