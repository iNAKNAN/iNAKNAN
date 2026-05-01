const express = require('express');
const router = express.Router();
const db = require('../database/db');
const dbMVP = require('../database/db-mvp');

// GET /api/track/:resi - Track shipment by resi number (legacy + MVP)
router.get('/:resi', async (req, res) => {
  try {
    const { resi } = req.params;
    const resiUpper = resi.toUpperCase();

    // 1. Coba cari di shipments (legacy)
    let shipment = await db.getShipment(resiUpper);

    if (shipment) {
      return res.json({
        success: true,
        data: {
          id: shipment.id,
          pengirim: shipment.pengirim,
          wa: shipment.wa,
          barang: shipment.barang,
          asal: shipment.asal,
          tujuan: shipment.tujuan,
          armada: shipment.armada,
          nopol: shipment.nopol,
          driver: shipment.driver,
          status: shipment.status,
          lokasi: shipment.lokasi,
          lat: shipment.lat,
          lng: shipment.lng,
          progress: shipment.progress,
          eta: shipment.eta,
          history: shipment.history.map(h => ({
            label: h.label,
            time: h.time,
            done: h.done === 1,
            active: h.active === 1
          })),
          updated_at: shipment.updated_at
        }
      });
    }

    // 2. Coba cari di orders (MVP)
    const order = await dbMVP.getOrder(resiUpper);

    if (order) {
      // Map order status ke shipment progress
      const statusProgressMap = {
        'MENUNGGU': { progress: 0, eta: 'Belum dijadwalkan' },
        'DIJADWALKAN': { progress: 10, eta: 'Menunggu muat' },
        'MUAT': { progress: 25, eta: 'Sedang muat barang' },
        'JALAN': { progress: 50, eta: 'Dalam perjalanan' },
        'BONGKAR': { progress: 80, eta: 'Sedang bongkar' },
        'SELESAI': { progress: 100, eta: 'Pengiriman selesai' }
      };

      const sp = statusProgressMap[order.status] || { progress: 0, eta: '-' };

      return res.json({
        success: true,
        data: {
          id: order.id,
          pengirim: order.customer_nama,
          wa: null,
          barang: order.jenis_barang || '-',
          asal: order.titik_a,
          tujuan: order.titik_b,
          armada: null,
          nopol: null,
          driver: order.driver_nama || '-',
          status: order.status.toLowerCase(),
          lokasi: order.lokasi_terakhir || order.titik_a,
          lat_a: order.lat_a || -7.2575,
          lng_a: order.lng_a || 112.7521,
          lat: order.lat || -7.2575,
          lng: order.lng || 112.7521,
          progress: sp.progress,
          eta: sp.eta,
          history: (order.history || []).map(h => ({
            label: h.keterangan || h.status,
            time: h.created_at,
            done: true,
            active: false
          })),
          updated_at: order.updated_at
        }
      });
    }

    // 3. Tidak ditemukan di mana pun
    return res.status(404).json({
      success: false,
      error: 'Resi tidak ditemukan',
      message: 'Pastikan nomor resi benar atau hubungi admin'
    });

  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal melacak pengiriman'
    });
  }
});

// POST /api/track/batch - Track multiple resi (untuk fitur batch tracking)
router.post('/batch', async (req, res) => {
  try {
    const { resi_list } = req.body;
    
    if (!Array.isArray(resi_list) || resi_list.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Daftar resi tidak valid'
      });
    }

    const results = [];
    const notFound = [];

    for (const resi of resi_list) {
      const shipment = await db.getShipment(resi.toUpperCase());
      if (shipment) {
        results.push({
          id: shipment.id,
          pengirim: shipment.pengirim,
          status: shipment.status,
          progress: shipment.progress,
          eta: shipment.eta
        });
      } else {
        notFound.push(resi);
      }
    }

    res.json({
      success: true,
      data: {
        found: results,
        not_found: notFound,
        total: resi_list.length,
        found_count: results.length
      }
    });
  } catch (error) {
    console.error('Error batch tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal melacak pengiriman'
    });
  }
});

// GET /api/track/:resi/position - Get current position only (untuk live tracking)
router.get('/:resi/position', async (req, res) => {
  try {
    const { resi } = req.params;
    const shipment = await db.get('SELECT lat, lng, lokasi, progress, status, updated_at FROM shipments WHERE id = ?', [resi.toUpperCase()]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Resi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: {
        lat: shipment.lat,
        lng: shipment.lng,
        lokasi: shipment.lokasi,
        progress: shipment.progress,
        status: shipment.status,
        updated_at: shipment.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil posisi'
    });
  }
});

module.exports = router;
