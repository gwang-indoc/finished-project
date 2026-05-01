import { describe, it, expect } from 'vitest';
import { readingTime } from '@/lib/reading-time';

describe('readingTime', () => {
  it('returns 0 for empty string', () => {
    expect(readingTime('')).toBe(0);
  });

  it('returns 0 for whitespace-only strings', () => {
    expect(readingTime('   \n\t  ')).toBe(0);
  });

  it('returns 1 for a short string (rounds up)', () => {
    expect(readingTime('hello world')).toBe(1);
  });

  it('returns 1 for a single word', () => {
    expect(readingTime('hello')).toBe(1);
  });

  it('returns 1 for exactly 200 words', () => {
    const input = Array.from({ length: 200 }, () => 'word').join(' ');
    expect(readingTime(input)).toBe(1);
  });

  it('returns 2 for exactly 201 words', () => {
    const input = Array.from({ length: 201 }, () => 'word').join(' ');
    expect(readingTime(input)).toBe(2);
  });

  it('returns 3 for exactly 600 words', () => {
    const input = Array.from({ length: 600 }, () => 'word').join(' ');
    expect(readingTime(input)).toBe(3);
  });
});
