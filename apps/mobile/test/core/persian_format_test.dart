import 'package:flutter_test/flutter_test.dart';
import 'package:sofreh/core/formatters/persian_format.dart';

void main() {
  group('digits', () {
    test('toPersianDigits converts only Latin digits', () {
      expect(toPersianDigits('SF-0123 4567 89'), 'SF-۰۱۲۳ ۴۵۶۷ ۸۹');
      expect(toPersianDigits(42), '۴۲');
    });

    test('toLatinDigits handles Persian and Arabic digits', () {
      expect(toLatinDigits('۰۹۱۲۱۱۱۱۱۱۱'), '09121111111');
      expect(toLatinDigits('٠٩١٢'), '0912');
    });
  });

  group('money', () {
    test('formatNumber groups thousands with the Persian separator', () {
      expect(formatNumber(0), '۰');
      expect(formatNumber(999), '۹۹۹');
      expect(formatNumber(1000), '۱٬۰۰۰');
      expect(formatNumber(1234567), '۱٬۲۳۴٬۵۶۷');
      expect(formatNumber(-60000), '−۶۰٬۰۰۰');
    });

    test('formatToman', () {
      expect(formatToman(123000), '۱۲۳٬۰۰۰ تومان');
      expect(formatDeliveryFee(0), 'ارسال رایگان');
      expect(formatDeliveryFee(30000), '۳۰٬۰۰۰ تومان');
    });

    test('rating and delivery time', () {
      expect(formatRating(4.5), '۴٫۵');
      expect(formatRating(4), '۴٫۰');
      expect(formatDeliveryTime(30, 45), '۳۰ تا ۴۵ دقیقه');
    });
  });

  group('phone', () {
    test('normalizeIranMobile mirrors the API', () {
      expect(normalizeIranMobile('۰۹۱۲۱۱۱۱۱۱۱'), '09121111111');
      expect(normalizeIranMobile('+989121111111'), '09121111111');
      expect(normalizeIranMobile('00989121111111'), '09121111111');
      expect(normalizeIranMobile('912 111 1111'), '09121111111');
      expect(normalizeIranMobile('0912-111-1111'), '09121111111');
      expect(normalizeIranMobile('0812111111'), isNull);
      expect(normalizeIranMobile('abc'), isNull);
    });

    test('formatPhone groups digits', () {
      expect(formatPhone('09121111111'), '۰۹۱۲ ۱۱۱ ۱۱۱۱');
    });
  });

  group('Jalali calendar', () {
    test('converts known dates', () {
      expect(JalaliDate.fromDateTime(DateTime(2025, 3, 21)), const JalaliDate(1404, 1, 1));
      expect(JalaliDate.fromDateTime(DateTime(2026, 10, 25)), const JalaliDate(1405, 8, 3));
      expect(JalaliDate.fromDateTime(DateTime(2024, 3, 19)), const JalaliDate(1402, 12, 29));
      expect(JalaliDate.fromDateTime(DateTime(2023, 12, 22)), const JalaliDate(1402, 10, 1));
    });

    test('formatDate uses month names and Persian digits', () {
      expect(formatDate(DateTime(2026, 10, 25, 12)), '۳ آبان ۱۴۰۵');
    });
  });
}
