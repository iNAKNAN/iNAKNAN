import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/driver.dart';
import '../theme/app_theme.dart';

class DriversScreen extends StatefulWidget {
  const DriversScreen({super.key});

  @override
  State<DriversScreen> createState() => _DriversScreenState();
}

class _DriversScreenState extends State<DriversScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadDrivers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('👨‍✈️ Drivers')),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.drivers.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (provider.drivers.isEmpty) {
            return const Center(child: Text('Belum ada drivers', style: TextStyle(color: AppTheme.muted)));
          }
          return RefreshIndicator(
            onRefresh: () => provider.loadDrivers(),
            color: AppTheme.primary,
            child: ListView.builder(
              itemCount: provider.drivers.length,
              itemBuilder: (context, index) {
                final d = provider.drivers[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: d.isAvailable ? AppTheme.green : AppTheme.muted,
                    child: const Icon(Icons.person, color: Colors.white),
                  ),
                  title: Text(d.nama),
                  subtitle: Text('${d.nopolTruck ?? '-'} • ${d.armada ?? '-'}', style: const TextStyle(color: AppTheme.muted)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: AppTheme.red, size: 20),
                    onPressed: () => _confirmDelete(d),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _confirmDelete(Driver d) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Hapus Driver?'),
        content: Text('Yakin ingin menghapus ${d.nama}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AppProvider>().deleteDriver(d.id!);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.red),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  void _showAddDialog() {
    final namaCtrl = TextEditingController();
    final telpCtrl = TextEditingController();
    final nopolCtrl = TextEditingController();
    String armada = 'CDD';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Driver Baru'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: namaCtrl, decoration: const InputDecoration(labelText: 'Nama *')),
              TextField(controller: telpCtrl, decoration: const InputDecoration(labelText: 'Telepon')),
              TextField(controller: nopolCtrl, decoration: const InputDecoration(labelText: 'No Polisi')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: armada,
                decoration: const InputDecoration(labelText: 'Armada'),
                items: ['CDD', 'CDE', 'Fuso', 'Tronton'].map((a) => DropdownMenuItem(value: a, child: Text(a))).toList(),
                onChanged: (v) => setState(() => armada = v!),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              if (namaCtrl.text.isEmpty) return;
              Navigator.pop(ctx);
              context.read<AppProvider>().createDriver({
                'nama': namaCtrl.text,
                'telepon': telpCtrl.text,
                'nopol_truck': nopolCtrl.text,
                'armada': armada,
              });
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }
}
