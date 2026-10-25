import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/persian_format.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/common.dart';
import '../../../core/widgets/shimmer.dart';
import '../../../core/widgets/state_views.dart';
import '../../cart/domain/cart.dart';
import '../../cart/presentation/cart_bar.dart';
import '../../cart/presentation/cart_controller.dart';
import '../data/restaurant_repository.dart';
import '../domain/menu_item.dart';
import '../domain/restaurant_detail.dart';
import 'dish_tile.dart';
import 'reviews_section.dart';

/// Restaurant page: cover, info, menu sections with sticky chips, reviews
/// and the sticky cart bar.
class RestaurantScreen extends ConsumerWidget {
  /// Creates the page for [slug].
  const RestaurantScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Keep cart prices/availability in sync with the latest menu.
    ref.listen(restaurantDetailProvider(slug), (_, next) {
      if (next.hasValue) ref.read(cartProvider.notifier).sync(next.requireValue);
    });

    return ref.watch(restaurantDetailProvider(slug)).when(
          loading: () => const _RestaurantSkeleton(),
          error: (error, _) => Scaffold(
            appBar: AppBar(),
            body: ErrorView(error: error, onRetry: () => ref.invalidate(restaurantDetailProvider(slug))),
          ),
          data: (restaurant) => _RestaurantView(restaurant: restaurant),
        );
  }
}

class _RestaurantView extends ConsumerStatefulWidget {
  const _RestaurantView({required this.restaurant});

  final RestaurantDetail restaurant;

  @override
  ConsumerState<_RestaurantView> createState() => _RestaurantViewState();
}

class _RestaurantViewState extends ConsumerState<_RestaurantView> {
  static const _expandedHeight = 230.0;
  static const _tabsHeight = 56.0;

  final _scroll = ScrollController();
  final _sectionKeys = <int, GlobalKey>{};
  final _chipKeys = <int, GlobalKey>{};
  int? _activeSection;
  bool _collapsed = false;
  bool _jumping = false;

  RestaurantDetail get _r => widget.restaurant;

