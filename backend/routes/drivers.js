const express = require('express');
const router = express.Router();
const db = require('../database/db-mvp');

// GET /api/drivers - List semua drivers
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const drivers = await db.getAllDrivers(status);
    res.json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data sopir'
    });
  }
});

// GET /api/drivers/available - List drivers yang tersedia (tidak sedang bertugas)
router.get('/available/list', async (req, res) => {
  try {
    const drivers = await db.getAvailableDrivers();
    res.json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data sopir tersedia'
    });
  }
});

// GET /api/drivers/:id - Get single driver
router.get('/:id', async (req, res) => {
  try {
    const driver = await db.getDriver(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Sopir tidak ditemukan'
      });
    }
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data sopir'
    });
  }
});

// POST /api/drivers - Create driver
router.post('/', async (req, res) => {
  try {
    const { nama, telepon, nopol_truck, armada } = req.body;

    if (!nama) {
      return res.status(400).json({
        success: false,
        error: 'Nama sopir wajib diisi'
      });
    }

    const newDriver = await db.createDriver({
      nama,
      telepon: telepon || '',
      nopol_truck: nopol_truck || '',
      armada: armada || 'CDD'
    });

    res.status(201).json({
      success: true,
      message: 'Sopir berhasil ditambahkan',
      data: newDriver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menambahkan sopir'
    });
  }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getDriver(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Sopir tidak ditemukan'
      });
    }

    const updated = await db.updateDriver(id, req.body);
    res.json({
      success: true,
      message: 'Sopir berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate sopir'
    });
  }
});

// DELETE /api/drivers/:id - Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteDriver(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Sopir tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Sopir berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus sopir'
    });
  }
});

// ==================== DRIVER LOGS ====================

// GET /api/drivers/logs/all - Get all driver logs
router.get('/logs/all', async (req, res) => {
  try {
    const { order_id } = req.query;
    const logs = await db.getDriverLogs(order_id);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching driver logs:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil log sopir'
    });
  }
});

// POST /api/drivers/logs - Create driver log (update dari sopir)
router.post('/logs', async (req, res) => {
  try {
    const { order_id, driver_id, driver_nama, status_update, foto_url, catatan } = req.body;

    if (!order_id || !driver_nama || !status_update) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, nama driver, dan status update wajib diisi'
      });
    }

    // Validate status_update
    const validStatuses = ['MUAT', 'JALAN', 'SAMPAI', 'BONGKAR'];
    if (!validStatuses.includes(status_update)) {
      return res.status(400).json({
        success: false,
        error: 'Status update tidak valid. Pilihan: MUAT, JALAN, SAMPAI, BONGKAR'
      });
    }

    const updatedOrder = await db.createDriverLog({
      order_id: order_id.toUpperCase(),
      driver_id,
      driver_nama,
      status_update,
      foto_url: foto_url || '',
      catatan: catatan || ''
    });

    res.status(201).json({
      success: true,
      message: 'Update berhasil disimpan',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error creating driver log:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menyimpan update'
    });
  }
});

module.exports = router;
