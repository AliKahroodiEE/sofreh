/// Persian (fa-IR) formatting helpers: digits, money, phone numbers and
/// Jalali (Solar Hijri) dates. Pure functions, covered by unit tests in
/// `test/core/persian_format_test.dart`.
library;

const String _persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const String _arabicDigits = '٠١٢٣٤٥٦٧٨٩';

/// Wraps [text] in a left-to-right isolate (LRI … PDI) so numbers like phone
/// numbers keep their order inside right-to-left sentences.
String ltr(String text) => '\u2066$text\u2069';

/// Persian thousands separator (U+066C).
const String persianThousandsSeparator = '٬';

/// Persian decimal separator (U+066B).
const String persianDecimalSeparator = '٫';

/// Replaces Latin digits with Persian digits: `"12:05"` → `"۱۲:۰۵"`.
String toPersianDigits(Object? input) {
  final text = input?.toString() ?? '';
  final buffer = StringBuffer();
  for (final unit in text.codeUnits) {
    if (unit >= 0x30 && unit <= 0x39) {
      buffer.write(_persianDigits[unit - 0x30]);
    } else {
      buffer.writeCharCode(unit);
    }
  }
  return buffer.toString();
}

/// Replaces Persian and Arabic-Indic digits with Latin digits.
String toLatinDigits(String input) {
  final buffer = StringBuffer();
  for (final char in input.split('')) {
    final persian = _persianDigits.indexOf(char);
    final arabic = _arabicDigits.indexOf(char);
    if (persian >= 0) {
      buffer.write(persian);
    } else if (arabic >= 0) {
      buffer.write(arabic);
    } else {
      buffer.write(char);
    }
  }
  return buffer.toString();
}

/// Groups an integer by thousands with Persian digits: `1234567` → `"۱٬۲۳۴٬۵۶۷"`.
String formatNumber(int value) {
  final negative = value < 0;
  final digits = value.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) {
      buffer.write(persianThousandsSeparator);
    }
    buffer.write(digits[i]);
  }
  return '${negative ? '−' : ''}${toPersianDigits(buffer.toString())}';
}

/// Formats an amount in toman: `123000` → `"۱۲۳٬۰۰۰ تومان"`.
String formatToman(int amount) => '${formatNumber(amount)} تومان';

/// Formats a delivery fee; zero becomes «ارسال رایگان».
String formatDeliveryFee(int fee) => fee == 0 ? 'ارسال رایگان' : formatToman(fee);

/// One-decimal rating with the Persian decimal separator: `4.5` → `"۴٫۵"`.
String formatRating(double rating) {
  final fixed = rating.toStringAsFixed(1).replaceAll('.', persianDecimalSeparator);
  return toPersianDigits(fixed);
}

/// Delivery window: `(30, 45)` → `"۳۰ تا ۴۵ دقیقه"`.
String formatDeliveryTime(int min, int max) {
  if (min == max) return '${toPersianDigits(min)} دقیقه';
  return '${toPersianDigits(min)} تا ${toPersianDigits(max)} دقیقه';
}

/// Normalises an Iranian mobile number to `09xxxxxxxxx`, mirroring the API.
///
/// Accepts Persian/Arabic digits, `+98`, `0098`, a missing leading zero and
/// spaces or dashes. Returns `null` when the input is not a valid mobile number.
String? normalizeIranMobile(String input) {
  var phone = toLatinDigits(input).replaceAll(RegExp(r'[\s\-()]'), '');
  if (phone.startsWith('+98')) {
    phone = '0${phone.substring(3)}';
  } else if (phone.startsWith('0098')) {
    phone = '0${phone.substring(4)}';
  } else if (RegExp(r'^9\d{9}$').hasMatch(phone)) {
    phone = '0$phone';
  }
  return RegExp(r'^09\d{9}$').hasMatch(phone) ? phone : null;
}

/// Displays a normalised mobile number as `"۰۹۱۲ ۱۱۱ ۱۱۱۱"`.
String formatPhone(String phone) {
  final latin = toLatinDigits(phone);
  if (latin.length != 11) return toPersianDigits(latin);
  return toPersianDigits(
    '${latin.substring(0, 4)} ${latin.substring(4, 7)} ${latin.substring(7)}',
  );
}

/// A date in the Jalali (Solar Hijri) calendar used in Iran.
class JalaliDate {
  /// Creates a Jalali date. [month] is 1-based (1 = فروردین).
  const JalaliDate(this.year, this.month, this.day);

  /// Converts a Gregorian date (only its year/month/day are used).
  factory JalaliDate.fromDateTime(DateTime date) {
    const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    final gy = date.year;
    final gm = date.month;
    final gd = date.day;
    final gy2 = gm > 2 ? gy + 1 : gy;
    var days = 355666 +
        365 * gy +
        (gy2 + 3) ~/ 4 -
        (gy2 + 99) ~/ 100 +
        (gy2 + 399) ~/ 400 +
        gd +
        daysBeforeMonth[gm - 1];
    var jy = -1595 + 33 * (days ~/ 12053);
    days %= 12053;
    jy += 4 * (days ~/ 1461);
    days %= 1461;
    if (days > 365) {
      jy += (days - 1) ~/ 365;
      days = (days - 1) % 365;
    }
    final int jm;
    final int jd;
    if (days < 186) {
      jm = 1 + days ~/ 31;
      jd = 1 + days % 31;
    } else {
      jm = 7 + (days - 186) ~/ 30;
      jd = 1 + (days - 186) % 30;
    }
    return JalaliDate(jy, jm, jd);
  }

  final int year;
  final int month;
  final int day;

  static const monthNames = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];

  /// Month name, e.g. «آبان».
  String get monthName => monthNames[month - 1];

  @override
  bool operator ==(Object other) =>
      other is JalaliDate && other.year == year && other.month == month && other.day == day;

  @override
  int get hashCode => Object.hash(year, month, day);

  @override
  String toString() => '$year/$month/$day';
}

/// Clock time with Persian digits: `"۰۹:۰۵"`.
String formatTime(DateTime dateTime) {
  final local = dateTime.toLocal();
  final hh = local.hour.toString().padLeft(2, '0');
  final mm = local.minute.toString().padLeft(2, '0');
  return toPersianDigits('$hh:$mm');
}

/// Jalali date: `"۳ آبان ۱۴۰۵"`.
String formatDate(DateTime dateTime) {
  final j = JalaliDate.fromDateTime(dateTime.toLocal());
  return '${toPersianDigits(j.day)} ${j.monthName} ${toPersianDigits(j.year)}';
}

/// Jalali date and time: `"۳ آبان ۱۴۰۵، ۱۰:۴۵"`.
String formatDateTime(DateTime dateTime) => '${formatDate(dateTime)}، ${formatTime(dateTime)}';
