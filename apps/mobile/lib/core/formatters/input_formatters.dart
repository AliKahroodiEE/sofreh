import 'package:flutter/services.dart';

import 'persian_format.dart';

/// Shows every digit the user types (Latin, Persian or Arabic keyboard) as a
/// Persian digit. The value is converted back with [toLatinDigits] before it
/// is sent to the API.
///
/// Every digit maps to exactly one UTF-16 code unit, so the selection stays
/// valid without adjustment.
class PersianDigitsFormatter extends TextInputFormatter {
  /// Creates the formatter.
  const PersianDigitsFormatter();

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final converted = toPersianDigits(toLatinDigits(newValue.text));
    if (converted == newValue.text) return newValue;
    return newValue.copyWith(text: converted);
  }
}

/// Allows only digits (in any script).
final digitsOnlyFormatter = FilteringTextInputFormatter.allow(RegExp(r'[0-9۰-۹٠-٩]'));
