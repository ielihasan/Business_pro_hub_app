import { statusLabel, formatDate, formatTime, statusColor } from '@/components/orders/OrderCard';

// ── statusLabel ───────────────────────────────────────────────────────────────

describe('statusLabel', () => {
  it('converts in_progress to IN PROGRESS', () => {
    expect(statusLabel('in_progress')).toBe('IN PROGRESS');
  });

  it('uppercases waiting', () => {
    expect(statusLabel('waiting')).toBe('WAITING');
  });

  it('uppercases completed', () => {
    expect(statusLabel('completed')).toBe('COMPLETED');
  });

  it('uppercases cancelled', () => {
    expect(statusLabel('cancelled')).toBe('CANCELLED');
  });

  it('handles unknown status gracefully', () => {
    expect(statusLabel('unknown')).toBe('UNKNOWN');
  });

  it('returns a string for any input', () => {
    expect(typeof statusLabel('')).toBe('string');
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns a non-empty string', () => {
    expect(formatDate('2026-03-15T10:30:00Z').length).toBeGreaterThan(0);
  });

  it('contains the year', () => {
    expect(formatDate('2026-03-15T10:30:00Z')).toContain('2026');
  });

  it('does not include time', () => {
    const result = formatDate('2026-03-15T10:30:00Z');
    // Should not look like it has HH:MM:SS
    expect(result).not.toMatch(/\d{2}:\d{2}/);
  });

  it('handles different months correctly', () => {
    const jan = formatDate('2026-01-01T00:00:00Z');
    const dec = formatDate('2026-12-31T00:00:00Z');
    expect(jan).not.toBe(dec);
  });

  it('is consistent for the same ISO string', () => {
    const iso = '2026-06-15T12:00:00Z';
    expect(formatDate(iso)).toBe(formatDate(iso));
  });
});

// ── formatTime ────────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('returns a non-empty string', () => {
    expect(formatTime('2026-03-15T10:30:00Z').length).toBeGreaterThan(0);
  });

  it('contains AM or PM', () => {
    expect(formatTime('2026-03-15T10:30:00Z')).toMatch(/AM|PM/);
  });

  it('contains hours and minutes separated by colon', () => {
    expect(formatTime('2026-03-15T14:30:00Z')).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns different values for different times', () => {
    const morning = formatTime('2026-03-15T08:00:00Z');
    const evening = formatTime('2026-03-15T20:00:00Z');
    expect(morning).not.toBe(evening);
  });

  it('is consistent for the same ISO string', () => {
    const iso = '2026-03-15T09:15:00Z';
    expect(formatTime(iso)).toBe(formatTime(iso));
  });
});

// ── statusColor ───────────────────────────────────────────────────────────────

describe('statusColor', () => {
  const mockColors = {
    statusWaiting:    '#F59E0B',
    statusInProgress: '#3B82F6',
    success:          '#22c55e',
    destructive:      '#DC2626',
    mutedForeground:  '#737373',
    card:             '#FFFFFF',
  };

  it('waiting — uses statusWaiting color', () => {
    const { fg, bg } = statusColor('waiting', mockColors);
    expect(fg).toBe(mockColors.statusWaiting);
    expect(bg).toContain(mockColors.statusWaiting);
  });

  it('in_progress — uses statusInProgress color', () => {
    const { fg } = statusColor('in_progress', mockColors);
    expect(fg).toBe(mockColors.statusInProgress);
  });

  it('completed — uses success color', () => {
    const { fg } = statusColor('completed', mockColors);
    expect(fg).toBe(mockColors.success);
  });

  it('cancelled — uses destructive color', () => {
    const { fg } = statusColor('cancelled', mockColors);
    expect(fg).toBe(mockColors.destructive);
  });

  it('unknown status — falls back to muted/card', () => {
    const { fg, bg } = statusColor('unknown', mockColors);
    expect(fg).toBe(mockColors.mutedForeground);
    expect(bg).toBe(mockColors.card);
  });

  it('always returns an object with fg and bg', () => {
    ['waiting', 'in_progress', 'completed', 'cancelled', 'unknown'].forEach(s => {
      const result = statusColor(s, mockColors);
      expect(result).toHaveProperty('fg');
      expect(result).toHaveProperty('bg');
    });
  });

  it('bg string includes the fg color (alpha overlay pattern)', () => {
    const { fg, bg } = statusColor('waiting', mockColors);
    // bg is fg + '18' hex alpha suffix
    expect(bg).toContain(fg);
  });
});
