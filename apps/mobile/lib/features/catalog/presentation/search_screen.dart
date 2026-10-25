import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/restaurant_query.dart';
import 'catalog_providers.dart';
import 'home_screen.dart';
import 'restaurant_list_sliver.dart';

/// Search tab: text query plus cuisine, sort, open-now and discount filters.
class SearchScreen extends ConsumerStatefulWidget {
  /// Creates the screen, optionally pre-filtered by [initialCuisine].
  const SearchScreen({super.key, this.initialCuisine, this.autofocus = false});

  final String? initialCuisine;
  final bool autofocus;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _text = TextEditingController();
  final _focus = FocusNode();
  Timer? _debounce;
  late RestaurantQuery _query = RestaurantQuery(cuisine: widget.initialCuisine);

  @override
  void initState() {
    super.initState();
    if (widget.autofocus) WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void didUpdateWidget(SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Arriving again from a home cuisine chip or the search entry.
    if (widget.initialCuisine != oldWidget.initialCuisine && widget.initialCuisine != null) {
      setState(() => _query = _query.copyWith(cuisine: widget.initialCuisine));
    }
    if (widget.autofocus && !oldWidget.autofocus) _focus.requestFocus();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _text.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _onTextChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (mounted) setState(() => _query = _query.copyWith(search: value));
    });
  }

  void _update(RestaurantQuery query) => setState(() => _query = query);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final cuisines = ref.watch(cuisinesProvider).value ?? const [];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(restaurantListProvider(_query).future),
          child: NotificationListener<ScrollNotification>(
            onNotification: (n) {
              if (n.metrics.axis == Axis.vertical && n.metrics.extentAfter < 600) {
                ref.read(restaurantListProvider(_query).notifier).loadMore();
              }
              return false;
            },
            child: CustomScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                    child: Text('جستجو', style: theme.titleLarge),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: TextField(
                      controller: _text,
                      focusNode: _focus,
                      textInputAction: TextInputAction.search,
                      onChanged: _onTextChanged,
                      onSubmitted: (v) => _update(_query.copyWith(search: v)),
                      decoration: InputDecoration(
                        hintText: 'نام رستوران یا غذا…',
                        prefixIcon: const Icon(Icons.search_rounded),
                        fillColor: AppColors.surface,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        suffixIcon: ListenableBuilder(
                          listenable: _text,
                          builder: (_, _) => _text.text.isEmpty
                              ? const SizedBox.shrink()
                              : IconButton(
                                  tooltip: 'پاک کردن',
                                  icon: const Icon(Icons.close_rounded),
                                  onPressed: () {
                                    _text.clear();
                                    _update(_query.copyWith(search: ''));
                                  },
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (cuisines.isNotEmpty)
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 104,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: cuisines.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 10),
                        itemBuilder: (_, i) {
                          final cuisine = cuisines[i];
                          final selected = _query.cuisine == cuisine.slug;
                          return CuisineTile(
                            cuisine: cuisine,
                            selected: selected,
                            onTap: () => _update(
                              selected ? _query.copyWith(clearCuisine: true) : _query.copyWith(cuisine: cuisine.slug),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 48,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      children: [
                        _SortMenu(selected: _query.sort, onSelected: (s) => _update(_query.copyWith(sort: s))),
                        const SizedBox(width: 8),
                        _ToggleChip(
                          label: 'فقط باز',
                          icon: Icons.storefront_rounded,
                          selected: _query.openNow,
                          onTap: () => _update(_query.copyWith(openNow: !_query.openNow)),
                        ),
                        const SizedBox(width: 8),
                        _ToggleChip(
                          label: 'تخفیف‌دار',
                          icon: Icons.local_offer_rounded,
                          selected: _query.hasDiscount,
                          onTap: () => _update(_query.copyWith(hasDiscount: !_query.hasDiscount)),
                        ),
                      ],
                    ),
                  ),
                ),
                RestaurantListSliver(query: _query),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({required this.label, required this.icon, required this.selected, required this.onTap});

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      avatar: Icon(icon, size: 16, color: selected ? Colors.white : AppColors.textSecondary),
      label: Text(label),
      selected: selected,
      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(color: selected ? Colors.white : AppColors.textPrimary),
      onSelected: (_) => onTap(),
    );
  }
}

class _SortMenu extends StatelessWidget {
  const _SortMenu({required this.selected, required this.onSelected});

  final RestaurantSort selected;
  final ValueChanged<RestaurantSort> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<RestaurantSort>(
      tooltip: 'مرتب‌سازی',
      initialValue: selected,
      onSelected: onSelected,
      position: PopupMenuPosition.under,
      itemBuilder: (_) => [
        for (final sort in RestaurantSort.values) PopupMenuItem(value: sort, child: Text(sort.label)),
      ],
      child: Chip(
        avatar: const Icon(Icons.sort_rounded, size: 16, color: AppColors.primary),
        label: Text(selected.label),
        deleteIcon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
        onDeleted: null,
      ),
    );
  }
}