  @override
  void initState() {
    super.initState();
    for (final s in _r.sections) {
      _sectionKeys[s.id] = GlobalKey();
      _chipKeys[s.id] = GlobalKey();
    }
    _activeSection = _r.sections.isEmpty ? null : _r.sections.first.id;
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  /// Bottom edge of the pinned app bar + section chips, in global coordinates.
  double get _pinnedBottom => MediaQuery.paddingOf(context).top + kToolbarHeight + _tabsHeight;

  void _onScroll() {
    final collapsed = _scroll.offset > _expandedHeight - kToolbarHeight - 20;
    if (collapsed != _collapsed) setState(() => _collapsed = collapsed);
    if (_jumping) return;

    int? active = _r.sections.isEmpty ? null : _r.sections.first.id;
    for (final s in _r.sections) {
      final box = _sectionKeys[s.id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.attached) continue;
      if (box.localToGlobal(Offset.zero).dy <= _pinnedBottom + 24) active = s.id;
    }
    if (active != _activeSection) {
      setState(() => _activeSection = active);
      _revealChip(active);
    }
  }

  void _revealChip(int? id) {
    final chip = _chipKeys[id]?.currentContext;
    if (chip != null) {
      Scrollable.ensureVisible(chip, alignment: 0.5, duration: const Duration(milliseconds: 250));
    }
  }

  Future<void> _jumpTo(int sectionId) async {
    final box = _sectionKeys[sectionId]?.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return;
    setState(() => _activeSection = sectionId);
    _revealChip(sectionId);
    _jumping = true;
    final viewport = RenderAbstractViewport.of(box);
    final reveal = viewport.getOffsetToReveal(box, 0).offset;
    final topInset = kToolbarHeight + _tabsHeight + MediaQuery.paddingOf(context).top;
    final target = (reveal - topInset + 8).clamp(0.0, _scroll.position.maxScrollExtent);
    await _scroll.animateTo(target, duration: const Duration(milliseconds: 380), curve: Curves.easeOutCubic);
    _jumping = false;
  }

  @override
  Widget build(BuildContext context) {
    final r = _r;
    final cartRestaurant = CartRestaurant.fromDetail(r);
    final cartHere = ref.watch(cartProvider.select((c) => c.isNotEmpty && c.restaurant!.id == r.id));

    return Scaffold(
      body: CustomScrollView(
        controller: _scroll,
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: _expandedHeight,
            backgroundColor: AppColors.background,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: _CircleButton(
                icon: Icons.arrow_back_rounded,
                tooltip: 'بازگشت',
                onTap: () => context.canPop() ? context.pop() : context.go('/home'),
                flat: _collapsed,
              ),
            ),
            title: AnimatedOpacity(
              opacity: _collapsed ? 1 : 0,
              duration: const Duration(milliseconds: 180),
              child: Text(r.name),
            ),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Stack(
                fit: StackFit.expand,
                children: [
                  AppNetworkImage(r.cover, greyscale: !r.isOpen),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x66000000), Color(0x00000000), Color(0x8C000000)],
                        stops: [0, 0.45, 1],
                      ),
                    ),
                  ),
                  PositionedDirectional(
                    start: 16,
                    bottom: 16,
                    end: 16,
                    child: Row(
                      children: [
                        Pill(
                          label: r.isOpen ? 'باز است' : 'بسته است',
                          icon: r.isOpen ? Icons.storefront_rounded : Icons.lock_clock_rounded,
                          color: Colors.white,
                          background: r.isOpen ? AppColors.success : const Color(0xCC221B17),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(child: _InfoHeader(restaurant: r)),
          if (!r.isOpen) const SliverToBoxAdapter(child: _ClosedBanner()),
          if (r.sections.isNotEmpty)
            SliverPersistentHeader(
              pinned: true,
              delegate: _SectionChipsDelegate(
                height: _tabsHeight,
                child: _SectionChips(
                  sections: [for (final s in r.sections) (id: s.id, name: s.name, key: _chipKeys[s.id]!)],
                  active: _activeSection,
                  onTap: _jumpTo,
                ),
              ),
            ),
          SliverToBoxAdapter(
            // Built eagerly (menus are small) so section positions are known
            // for the chip navigation.
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final section in r.sections) ...[
                  Padding(
                    key: _sectionKeys[section.id],
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                    child: Row(
                      children: [
                        Text(section.name, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(width: 8),
                        Text(
                          '(${toPersianDigits(section.items.length)})',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  for (final MenuItem item in section.items)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                      child: DishTile(item: item, restaurant: cartRestaurant),
                    ),
                ],
                if (r.sections.isEmpty)
                  const EmptyState(icon: Icons.menu_book_rounded, title: 'منوی این رستوران هنوز آماده نیست'),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: ReviewsSection(restaurantId: r.id, rating: r.rating, ratingCount: r.ratingCount),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
      bottomNavigationBar: cartHere ? const SafeArea(top: false, child: CartBar()) : null,
    );
  }
}

class _InfoHeader extends StatelessWidget {
  const _InfoHeader({required this.restaurant});

  final RestaurantDetail restaurant;

  @override
  Widget build(BuildContext context) {
    final r = restaurant;
    final theme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(r.name, style: theme.titleLarge),
          Text(r.cuisineNames, style: theme.bodySmall),
          if (r.description != null && r.description!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(r.description!, style: theme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
          ],
          const SizedBox(height: 14),
          SurfaceCard(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  _Stat(
                    icon: Icons.star_rounded,
                    iconColor: AppColors.star,
                    value: r.rating > 0 ? formatRating(r.rating) : 'جدید',
                    label: '${toPersianDigits(r.ratingCount)} نظر',
                  ),
                  const VerticalDivider(width: 1),
                  _Stat(
                    icon: Icons.schedule_rounded,
                    value: '${toPersianDigits(r.deliveryTimeMin)}–${toPersianDigits(r.deliveryTimeMax)}',
                    label: 'دقیقه',
                  ),
                  const VerticalDivider(width: 1),
                  _Stat(
                    icon: Icons.delivery_dining_rounded,
                    value: r.deliveryFee == 0 ? 'رایگان' : formatNumber(r.deliveryFee),
                    label: 'هزینه‌ی ارسال',
                  ),
                  const VerticalDivider(width: 1),
                  _Stat(icon: Icons.shopping_basket_rounded, value: formatNumber(r.minOrder), label: 'حداقل سفارش'),
                ],
              ),
            ),
          ),
          if (r.address != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.place_outlined, size: 18, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Expanded(child: Text(r.address!, style: theme.bodySmall)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.value, required this.label, this.iconColor});

  final IconData icon;
  final Color? iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return Expanded(
      child: Column(
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: iconColor ?? AppColors.primary),
              const SizedBox(width: 3),
              Flexible(
                child: Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.titleSmall?.copyWith(fontSize: 13, height: 1.4),
                ),
              ),
            ],
          ),
          Text(label, style: theme.bodySmall?.copyWith(fontSize: 11, height: 1.4)),
        ],
      ),
    );
  }
}

