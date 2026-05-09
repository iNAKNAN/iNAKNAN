import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../models/order.dart';
import '../theme/app_theme.dart';
import '../widgets/status_badge.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadBilling();
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
        title: const Text('💰 Penagihan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<AppProvider>().loadBilling(),
          ),
        ],
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.billingOrders.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (provider.billingOrders.isEmpty) {
            return const Center(child: Text('Belum ada tagihan', style: TextStyle(color: AppTheme.muted)));
          }

          double totalPiutang = 0;
          double totalLunas = 0;
          for (final o in provider.billingOrders) {
            if (o.isLunas) {
              totalLunas += o.nilaiTagihan ?? 0;
            } else {
              totalPiutang += o.nilaiTagihan ?? 0;
            }
          }

          return Column(
            children: [
              // Summary
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Text(formatRupiah(totalPiutang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.red)),
                              const SizedBox(height: 4),
                              const Text('Piutang', style: TextStyle(fontSize: 12, color: AppTheme.muted)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Text(formatRupiah(totalLunas), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.green)),
                              const SizedBox(height: 4),
                              const Text('Lunas', style: TextStyle(fontSize: 12, color: AppTheme.muted)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // List
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => provider.loadBilling(),
                  color: AppTheme.primary,
                  child: ListView.builder(
                    itemCount: provider.billingOrders.length,
                    itemBuilder: (context, index) {
                      final order = provider.billingOrders[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: ListTile(
                          title: Text(order.id),
                          subtitle: Text(order.customerNama),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(formatRupiah(order.nilaiTagihan), style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(width: 12),
                              StatusBadge(status: order.statusTagihan ?? 'BELUM'),
                            ],
                          ),
                          onTap: () => _showUpdateDialog(order),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showUpdateDialog(Order order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.card,
        title: const Text('Update Status Tagihan'),
        content: Text('${order.id} - ${order.customerNama}\nTagihan: ${formatRupiah(order.nilaiTagihan)}'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          if (order.statusTagihan != 'LUNAS')
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.read<AppProvider>().updateBillingStatus(order.id, 'LUNAS');
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.green),
              child: const Text('Tandai Lunas'),
            ),
          if (order.statusTagihan != 'BELUM')
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.read<AppProvider>().updateBillingStatus(order.id, 'BELUM');
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.red),
              child: const Text('Tandai Belum'),
            ),
        ],
      ),
    );
  }
}
