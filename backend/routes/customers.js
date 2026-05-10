const express = require('express');
const router = express.Router();
const db = require('../database/db-mvp');

// GET /api/customers - List semua customers
router.get('/', async (req, res) => {
  try {
    const customers = await db.getAllCustomers();
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data customer'
    });
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await db.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer tidak ditemukan'
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data customer'
    });
  }
});

// POST /api/customers - Create customer
router.post('/', async (req, res) => {
  try {
    const { nama, telepon, alamat } = req.body;

    if (!nama) {
      return res.status(400).json({
        success: false,
        error: 'Nama customer wajib diisi'
      });
    }

    const newCustomer = await db.createCustomer({
      nama,
      telepon: telepon || '',
      alamat: alamat || ''
    });

    res.status(201).json({
      success: true,
      message: 'Customer berhasil ditambahkan',
      data: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menambahkan customer'
    });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getCustomer(id);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Customer tidak ditemukan'
      });
    }

    const updated = await db.updateCustomer(id, req.body);
    res.json({
      success: true,
      message: 'Customer berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate customer'
    });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCustomer(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Customer tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Customer berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus customer'
    });
  }
});

module.exports = router;
