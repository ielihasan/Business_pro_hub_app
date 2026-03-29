import { ticketLabel, formatWait, isUuidFormat } from '@/lib/queue';

describe('ticketLabel', () => {
  it('pads single-digit positions to 3 digits', () => {
    expect(ticketLabel(1)).toBe('Q-001');
    expect(ticketLabel(9)).toBe('Q-009');
  });

  it('pads double-digit positions', () => {
    expect(ticketLabel(42)).toBe('Q-042');
    expect(ticketLabel(99)).toBe('Q-099');
  });

  it('does not pad 3-digit positions', () => {
    expect(ticketLabel(100)).toBe('Q-100');
    expect(ticketLabel(999)).toBe('Q-999');
  });

  it('handles position 0', () => {
    expect(ticketLabel(0)).toBe('Q-000');
  });

  it('always starts with Q-', () => {
    [1, 10, 100, 500].forEach(n => {
      expect(ticketLabel(n)).toMatch(/^Q-/);
    });
  });
});

describe('formatWait', () => {
  it('returns N/A for 0', () => {
    expect(formatWait(0)).toBe('N/A');
  });

  it('returns N/A for falsy values', () => {
    expect(formatWait(0)).toBe('N/A');
  });

  it('formats minutes with ~ prefix', () => {
    expect(formatWait(5)).toBe('~5 min');
    expect(formatWait(10)).toBe('~10 min');
    expect(formatWait(60)).toBe('~60 min');
  });

  it('returns a string always', () => {
    expect(typeof formatWait(1)).toBe('string');
    expect(typeof formatWait(0)).toBe('string');
  });

  it('includes the minute count in the string', () => {
    expect(formatWait(25)).toContain('25');
  });
});

describe('isUuidFormat', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts a valid lowercase UUID', () => {
    expect(isUuidFormat(VALID_UUID)).toBe(true);
  });

  it('accepts a valid UPPERCASE UUID', () => {
    expect(isUuidFormat(VALID_UUID.toUpperCase())).toBe(true);
  });

  it('accepts mixed-case UUID', () => {
    expect(isUuidFormat('550E8400-e29b-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects a plain string', () => {
    expect(isUuidFormat('LATTE')).toBe(false);
    expect(isUuidFormat('coffee')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isUuidFormat('')).toBe(false);
  });

  it('rejects UUID missing dashes', () => {
    expect(isUuidFormat('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects UUID with wrong segment lengths', () => {
    expect(isUuidFormat('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
  });

  it('rejects UUID with non-hex characters', () => {
    expect(isUuidFormat('550e8400-e29b-41d4-a716-44665544000z')).toBe(false);
  });

  it('rejects numeric-only string', () => {
    expect(isUuidFormat('12345')).toBe(false);
  });
});
