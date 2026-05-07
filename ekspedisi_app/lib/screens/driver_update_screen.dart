import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class DriverUpdateScreen extends StatefulWidget {
  final String? prefilledOrderId;

  const DriverUpdateScreen({super.key, this.prefilledOrderId});

  @override
  State<DriverUpdateScreen> createState() => _DriverUpdateScreenState();
}

class _DriverUpdateScreenState extends State<DriverUpdateScreen> {
  final _driverNameCtrl = TextEditingController();
  final _catatanCtrl = TextEditingController();
  String _selectedStatus = 'MUAT';
  File? _selectedImage;
  bool _submitted = false;

  List<dynamic> _activeOrders = [];
  String? _selectedOrderId;
  bool _useManualInput = false;
  bool _isLoadingOrders = true;
  String? _ordersError;

  final List<Map<String, dynamic>> _statusOptions = [
    {'value': 'MUAT', 'label': 'MUAT BARANG', 'icon': Icons.inventory_2},
    {'value': 'JALAN', 'label': 'PERJALANAN', 'icon': Icons.local_shipping},
    {'value': 'SAMPAI', 'label': 'SAMPAI TUJUAN', 'icon': Icons.location_on},
    {'value': 'BONGKAR', 'label': 'BONGKAR SELESAI', 'icon': Icons.check_circle},
  ];

  @override
  void initState() {
    super.initState();
    _loadActiveOrders();
  }

  Future<void> _loadActiveOrders() async {
    try {
      final orders = await context.read<AppProvider>().loadActiveOrdersForDriver();
      if (mounted) {
        setState(() {
          _activeOrders = orders;
          _isLoadingOrders = false;
          if (widget.prefilledOrderId != null) {
            _selectedOrderId = widget.prefilledOrderId!.toUpperCase();
            _autoFillDriverName();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingOrders = false;
          _ordersError = e.toString();
          _useManualInput = true;
        });
      }
    }
  }

  void _autoFillDriverName() {
    final order = _activeOrders.firstWhere(
      (o) => o['id'] == _selectedOrderId,
      orElse: () => null,
    );
    if (order != null && order['driver_nama'] != null && order['driver_nama'].toString().isNotEmpty) {
      _driverNameCtrl.text = order['driver_nama'].toString();
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked != null) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submit() async {
    final orderId = _useManualInput
        ? _selectedOrderId ?? ''
        : (_selectedOrderId ?? '');

    if (orderId.isEmpty || _driverNameCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mohon lengkapi data yang wajib diisi')),
      );
      return;
    }

    setState(() => _submitted = true);

    try {
      String fotoUrl = '';

      await context.read<AppProvider>().submitDriverLog({
        'order_id': orderId.toUpperCase(),
        'driver_nama': _driverNameCtrl.text,
        'status_update': _selectedStatus,
        'foto_url': fotoUrl,
        'catatan': _catatanCtrl.text,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Update berhasil dikirim!')),
        );
        _resetForm();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Gagal: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitted = false);
    }
  }

  void _resetForm() {
    _driverNameCtrl.clear();
    _catatanCtrl.clear();
    setState(() {
      _selectedOrderId = null;
      _selectedStatus = 'MUAT';
      _selectedImage = null;
    });
  }

  Widget _buildOrderField() {
    if (_isLoadingOrders) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)),
            SizedBox(width: 12),
            Text('Memuat daftar order aktif...', style: TextStyle(color: AppTheme.muted, fontSize: 13)),
          ],
        ),
      );
    }

    if (_useManualInput) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: TextEditingController(text: _selectedOrderId)..selection = TextSelection.collapsed(offset: _selectedOrderId?.length ?? 0),
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              labelText: 'Nomor Order *',
              helperText: _ordersError != null ? 'Gagal memuat data. Ketik manual.' : 'Belum ada order aktif. Ketik manual.',
              helperStyle: const TextStyle(color: AppTheme.yellow, fontSize: 12),
            ),
            onChanged: (val) => _selectedOrderId = val,
          ),
          if (_activeOrders.isNotEmpty)
            TextButton(
              onPressed: () => setState(() => _useManualInput = false),
              child: const Text('Kembali ke pilihan dropdown'),
            ),
        ],
      );
    }

    if (_activeOrders.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'Nomor Order *',
              helperText: 'Belum ada order aktif. Ketik manual.',
              helperStyle: TextStyle(color: AppTheme.yellow, fontSize: 12),
            ),
            onChanged: (val) => _selectedOrderId = val,
          ),
        ],
      );
    }

    return DropdownButtonFormField<String>(
      decoration: const InputDecoration(labelText: 'Nomor Order *'),
      value: _selectedOrderId,
      isExpanded: true,
      items: _activeOrders.map<DropdownMenuItem<String>>((order) {
        final label = '${order['id']} — ${order['titik_a']} → ${order['titik_b']} (${order['status']})';
        return DropdownMenuItem<String>(
          value: order['id'] as String,
          child: Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedOrderId = value;
          _autoFillDriverName();
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('📝 Update Perjalanan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.blue.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: AppTheme.blue),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Gunakan form ini untuk melaporkan status perjalanan. Admin akan menerima update secara real-time.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Form
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Form Update', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 16),

                    _buildOrderField(),
                    const SizedBox(height: 12),

                    TextField(
                      controller: _driverNameCtrl,
                      decoration: const InputDecoration(labelText: 'Nama Sopir *'),
                    ),
                    const SizedBox(height: 16),

                    Text('Status Update *', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 1.8,
                      children: _statusOptions.map((opt) {
                        final isSelected = _selectedStatus == opt['value'];
                        return InkWell(
                          onTap: () => setState(() => _selectedStatus = opt['value']),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primary.withOpacity(0.15) : AppTheme.black,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border, width: 2),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(opt['icon'], color: isSelected ? AppTheme.primary : AppTheme.muted),
                                const SizedBox(height: 4),
                                Text(
                                  opt['label'],
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isSelected ? AppTheme.primary : AppTheme.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 16),

                    // Photo
                    Text('Upload Foto', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _pickImage,
                      child: Container(
                        width: double.infinity,
                        height: 120,
                        decoration: BoxDecoration(
                          color: AppTheme.black,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: _selectedImage != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.file(_selectedImage!, fit: BoxFit.cover),
                              )
                            : const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.camera_alt, size: 32, color: AppTheme.muted),
                                  SizedBox(height: 8),
                                  Text('Klik untuk ambil foto', style: TextStyle(color: AppTheme.muted)),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    TextField(
                      controller: _catatanCtrl,
                      decoration: const InputDecoration(labelText: 'Catatan (opsional)'),
                    ),

                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitted ? null : _submit,
                        child: _submitted
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('📤 Kirim Update'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
