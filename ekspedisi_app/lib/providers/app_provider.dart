import 'package:flutter/material.dart';
import '../models/order.dart';
import '../models/customer.dart';
import '../models/driver.dart';
import '../models/shipment.dart';
import '../models/dashboard_stats.dart';
import '../services/api_service.dart';

class AppProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  // State
  bool _isLoading = false;
  String? _error;

  // Data
  List<Order> _orders = [];
  List<Customer> _customers = [];
  List<Driver> _drivers = [];
  List<Order> _billingOrders = [];
  DashboardStats? _dashboardStats;
  Shipment? _trackedShipment;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Order> get orders => _orders;
  List<Customer> get customers => _customers;
  List<Driver> get drivers => _drivers;
  List<Order> get billingOrders => _billingOrders;
  DashboardStats? get dashboardStats => _dashboardStats;
  Shipment? get trackedShipment => _trackedShipment;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? value) {
    _error = value;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // ==================== ORDERS ====================
  Future<void> loadOrders({String? status, String? search}) async {
    _setLoading(true);
    _setError(null);
    try {
      _orders = await _api.getOrders(status: status, search: search);
    } catch (e) {
      _setError(e.toString());
    }
    _setLoading(false);
  }

  Future<Order> createOrder(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      final order = await _api.createOrder(data);
      await loadOrders();
      return order;
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<Order> updateOrder(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      final order = await _api.updateOrder(id, data);
      await loadOrders();
      return order;
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteOrder(String id) async {
    _setLoading(true);
    try {
      await _api.deleteOrder(id);
      await loadOrders();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateOrderStatus(String id, String status, {String? keterangan}) async {
    _setLoading(true);
    try {
      await _api.updateOrderStatus(id, status, keterangan: keterangan);
      await loadOrders();
      await loadDashboardStats();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> assignDriver(String id, int driverId, String driverNama) async {
    _setLoading(true);
    try {
      await _api.assignDriver(id, driverId, driverNama);
      await loadOrders();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // ==================== CUSTOMERS ====================
  Future<void> loadCustomers() async {
    _setLoading(true);
    _setError(null);
    try {
      _customers = await _api.getCustomers();
    } catch (e) {
      _setError(e.toString());
    }
    _setLoading(false);
  }

  Future<void> createCustomer(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      await _api.createCustomer(data);
      await loadCustomers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateCustomer(int id, Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      await _api.updateCustomer(id, data);
      await loadCustomers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteCustomer(int id) async {
    _setLoading(true);
    try {
      await _api.deleteCustomer(id);
      await loadCustomers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // ==================== DRIVERS ====================
  Future<void> loadDrivers() async {
    _setLoading(true);
    _setError(null);
    try {
      _drivers = await _api.getDrivers();
    } catch (e) {
      _setError(e.toString());
    }
    _setLoading(false);
  }

  Future<void> createDriver(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      await _api.createDriver(data);
      await loadDrivers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateDriver(int id, Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      await _api.updateDriver(id, data);
      await loadDrivers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteDriver(int id) async {
    _setLoading(true);
    try {
      await _api.deleteDriver(id);
      await loadDrivers();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // ==================== BILLING ====================
  Future<void> loadBilling({String? status}) async {
    _setLoading(true);
    _setError(null);
    try {
      _billingOrders = await _api.getBilling(status: status);
    } catch (e) {
      _setError(e.toString());
    }
    _setLoading(false);
  }

  Future<void> updateBillingStatus(String id, String status) async {
    _setLoading(true);
    try {
      await _api.updateBillingStatus(id, status);
      await loadBilling();
      await loadDashboardStats();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  // ==================== DASHBOARD ====================
  Future<void> loadDashboardStats() async {
    _setLoading(true);
    _setError(null);
    try {
      _dashboardStats = await _api.getDashboardStats();
    } catch (e) {
      _setError(e.toString());
    }
    _setLoading(false);
  }

  // ==================== TRACKING ====================
  Future<void> trackShipment(String resi) async {
    _setLoading(true);
    _setError(null);
    try {
      _trackedShipment = await _api.trackShipment(resi);
    } catch (e) {
      _setError(e.toString());
      _trackedShipment = null;
    }
    _setLoading(false);
  }

  void clearTrackedShipment() {
    _trackedShipment = null;
    notifyListeners();
  }

  // ==================== DRIVER LOGS ====================
  Future<void> submitDriverLog(Map<String, dynamic> data) async {
    _setLoading(true);
    try {
      await _api.createDriverLog(data);
    } catch (e) {
      _setError(e.toString());
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<List<dynamic>> loadActiveOrdersForDriver() async {
    try {
      return await _api.getActiveOrdersForDriver();
    } catch (e) {
      _setError(e.toString());
      rethrow;
    }
  }
}
