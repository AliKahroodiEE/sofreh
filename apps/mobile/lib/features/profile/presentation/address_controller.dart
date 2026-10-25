import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/preferences.dart';
import '../../auth/presentation/auth_controller.dart';
import '../data/address_repository.dart';
import '../domain/address.dart';

/// The user's saved addresses with add/remove.
class AddressesController extends AsyncNotifier<List<Address>> {
  @override
  Future<List<Address>> build() {
    // Reload when the signed-in user changes.
    final user = ref.watch(authControllerProvider.select((s) => s is Authenticated ? s.user.id : null));
    if (user == null) return Future.value(const []);
    return ref.read(addressRepositoryProvider).list();
  }

  /// Saves a new address, selects it and returns it.
  Future<Address> add({required String title, required String details}) async {
    final address = await ref.read(addressRepositoryProvider).add(title: title, details: details);
    state = AsyncData([address, ...?state.value]);
    ref.read(selectedAddressIdProvider.notifier).select(address.id);
    return address;
  }

  /// Deletes an address.
  Future<void> remove(int id) async {
    await ref.read(addressRepositoryProvider).remove(id);
    state = AsyncData([...?state.value?.where((a) => a.id != id)]);
  }
}

/// Saved addresses.
final addressesProvider = AsyncNotifierProvider<AddressesController, List<Address>>(AddressesController.new);

/// Id of the delivery address chosen on the home screen (persisted).
class SelectedAddressIdController extends Notifier<int?> {
  static const _key = 'address.selectedId';

  @override
  int? build() => ref.read(sharedPreferencesProvider).getInt(_key);

  /// Chooses [id] as the delivery address.
  void select(int id) {
    state = id;
    ref.read(sharedPreferencesProvider).setInt(_key, id);
  }
}

/// The chosen address id.
final selectedAddressIdProvider = NotifierProvider<SelectedAddressIdController, int?>(SelectedAddressIdController.new);

/// The chosen address, falling back to the newest saved one.
final selectedAddressProvider = Provider<Address?>((ref) {
  final addresses = ref.watch(addressesProvider).value ?? const [];
  if (addresses.isEmpty) return null;
  final id = ref.watch(selectedAddressIdProvider);
  return addresses.firstWhere((a) => a.id == id, orElse: () => addresses.first);
});
