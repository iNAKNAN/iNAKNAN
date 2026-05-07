import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/order.dart';
import '../models/customer.dart';
import '../models/driver.dart';
import '../models/shipment.dart';
import '../models/dashboard_stats.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Ganti dengan URL backend Anda
  // Local: 'http://10.0.2.2:3000/api' (untuk Android emulator)
  // Local: 'http://localhost:3000/api' (untuk iOS simulator)
  // Production: 'https://your-domain.com/api'
  String baseUrl = 'https://ihandpump-production.up.railway.app/api';

  void setBaseUrl(String url) {
    baseUrl = url.endsWith('/api') ? url : '$url/api';
  }

  Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  String _parseError(http.Response response) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map && data.containsKey('error')) {
        return data['error'].toString();
      }
    } catch (_) {}
    final bodyPreview = response.body.length > 200
        ? '${response.body.substring(0, 200)}...'
        : response.body;
    return 'HTTP ${response.statusCode}: $bodyPreview';
  }

  // ==================== HEALTH ====================
  Future<bool> checkHealth() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/health'), headers: headers)
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ==================== ORDERS ====================
  Future<List<Order>> getOrders({String? status, String? search}) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final uri = Uri.parse('$baseUrl/orders').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> orders = data['data'] ?? [];
        return orders.map((e) => Order.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Order> getOrder(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/orders/$id'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Order> createOrder(Map<String, dynamic> orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: headers,
      body: jsonEncode(orderData),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Order> updateOrder(String id, Map<String, dynamic> orderData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$id'),
      headers: headers,
      body: jsonEncode(orderData),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<void> deleteOrder(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl/orders/$id'), headers: headers).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  Future<Order> updateOrderStatus(String id, String status, {String? keterangan}) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/orders/$id/status'),
      headers: headers,
      body: jsonEncode({
        'status': status,
        'keterangan': keterangan,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Order> assignDriver(String id, int driverId, String driverNama) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/orders/$id/assign-driver'),
      headers: headers,
      body: jsonEncode({
        'driver_id': driverId,
        'driver_nama': driverNama,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  // ==================== CUSTOMERS ====================
  Future<List<Customer>> getCustomers() async {
    final response = await http.get(Uri.parse('$baseUrl/customers'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> customers = data['data'] ?? [];
        return customers.map((e) => Customer.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Customer> createCustomer(Map<String, dynamic> customerData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/customers'),
      headers: headers,
      body: jsonEncode(customerData),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Customer.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Customer> updateCustomer(int id, Map<String, dynamic> customerData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/customers/$id'),
      headers: headers,
      body: jsonEncode(customerData),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Customer.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<void> deleteCustomer(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/customers/$id'), headers: headers);

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  // ==================== DRIVERS ====================
  Future<List<Driver>> getDrivers({String? status}) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;

    final uri = Uri.parse('$baseUrl/drivers').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> drivers = data['data'] ?? [];
        return drivers.map((e) => Driver.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<List<Driver>> getAvailableDrivers() async {
    final response = await http.get(Uri.parse('$baseUrl/drivers/available/list'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> drivers = data['data'] ?? [];
        return drivers.map((e) => Driver.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Driver> createDriver(Map<String, dynamic> driverData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/drivers'),
      headers: headers,
      body: jsonEncode(driverData),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Driver.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Driver> updateDriver(int id, Map<String, dynamic> driverData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/drivers/$id'),
      headers: headers,
      body: jsonEncode(driverData),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Driver.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<void> deleteDriver(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/drivers/$id'), headers: headers);

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  Future<void> createDriverLog(Map<String, dynamic> logData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/drivers/logs'),
      headers: headers,
      body: jsonEncode(logData),
    );

    if (response.statusCode != 201) {
      throw Exception(_parseError(response));
    }
  }

  Future<List<dynamic>> getDriverLogs({String? orderId}) async {
    final queryParams = <String, String>{};
    if (orderId != null) queryParams['order_id'] = orderId;

    final uri = Uri.parse('$baseUrl/drivers/logs/all').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['data'] ?? [];
      }
    }
    throw Exception(_parseError(response));
  }

  Future<List<dynamic>> getActiveOrdersForDriver() async {
    final response = await http.get(Uri.parse('$baseUrl/orders/active-for-driver'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['data'] ?? [];
      }
    }
    throw Exception(_parseError(response));
  }

  // ==================== TRACKING / SHIPMENTS ====================
  Future<Shipment> trackShipment(String resi) async {
    final response = await http.get(Uri.parse('$baseUrl/track/$resi'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Shipment.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<PositionUpdate> getPosition(String resi) async {
    final response = await http.get(Uri.parse('$baseUrl/track/$resi/position'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return PositionUpdate.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  Future<List<Shipment>> getShipments() async {
    final response = await http.get(Uri.parse('$baseUrl/shipments'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> shipments = data['data'] ?? [];
        return shipments.map((e) => Shipment.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<void> createShipment(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/shipments'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode != 201) {
      throw Exception(_parseError(response));
    }
  }

  Future<void> updateShipment(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/shipments/$id'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  Future<void> deleteShipment(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl/shipments/$id'), headers: headers);

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  Future<void> updatePosition(String id, Map<String, dynamic> data) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/shipments/$id/position'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode != 200) {
      throw Exception(_parseError(response));
    }
  }

  // ==================== BILLING ====================
  Future<List<Order>> getBilling({String? status}) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;

    final uri = Uri.parse('$baseUrl/billing').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        final List<dynamic> orders = data['data'] ?? [];
        return orders.map((e) => Order.fromJson(e)).toList();
      }
    }
    throw Exception(_parseError(response));
  }

  Future<Order> updateBillingStatus(String id, String status) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/billing/$id/status'),
      headers: headers,
      body: jsonEncode({'status': status}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return Order.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  // ==================== DASHBOARD ====================
  Future<DashboardStats> getDashboardStats() async {
    final response = await http.get(Uri.parse('$baseUrl/orders/stats/dashboard'), headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return DashboardStats.fromJson(data['data']);
      }
    }
    throw Exception(_parseError(response));
  }

  // ==================== UANG JALAN ====================
  Future<Map<String, dynamic>> calculateUangJalan(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/uang-jalan/calculate'),
      headers: headers,
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['data'] ?? {};
      }
    }
    throw Exception(_parseError(response));
  }
}
