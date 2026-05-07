class Order {
  final String id;
  final String? tanggal;
  final int? customerId;
  final String customerNama;
  final String? customerTelepon;
  final String titikA;
  final String titikB;
  final String? jenisBarang;
  final int? driverId;
  final String? driverNama;
  final String status;
  final double? jarakKm;
  final double? konsumsiBbm;
  final double? hargaBbm;
  final double? biayaTol;
  final double? biayaMakan;
  final double? totalUangJalan;
  final double? nilaiTagihan;
  final String? statusTagihan;
  final String? lokasiTerakhir;
  final double? lat;
  final double? lng;
  final String? nopolTruck;
  final String? createdAt;
  final String? updatedAt;
  final List<OrderHistory>? history;
  final List<DriverLog>? driverLogs;

  Order({
    required this.id,
    this.tanggal,
    this.customerId,
    required this.customerNama,
    this.customerTelepon,
    required this.titikA,
    required this.titikB,
    this.jenisBarang,
    this.driverId,
    this.driverNama,
    this.status = 'MENUNGGU',
    this.jarakKm,
    this.konsumsiBbm,
    this.hargaBbm,
    this.biayaTol,
    this.biayaMakan,
    this.totalUangJalan,
    this.nilaiTagihan,
    this.statusTagihan,
    this.lokasiTerakhir,
    this.lat,
    this.lng,
    this.nopolTruck,
    this.createdAt,
    this.updatedAt,
    this.history,
    this.driverLogs,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      tanggal: json['tanggal'],
      customerId: json['customer_id'],
      customerNama: json['customer_nama'] ?? json['customer_nama_display'] ?? '',
      customerTelepon: json['customer_telepon'],
      titikA: json['titik_a'] ?? '',
      titikB: json['titik_b'] ?? '',
      jenisBarang: json['jenis_barang'],
      driverId: json['driver_id'],
      driverNama: json['driver_nama'],
      status: json['status'] ?? 'MENUNGGU',
      jarakKm: json['jarak_km'] != null ? (json['jarak_km'] as num).toDouble() : null,
      konsumsiBbm: json['konsumsi_bbm'] != null ? (json['konsumsi_bbm'] as num).toDouble() : null,
      hargaBbm: json['harga_bbm'] != null ? (json['harga_bbm'] as num).toDouble() : null,
      biayaTol: json['biaya_tol'] != null ? (json['biaya_tol'] as num).toDouble() : null,
      biayaMakan: json['biaya_makan'] != null ? (json['biaya_makan'] as num).toDouble() : null,
      totalUangJalan: json['total_uang_jalan'] != null ? (json['total_uang_jalan'] as num).toDouble() : null,
      nilaiTagihan: json['nilai_tagihan'] != null ? (json['nilai_tagihan'] as num).toDouble() : null,
      statusTagihan: json['status_tagihan'],
      lokasiTerakhir: json['lokasi_terakhir'],
      lat: json['lat'] != null ? (json['lat'] as num).toDouble() : null,
      lng: json['lng'] != null ? (json['lng'] as num).toDouble() : null,
      nopolTruck: json['nopol_truck'] ?? json['nopol'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      history: json['history'] != null
          ? (json['history'] as List).map((e) => OrderHistory.fromJson(e)).toList()
          : null,
      driverLogs: json['driverLogs'] != null
          ? (json['driverLogs'] as List).map((e) => DriverLog.fromJson(e)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_id': customerId,
      'customer_nama': customerNama,
      'titik_a': titikA,
      'titik_b': titikB,
      'jenis_barang': jenisBarang,
      'driver_id': driverId,
      'driver_nama': driverNama,
      'status': status,
      'jarak_km': jarakKm,
      'konsumsi_bbm': konsumsiBbm,
      'harga_bbm': hargaBbm,
      'biaya_tol': biayaTol,
      'biaya_makan': biayaMakan,
      'nilai_tagihan': nilaiTagihan,
    };
  }

  String get rute => '$titikA → $titikB';

  bool get isLunas => statusTagihan == 'LUNAS';
}

class OrderHistory {
  final int? id;
  final String orderId;
  final String status;
  final String? keterangan;
  final String? createdBy;
  final String? createdAt;

  OrderHistory({
    this.id,
    required this.orderId,
    required this.status,
    this.keterangan,
    this.createdBy,
    this.createdAt,
  });

  factory OrderHistory.fromJson(Map<String, dynamic> json) {
    return OrderHistory(
      id: json['id'],
      orderId: json['order_id'] ?? '',
      status: json['status'] ?? '',
      keterangan: json['keterangan'],
      createdBy: json['created_by'],
      createdAt: json['created_at'],
    );
  }
}

class DriverLog {
  final int? id;
  final String orderId;
  final int? driverId;
  final String driverNama;
  final String statusUpdate;
  final String? fotoUrl;
  final String? catatan;
  final String? createdAt;

  DriverLog({
    this.id,
    required this.orderId,
    this.driverId,
    required this.driverNama,
    required this.statusUpdate,
    this.fotoUrl,
    this.catatan,
    this.createdAt,
  });

  factory DriverLog.fromJson(Map<String, dynamic> json) {
    return DriverLog(
      id: json['id'],
      orderId: json['order_id'] ?? '',
      driverId: json['driver_id'],
      driverNama: json['driver_nama'] ?? '',
      statusUpdate: json['status_update'] ?? '',
      fotoUrl: json['foto_url'],
      catatan: json['catatan'],
      createdAt: json['created_at'],
    );
  }
}
