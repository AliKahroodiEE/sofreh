/// Sort orders supported by `GET /restaurants`.
enum RestaurantSort {
  recommended('recommended', 'پیشنهادی'),
  rating('rating', 'بیشترین امتیاز'),
  deliveryTime('delivery_time', 'سریع‌ترین ارسال'),
  deliveryFee('delivery_fee', 'کمترین هزینه‌ی ارسال');

  const RestaurantSort(this.apiValue, this.label);

  /// Value of the `sort` query parameter.
  final String apiValue;

  /// Persian label for chips.
  final String label;
}

/// Filters for `GET /restaurants`. Value-equal so it can key a provider family.
class RestaurantQuery {
  /// Creates a query.
  const RestaurantQuery({
    this.search = '',
    this.cuisine,
    this.sort = RestaurantSort.recommended,
    this.openNow = false,
    this.hasDiscount = false,
  });

  final String search;

  /// Cuisine slug.
  final String? cuisine;
  final RestaurantSort sort;
  final bool openNow;
  final bool hasDiscount;

  /// Query parameters for the request (empty filters are omitted).
  Map<String, dynamic> toQueryParameters() => {
        if (search.trim().isNotEmpty) 'search': search.trim(),
        if (cuisine != null) 'cuisine': cuisine,
        'sort': sort.apiValue,
        if (openNow) 'openNow': 'true',
        if (hasDiscount) 'hasDiscount': 'true',
      };

  /// Copies with changes; pass `clearCuisine: true` to remove the cuisine.
  RestaurantQuery copyWith({
    String? search,
    String? cuisine,
    bool clearCuisine = false,
    RestaurantSort? sort,
    bool? openNow,
    bool? hasDiscount,
  }) =>
      RestaurantQuery(
        search: search ?? this.search,
        cuisine: clearCuisine ? null : (cuisine ?? this.cuisine),
        sort: sort ?? this.sort,
        openNow: openNow ?? this.openNow,
        hasDiscount: hasDiscount ?? this.hasDiscount,
      );

  @override
  bool operator ==(Object other) =>
      other is RestaurantQuery &&
      other.search == search &&
      other.cuisine == cuisine &&
      other.sort == sort &&
      other.openNow == openNow &&
      other.hasDiscount == hasDiscount;

  @override
  int get hashCode => Object.hash(search, cuisine, sort, openNow, hasDiscount);
}
