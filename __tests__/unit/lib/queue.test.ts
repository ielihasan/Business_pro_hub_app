import { ticketLabel, formatWait, isUuidFormat } from '@/lib/queue';

describe('ticketLabel', () => {
  it('returns placeholder prefix when no joinedAt provided', () => {
    expect(ticketLabel(1)).toBe('BHP-0000-0000-001');
    expect(ticketLabel(9)).toBe('BHP-0000-0000-009');
  });

  it('pads position to 3 digits with no joinedAt', () => {
    expect(ticketLabel(42)).toBe('BHP-0000-0000-042');
    expect(ticketLabel(100)).toBe('BHP-0000-0000-100');
    expect(ticketLabel(0)).toBe('BHP-0000-0000-000');
  });

  it('encodes date and time components from joinedAt', () => {
    // 2026-04-11T14:56:00.000Z — day=11, month=04, hour=14, min=56 (UTC)
    const joined = '2026-04-11T14:56:00.000Z';
    const label = ticketLabel(1, joined);
    expect(label).toMatch(/^BHP-\d{4}-\d{4}-001$/);
  });

  it('always starts with BHP-', () => {
    [1, 10, 100, 500].forEach(n => {
      expect(ticketLabel(n)).toMatch(/^BHP-/);
    });
  });

  it('always has three dash-separated segments after BHP', () => {
    const label = ticketLabel(7, '2026-01-05T09:03:00.000Z');
    const parts = label.split('-');
    // BHP, DDMM, HHMM, NNN → 4 parts
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('BHP');
    expect(parts[3]).toBe('007');
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