class _ClosedBanner extends StatelessWidget {
  const _ClosedBanner();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.saffronSoft, borderRadius: BorderRadius.circular(14)),
        child: Row(
          children: [
            const Icon(Icons.info_rounded, color: Color(0xFF8A5A00)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'این رستوران در حال حاضر بسته است؛ می‌توانید منو را ببینید اما امکان ثبت سفارش نیست.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF6B4600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

typedef _SectionChip = ({int id, String name, GlobalKey key});

class _SectionChips extends StatelessWidget {
  const _SectionChips({required this.sections, required this.active, required this.onTap});

  final List<_SectionChip> sections;
  final int? active;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      itemCount: sections.length,
      separatorBuilder: (_, _) => const SizedBox(width: 8),
      itemBuilder: (_, i) {
        final s = sections[i];
        final selected = s.id == active;
        return ChoiceChip(
          key: s.key,
          label: Text(s.name),
          selected: selected,
          labelStyle: theme.labelMedium?.copyWith(color: selected ? Colors.white : AppColors.textPrimary),
          onSelected: (_) => onTap(s.id),
        );
      },
    );
  }
}

class _SectionChipsDelegate extends SliverPersistentHeaderDelegate {
  _SectionChipsDelegate({required this.child, required this.height});

  final Widget child;
  final double height;

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Material(
      color: AppColors.background,
      elevation: overlapsContent || shrinkOffset > 0 ? 1 : 0,
      shadowColor: Colors.black26,
      child: child,
    );
  }

  @override
  bool shouldRebuild(_SectionChipsDelegate oldDelegate) => true;
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onTap, required this.tooltip, this.flat = false});

  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;
  final bool flat;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: flat ? Colors.transparent : Colors.white,
      shape: const CircleBorder(),
      elevation: flat ? 0 : 2,
      child: IconButton(
        tooltip: tooltip,
        onPressed: onTap,
        icon: Icon(icon, color: AppColors.textPrimary, size: 22),
        padding: EdgeInsets.zero,
      ),
    );
  }
}

class _RestaurantSkeleton extends StatelessWidget {
  const _RestaurantSkeleton();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Shimmer(
        child: ListView(
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            const SkeletonBox(height: 260, radius: 0),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SkeletonBox(width: 180, height: 22),
                  const SizedBox(height: 10),
                  const SkeletonBox(width: 120, height: 12),
                  const SizedBox(height: 18),
                  const SkeletonBox(height: 64, radius: 18),
                  const SizedBox(height: 24),
                  for (var i = 0; i < 4; i++) ...[
                    const SkeletonBox(height: 124, radius: 18),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
