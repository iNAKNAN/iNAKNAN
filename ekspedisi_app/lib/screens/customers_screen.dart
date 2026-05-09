import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/customer.dart';
import '../theme/app_theme.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadCustomers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🏢 Customers')),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.customers.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (provider.customers.isEmpty) {
            return const Center(child: Text('Belum ada customers', style: TextStyle(color: AppTheme.muted)));
          }
          return RefreshIndicator(
            onRefresh: () => provider.loadCustomers(),
            color: AppTheme.primary,
            child: ListView.builder(
              itemCount: provider.customers.length,
              itemBuilder: (context, index) {
                final c = provider.customers[index];
                return ListTile(
                  leading: CircleAvatar(backgroundColor: AppTheme.primary, child: Text(c.nama[0])),
                  title: Text(c.nama),
                  subtitle: Text(c.telepon ?? '-', style: const TextStyle(color: AppTheme.muted)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, color: AppTheme.red, size: 20),
                    onPressed: () => _confirmDelete(c),
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

  void _confirmDelete(Customer c) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Hapus Customer?'),
        content: Text('Yakin ingin menghapus ${c.nama}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AppProvider>().deleteCustomer(c.id!);
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
    final alamatCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Customer Baru'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: namaCtrl, decoration: const InputDecoration(labelText: 'Nama *')),
            TextField(controller: telpCtrl, decoration: const InputDecoration(labelText: 'Telepon')),
            TextField(controller: alamatCtrl, decoration: const InputDecoration(labelText: 'Alamat')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () {
              if (namaCtrl.text.isEmpty) return;
              Navigator.pop(ctx);
              context.read<AppProvider>().createCustomer({
                'nama': namaCtrl.text,
                'telepon': telpCtrl.text,
                'alamat': alamatCtrl.text,
              });
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }
}
