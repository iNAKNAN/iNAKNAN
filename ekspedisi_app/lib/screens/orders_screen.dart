import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../models/order.dart';
import '../models/customer.dart';
import '../models/driver.dart';
import '../data/java_cities.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../widgets/searchable_city_dropdown.dart';
import '../widgets/status_badge.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  String _filterStatus = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadOrders();
    });
  }

  String formatRupiah(double? value) {
    if (value == null) return 'Rp 0';
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('📦 Manajemen Orders'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<AppProvider>().loadOrders(status: _filterStatus.isEmpty ? null : _filterStatus),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                _FilterChip(label: 'Semua', isActive: _filterStatus == '', onTap: () {
                  setState(() => _filterStatus = '');
                  context.read<AppProvider>().loadOrders();
                }),
                _FilterChip(label: 'Menunggu', isActive: _filterStatus == 'MENUNGGU', onTap: () {
                  setState(() => _filterStatus = 'MENUNGGU');
                  context.read<AppProvider>().loadOrders(status: 'MENUNGGU');
                }),
                _FilterChip(label: 'Jalan', isActive: _filterStatus == 'JALAN', onTap: () {
                  setState(() => _filterStatus = 'JALAN');
                  context.read<AppProvider>().loadOrders(status: 'JALAN');
                }),
                _FilterChip(label: 'Selesai', isActive: _filterStatus == 'SELESAI', onTap: () {
                  setState(() => _filterStatus = 'SELESAI');
                  context.read<AppProvider>().loadOrders(status: 'SELESAI');
                }),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: Consumer<AppProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.orders.isEmpty) {
                  return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
                }

                if (provider.error != null && provider.orders.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(provider.error!, style: const TextStyle(color: AppTheme.muted)),
                        TextButton(
                          onPressed: () => provider.loadOrders(status: _filterStatus.isEmpty ? null : _filterStatus),
                          child: const Text('Coba Lagi'),
                        ),
                      ],
                    ),
                  );
                }

                if (provider.orders.isEmpty) {
                  return const Center(
                    child: Text('Belum ada orders', style: TextStyle(color: AppTheme.muted)),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => provider.loadOrders(status: _filterStatus.isEmpty ? null : _filterStatus),
                  child: ListView.builder(
                    itemCount: provider.orders.length,
                    itemBuilder: (context, index) {
                      final order = provider.orders[index];
                      return _OrderCard(
                        order: order,
                        onTap: () => _showOrderDetail(order),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddOrderDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showOrderDetail(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return FutureBuilder<Order>(
            future: ApiService().getOrder(order.id),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
              }

              if (snapshot.hasError || !snapshot.hasData) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: AppTheme.red, size: 48),
                      const SizedBox(height: 16),
                      Text('Gagal memuat detail: ${snapshot.error}', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.muted)),
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Tutup'),
                      ),
                    ],
                  ),
                );
              }

              final detail = snapshot.data!;
              final logs = detail.driverLogs ?? [];
              final history = detail.history ?? [];

              return SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(detail.id, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        StatusBadge(status: detail.status),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _DetailRow(label: 'Customer', value: detail.customerNama),
                    _DetailRow(label: 'Telepon', value: detail.customerTelepon ?? '-'),
                    _DetailRow(label: 'Rute', value: detail.rute),
                    _DetailRow(label: 'Barang', value: detail.jenisBarang ?? '-'),
                    _DetailRow(label: 'Driver', value: detail.driverNama ?? 'Belum diassign'),
                    _DetailRow(label: 'No Polisi', value: detail.nopolTruck ?? '-'),
                    _DetailRow(label: 'Tagihan', value: formatRupiah(detail.nilaiTagihan)),
                    _DetailRow(label: 'Uang Jalan', value: formatRupiah(detail.totalUangJalan)),
                    const SizedBox(height: 20),

                    if (logs.isNotEmpty) ...[
                      const Text('📸 Update dari Sopir', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.muted)),
                      const SizedBox(height: 10),
                      ...logs.map((log) => _DriverLogCard(log: log)),
                      const SizedBox(height: 20),
                    ],

                    if (history.isNotEmpty) ...[
                      const Text('📝 Riwayat Status (Admin)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.muted)),
                      const SizedBox(height: 10),
                      ...history.map((h) => _HistoryRow(history: h)),
                      const SizedBox(height: 20),
                    ],

                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _showStatusUpdateDialog(detail),
                            child: const Text('Update Status'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _confirmDelete(detail);
                            },
                            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.red),
                            child: const Text('Hapus'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showStatusUpdateDialog(Order order) {
    final statuses = ['MENUNGGU', 'DIJADWALKAN', 'MUAT', 'JALAN', 'BONGKAR', 'SELESAI'];
    String selectedStatus = order.status;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Update Status'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: statuses.map((s) => RadioListTile<String>(
              title: Text(s),
              value: s,
              groupValue: selectedStatus,
              activeColor: AppTheme.primary,
              onChanged: (value) => setState(() => selectedStatus = value!),
            )).toList(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
              context.read<AppProvider>().updateOrderStatus(order.id, selectedStatus);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(Order order) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Konfirmasi Hapus'),
        content: Text('Yakin ingin menghapus order ${order.id}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AppProvider>().deleteOrder(order.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.red),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  void _showAddOrderDialog() {
    final provider = context.read<AppProvider>();
    provider.loadCustomers();
    provider.loadDrivers();

    // Generate next order ID
    String nextOrderId = 'ORD-001';
    if (provider.orders.isNotEmpty) {
      int maxNum = 0;
      for (final order in provider.orders) {
        final match = RegExp(r'ORD-(\d+)').firstMatch(order.id);
        if (match != null) {
          final num = int.tryParse(match.group(1)!) ?? 0;
          if (num > maxNum) maxNum = num;
        }
      }
      nextOrderId = 'ORD-${(maxNum + 1).toString().padLeft(3, '0')}';
    }

    final idCtrl = TextEditingController(text: nextOrderId);
    final barangCtrl = TextEditingController();
    final tagihanCtrl = TextEditingController();
    final jarakCtrl = TextEditingController();
    final tolCtrl = TextEditingController();
    final makanCtrl = TextEditingController();
    final nopolCtrl = TextEditingController();

    Customer? selectedCustomer;
    JavaCity? selectedCityA;
    JavaCity? selectedCityB;
    Driver? selectedDriver;
    bool isSaving = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            backgroundColor: AppTheme.card,
            title: const Text('Order Baru'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: idCtrl,
                    decoration: const InputDecoration(labelText: 'No Order *'),
                    readOnly: true,
                  ),
                  const SizedBox(height: 8),
                  Consumer<AppProvider>(
                    builder: (context, provider, child) {
                      if (provider.customers.isEmpty) {
                        return const Text('Memuat data customer...', style: TextStyle(color: AppTheme.muted));
                      }
                      return DropdownButtonFormField<Customer>(
                        decoration: const InputDecoration(labelText: 'Customer *'),
                        value: selectedCustomer,
                        isExpanded: true,
                        items: provider.customers.map((customer) {
                          return DropdownMenuItem<Customer>(
                            value: customer,
                            child: Text(customer.nama, overflow: TextOverflow.ellipsis),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => selectedCustomer = value),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  SearchableCityDropdown(
                    label: 'Titik Muat (A) *',
                    selectedCity: selectedCityA,
                    onSelected: (city) => setState(() => selectedCityA = city),
                  ),
                  const SizedBox(height: 8),
                  SearchableCityDropdown(
                    label: 'Titik Bongkar (B) *',
                    selectedCity: selectedCityB,
                    onSelected: (city) => setState(() => selectedCityB = city),
                  ),
                  const SizedBox(height: 8),
                  TextField(controller: barangCtrl, decoration: const InputDecoration(labelText: 'Jenis Barang')),
                  const SizedBox(height: 8),
                  Consumer<AppProvider>(
                    builder: (context, provider, child) {
                      if (provider.drivers.isEmpty) {
                        return const Text('Memuat data driver...', style: TextStyle(color: AppTheme.muted));
                      }
                      return DropdownButtonFormField<Driver>(
                        decoration: const InputDecoration(labelText: 'Driver'),
                        value: selectedDriver,
                        isExpanded: true,
                        items: provider.drivers.map((driver) {
                          return DropdownMenuItem<Driver>(
                            value: driver,
                            child: Text(driver.nama, overflow: TextOverflow.ellipsis),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            selectedDriver = value;
                            nopolCtrl.text = value?.nopolTruck ?? '-';
                          });
                        },
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: nopolCtrl,
                    decoration: const InputDecoration(labelText: 'No Polisi'),
                    readOnly: true,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: tagihanCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Nilai Tagihan',
                      prefixText: 'Rp ',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      _RupiahInputFormatter(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: jarakCtrl,
                    decoration: const InputDecoration(labelText: 'Jarak (km)'),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: tolCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Biaya Tol',
                      prefixText: 'Rp ',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      _RupiahInputFormatter(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: makanCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Biaya Makan',
                      prefixText: 'Rp ',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      _RupiahInputFormatter(),
                    ],
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
              ElevatedButton(
                onPressed: isSaving
                    ? null
                    : () async {
                        if (idCtrl.text.isEmpty || selectedCustomer == null || selectedCityA == null || selectedCityB == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Mohon lengkapi semua field wajib (*)')),
                          );
                          return;
                        }
                        final tagihanClean = tagihanCtrl.text.replaceAll('.', '');
                        final tolClean = tolCtrl.text.replaceAll('.', '');
                        final makanClean = makanCtrl.text.replaceAll('.', '');
                        setState(() => isSaving = true);
                        try {
                          await context.read<AppProvider>().createOrder({
                            'id': idCtrl.text.toUpperCase(),
                            'customer_id': selectedCustomer!.id,
                            'customer_nama': selectedCustomer!.nama,
                            'titik_a': selectedCityA!.name,
                            'titik_b': selectedCityB!.name,
                            'lat_a': selectedCityA!.lat,
                            'lng_a': selectedCityA!.lng,
                            'lat': selectedCityB!.lat,
                            'lng': selectedCityB!.lng,
                            'jenis_barang': barangCtrl.text,
                            'nilai_tagihan': double.tryParse(tagihanClean) ?? 0,
                            'driver_id': selectedDriver?.id,
                            'driver_nama': selectedDriver?.nama,
                            'nopol_truck': selectedDriver?.nopolTruck,
                            'jarak_km': double.tryParse(jarakCtrl.text) ?? 0,
                            'biaya_tol': double.tryParse(tolClean) ?? 0,
                            'biaya_makan': double.tryParse(makanClean) ?? 0,
                          });
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Order berhasil disimpan')),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Gagal menyimpan order: $e')),
                            );
                          }
                        } finally {
                          if (context.mounted) {
                            setState(() => isSaving = false);
                          }
                        }
                      },
                child: isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Simpan'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;

  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(order.id, style: const TextStyle(fontWeight: FontWeight.bold)),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 8),
              Text(order.customerNama, style: const TextStyle(color: AppTheme.white)),
              Text(order.rute, style: const TextStyle(color: AppTheme.muted, fontSize: 12)),
              if (order.driverNama != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('Driver: ${order.driverNama}', style: const TextStyle(fontSize: 12, color: AppTheme.muted)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.primary : AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isActive ? AppTheme.primary : AppTheme.border),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, color: isActive ? Colors.white : AppTheme.white)),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(color: AppTheme.muted, fontSize: 13))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _DriverLogCard extends StatelessWidget {
  final DriverLog log;

  const _DriverLogCard({required this.log});

  String _formatDateTime(String? dateString) {
    if (dateString == null) return '-';
    final date = DateTime.tryParse(dateString);
    if (date == null) return '-';
    return DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  StatusBadge(status: log.statusUpdate),
                  const SizedBox(width: 8),
                  Text(log.driverNama, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ),
              Text(_formatDateTime(log.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
            ],
          ),
          if (log.catatan != null && log.catatan!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('💬 ${log.catatan}', style: const TextStyle(fontSize: 13, color: AppTheme.white)),
          ],
          if (log.fotoUrl != null && log.fotoUrl!.isNotEmpty) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                log.fotoUrl!,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 100,
                  color: AppTheme.card,
                  child: const Center(child: Text('Gagal memuat foto', style: TextStyle(color: AppTheme.muted))),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final OrderHistory history;

  const _HistoryRow({required this.history});

  String _formatDateTime(String? dateString) {
    if (dateString == null) return '-';
    final date = DateTime.tryParse(dateString);
    if (date == null) return '-';
    return DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.black,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          StatusBadge(status: history.status),
          const SizedBox(width: 10),
          if (history.keterangan != null && history.keterangan!.isNotEmpty)
            Expanded(
              child: Text(
                history.keterangan!,
                style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                overflow: TextOverflow.ellipsis,
              ),
            )
          else
            const Spacer(),
          Text(_formatDateTime(history.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
        ],
      ),
    );
  }
}

/// Formatter untuk input nominal Rupiah dengan pemisah ribuan titik (.)
class _RupiahInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    final cleaned = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (cleaned.isEmpty) {
      return newValue.copyWith(text: '');
    }

    final number = int.parse(cleaned);
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0);
    final formatted = formatter.format(number).trim();

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
