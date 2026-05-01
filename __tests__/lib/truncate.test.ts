import { describe, it, expect } from 'vitest';
import { truncate } from '@/lib/truncate';

describe('truncate', () => {
  it('returns input unchanged when shorter than limit', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });

  it('returns input unchanged when equal to limit', () => {
    expect(truncate('exactlyten', 10)).toBe('exactlyten');
  });

  it('truncates to maxLength with ellipsis when longer', () => {
    const result = truncate('hello world', 8);
    expect(result).toBe('hello w…');
    expect(result.length).toBe(8);
  });

  it('returns empty string unchanged', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('truncates to maxLength=4 replacing last char with ellipsis', () => {
    const result = truncate('abcdef', 4);
    expect(result).toBe('abc…');
    expect(result.length).toBe(4);
  });
});
