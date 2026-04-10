const express = require('express');
const router = express.Router();
const db = require('../database/db-mvp');

// GET /api/uang-jalan/templates - List semua template
router.get('/templates', async (req, res) => {
  try {
    const templates = await db.getAllUangJalanTemplates();
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil template uang jalan'
    });
  }
});

// GET /api/uang-jalan/templates/:id - Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await db.getUangJalanTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil template'
    });
  }
});

// POST /api/uang-jalan/calculate - Hitung uang jalan
router.post('/calculate', async (req, res) => {
  try {
    const { jarak_km, konsumsi_bbm, harga_bbm, biaya_tol, biaya_makan } = req.body;

    if (!jarak_km) {
      return res.status(400).json({
        success: false,
        error: 'Jarak (km) wajib diisi'
      });
    }

    const calculation = await db.calculateUangJalan({
      jarak_km: parseFloat(jarak_km),
      konsumsi_bbm: parseFloat(konsumsi_bbm) || 5,
      harga_bbm: parseFloat(harga_bbm) || 10000,
      biaya_tol: parseFloat(biaya_tol) || 0,
      biaya_makan: parseFloat(biaya_makan) || 0
    });

    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating uang jalan:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghitung uang jalan'
    });
  }
});

// POST /api/uang-jalan/calculate-by-template - Hitung berdasarkan template
router.post('/calculate-by-template', async (req, res) => {
  try {
    const { template_id } = req.body;

    if (!template_id) {
      return res.status(400).json({
        success: false,
        error: 'Template ID wajib diisi'
      });
    }

    const template = await db.getUangJalanTemplate(template_id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    const calculation = await db.calculateUangJalan({
      jarak_km: template.jarak_km,
      konsumsi_bbm: template.konsumsi_bbm,
      harga_bbm: template.harga_bbm,
      biaya_tol: template.biaya_tol,
      biaya_makan: template.biaya_makan
    });

    res.json({
      success: true,
      data: {
        ...calculation,
        template: {
          id: template.id,
          nama_rute: template.nama_rute,
          titik_a: template.titik_a,
          titik_b: template.titik_b
        }
      }
    });
  } catch (error) {
    console.error('Error calculating by template:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghitung uang jalan dari template'
    });
  }
});

module.exports = router;
