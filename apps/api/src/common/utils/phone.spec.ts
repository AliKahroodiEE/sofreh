import { normalizeIranMobile } from './phone.js';

describe('normalizeIranMobile', () => {
  it.each([
    ['09121234567', '09121234567'],
    ['۰۹۱۲۱۲۳۴۵۶۷', '09121234567'],
    ['+989121234567', '09121234567'],
    ['00989121234567', '09121234567'],
    ['9121234567', '09121234567'],
    ['0912 123 4567', '09121234567'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeIranMobile(input)).toBe(expected);
  });

  it.each(['0212345678', '0912123456', '123', 'abc'])('rejects %s', (input) => {
    expect(normalizeIranMobile(input)).toBeNull();
  });
});
