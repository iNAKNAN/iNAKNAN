class Customer {
  final int? id;
  final String nama;
  final String? telepon;
  final String? alamat;
  final String? createdAt;

  Customer({
    this.id,
    required this.nama,
    this.telepon,
    this.alamat,
    this.createdAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      nama: json['nama'] ?? '',
      telepon: json['telepon'],
      alamat: json['alamat'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nama': nama,
      'telepon': telepon,
      'alamat': alamat,
    };
  }
}
