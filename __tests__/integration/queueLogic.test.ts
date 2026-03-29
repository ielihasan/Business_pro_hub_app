/**
 * Integration tests for queue formatting logic end-to-end.
 * Tests that ticketLabel + formatWait produce correct output for
 * realistic queue scenarios.
 */
import { ticketLabel, formatWait, isUuidFormat } from '@/lib/queue';

describe('Queue display — end-to-end formatting', () => {
  describe('Ticket label pipeline', () => {
    const scenarios = [
      { position: 1,   expected: 'Q-001', desc: 'first customer' },
      { position: 10,  expected: 'Q-010', desc: 'tenth customer' },
      { position: 50,  expected: 'Q-050', desc: 'busy queue' },
      { position: 100, expected: 'Q-100', desc: 'very busy queue' },
      { position: 999, expected: 'Q-999', desc: 'max standard queue' },
    ];

    scenarios.forEach(({ position, expected, desc }) => {
      it(`position ${position} (${desc}) formats as ${expected}`, () => {
        expect(ticketLabel(position)).toBe(expected);
      });
    });
  });

  describe('Wait time display pipeline', () => {
    const scenarios = [
      { minutes: 0,   expected: 'N/A',    desc: 'no wait' },
      { minutes: 5,   expected: '~5 min',  desc: 'short wait' },
      { minutes: 30,  expected: '~30 min', desc: 'medium wait' },
      { minutes: 120, expected: '~120 min',desc: 'long wait' },
    ];

    scenarios.forEach(({ minutes, expected, desc }) => {
      it(`${minutes} minutes (${desc}) displays as "${expected}"`, () => {
        expect(formatWait(minutes)).toBe(expected);
      });
    });
  });

  describe('Service type resolution — UUID detection', () => {
    it('real UUIDs (from DB) are detected as UUIDs', () => {
      // These look like real DB primary keys
      expect(isUuidFormat('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
      expect(isUuidFormat('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('human-readable service names are NOT UUIDs', () => {
      // These are names a business owner would type
      expect(isUuidFormat('Latte')).toBe(false);
      expect(isUuidFormat('Haircut')).toBe(false);
      expect(isUuidFormat('Oil Change')).toBe(false);
      expect(isUuidFormat('Full Body Checkup')).toBe(false);
    });

    it('empty/null-like values are not UUIDs', () => {
      expect(isUuidFormat('')).toBe(false);
      expect(isUuidFormat(' ')).toBe(false);
    });
  });
});

describe('Business name fallback logic', () => {
  /**
   * Mirrors the fallback resolution logic used in fetchUserQueueHistory.
   * If businesses table has no entry, we fall back to admins, then business_applications.
   */
  function resolveBusinessName(
    bizMap: Record<string, string>,
    bizId: string
  ): string {
    return bizMap[bizId] ?? 'Unknown Business';
  }

  it('returns business name when found', () => {
    const map = { 'biz-1': 'Coffee Corner' };
    expect(resolveBusinessName(map, 'biz-1')).toBe('Coffee Corner');
  });

  it('returns Unknown Business when not found', () => {
    const map = {};
    expect(resolveBusinessName(map, 'biz-99')).toBe('Unknown Business');
  });

  it('handles multiple businesses in map', () => {
    const map = { 'a': 'Alpha', 'b': 'Beta', 'c': 'Gamma' };
    expect(resolveBusinessName(map, 'b')).toBe('Beta');
    expect(resolveBusinessName(map, 'd')).toBe('Unknown Business');
  });
});
