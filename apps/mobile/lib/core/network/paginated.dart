/// A page of results as returned by every list endpoint:
/// `{ items, total, page, limit }`.
class Paginated<T> {
  /// Creates a page.
  const Paginated({required this.items, required this.total, required this.page, required this.limit});

  /// Parses the API envelope, decoding each item with [fromJson].
  factory Paginated.fromJson(Map<String, dynamic> json, T Function(Map<String, dynamic>) fromJson) {
    return Paginated(
      items: (json['items'] as List<dynamic>).map((e) => fromJson(e as Map<String, dynamic>)).toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
    );
  }

  final List<T> items;
  final int total;
  final int page;
  final int limit;

  /// Whether another page exists after this one.
  bool get hasMore => page * limit < total;
}

/// Accumulated state of an infinitely scrolling list.
class PagedList<T> {
  /// Creates the state.
  const PagedList({
    required this.items,
    required this.total,
    required this.page,
    this.isLoadingMore = false,
    this.loadMoreError,
  });

  /// State after loading the first page.
  factory PagedList.first(Paginated<T> page) =>
      PagedList(items: page.items, total: page.total, page: page.page);

  final List<T> items;
  final int total;

  /// Last loaded page number (1-based).
  final int page;
  final bool isLoadingMore;

  /// Message of the last failed "load more", if any.
  final String? loadMoreError;

  /// Whether more items can be loaded.
  bool get hasMore => items.length < total;

  /// Appends the next page.
  PagedList<T> append(Paginated<T> next) =>
      PagedList(items: [...items, ...next.items], total: next.total, page: next.page);

  /// Copies with changed flags or items.
  PagedList<T> copyWith({List<T>? items, bool? isLoadingMore, String? loadMoreError}) => PagedList(
        items: items ?? this.items,
        total: total,
        page: page,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        loadMoreError: loadMoreError,
      );
}
