const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/shipments - List semua shipments
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const shipments = await db.getAllShipments({ status, search });
    res.json({
      success: true,
      count: shipments.length,
      data: shipments
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pengiriman'
    });
  }
});

// GET /api/shipments/stats - Get statistik
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
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

// GET /api/shipments/:id - Get single shipment
router.get('/:id', async (req, res) => {
  try {
    const shipment = await db.getShipment(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Pengiriman tidak ditemukan'
      });
    }
    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pengiriman'
    });
  }
});

// POST /api/shipments - Create shipment
router.post('/', async (req, res) => {
  try {
    const {
      id, pengirim, wa, barang, asal, tujuan,
      armada, nopol, driver, status, lokasi,
      lat, lng, progress, eta, history
    } = req.body;

    // Validasi required fields
    if (!id || !pengirim || !asal || !tujuan) {
      return res.status(400).json({
        success: false,
        error: 'Nomor resi, pengirim, asal, dan tujuan wajib diisi'
      });
    }

    // Check if ID already exists
    const existing = await db.getShipment(id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Nomor resi sudah digunakan'
      });
    }

    const newShipment = await db.createShipment({
      id: id.toUpperCase(),
      pengirim,
      wa: wa || '',
      barang: barang || '',
      asal,
      tujuan,
      armada: armada || 'CDD',
      nopol: nopol || '',
      driver: driver || '',
      status: status || 'loading',
      lokasi: lokasi || `${asal} - Pool`,
      lat: lat || -7.2575,
      lng: lng || 112.7521,
      progress: progress || 0,
      eta: eta || 'Belum ditentukan',
      history: history || generateDefaultHistory(status || 'loading', asal, tujuan)
    });

    res.status(201).json({
      success: true,
      message: 'Pengiriman berhasil dibuat',
      data: newShipment
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat pengiriman: ' + error.message
    });
  }
});

// PUT /api/shipments/:id - Update shipment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getShipment(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Pengiriman tidak ditemukan'
      });
    }

    const updated = await db.updateShipment(id, req.body);
    res.json({
      success: true,
      message: 'Pengiriman berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate pengiriman'
    });
  }
});

// PATCH /api/shipments/:id/position - Update posisi (GPS)
router.patch('/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, lokasi, progress } = req.body;

    const existing = await db.getShipment(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Pengiriman tidak ditemukan'
      });
    }

    const updated = await db.updatePosition(id, { lat, lng, lokasi, progress });
    res.json({
      success: true,
      message: 'Posisi berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate posisi'
    });
  }
});

// DELETE /api/shipments/:id - Delete shipment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteShipment(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Pengiriman tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Pengiriman berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus pengiriman'
    });
  }
});

// Helper function untuk generate default history
function generateDefaultHistory(status, asal, tujuan) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  
  const steps = [
    { label: 'Order Diterima', time: timeStr, done: true, active: false },
    { label: 'Proses Muat Barang', time: status === 'loading' ? timeStr + ' – sekarang' : timeStr, done: status !== 'loading', active: status === 'loading' },
    { label: `Berangkat dari ${asal}`, time: status === 'on-the-way' || status === 'delivered' ? timeStr : '—', done: status === 'on-the-way' || status === 'delivered', active: false },
    { label: 'Dalam Perjalanan', time: status === 'on-the-way' ? timeStr + ' – sekarang' : '—', done: status === 'on-the-way' || status === 'delivered', active: status === 'on-the-way' },
    { label: `Tiba di ${tujuan}`, time: status === 'delivered' ? timeStr + ' ✅' : 'Estimasi –', done: status === 'delivered', active: false },
  ];
  
  return steps;
}

module.exports = router;
