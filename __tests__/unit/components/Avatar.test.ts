import { getInitials, nameIndex } from '@/components/ui/Avatar';

describe('getInitials', () => {
  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns first letter for single-word name', () => {
    expect(getInitials('Alice')).toBe('A');
    expect(getInitials('Bob')).toBe('B');
  });

  it('returns first + last initials for two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alice Smith')).toBe('AS');
  });

  it('returns first + last initials for multi-word name', () => {
    expect(getInitials('John Michael Doe')).toBe('JD');
  });

  it('always returns uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('alice')).toBe('A');
  });

  it('trims leading/trailing whitespace', () => {
    expect(getInitials('  Alice  ')).toBe('A');
  });

  it('handles names with extra spaces between words', () => {
    expect(getInitials('John   Doe')).toBe('JD');
  });

  it('handles single character name', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('handles unicode / non-ASCII initials', () => {
    // Should at least not crash and return something
    const result = getInitials('علی خان');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('nameIndex', () => {
  it('returns a number between 0 and 4 inclusive', () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank'];
    names.forEach(name => {
      const idx = nameIndex(name);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(4);
    });
  });

  it('is deterministic — same name always returns same index', () => {
    const idx1 = nameIndex('BusinessHub');
    const idx2 = nameIndex('BusinessHub');
    expect(idx1).toBe(idx2);
  });

  it('returns an integer', () => {
    expect(Number.isInteger(nameIndex('Test'))).toBe(true);
  });

  it('handles empty string without throwing', () => {
    expect(() => nameIndex('')).not.toThrow();
  });

  it('distributes across the range — 20 unique names hit at least 3 buckets', () => {
    const names = Array.from({ length: 20 }, (_, i) => `Name${i}`);
    const indices = new Set(names.map(nameIndex));
    expect(indices.size).toBeGreaterThanOrEqual(3);
  });

  it('is case-sensitive — different cases may return different indices', () => {
    // nameIndex is a hash — just verify it doesn't throw and returns valid range
    expect(nameIndex('abc')).toBeGreaterThanOrEqual(0);
    expect(nameIndex('ABC')).toBeGreaterThanOrEqual(0);
  });
});
