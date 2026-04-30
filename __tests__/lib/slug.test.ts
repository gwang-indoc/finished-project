import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slug';

describe('slugify', () => {
  it('lowercases ASCII and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips diacritics via NFD normalization', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('naïve')).toBe('naive');
  });

  it('collapses runs of punctuation into a single hyphen', () => {
    expect(slugify('foo!!bar??baz')).toBe('foo-bar-baz');
  });

  it('strips leading and trailing hyphens and whitespace', () => {
    expect(slugify('--hi--')).toBe('hi');
    expect(slugify('   spaces   ')).toBe('spaces');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('returns empty string when no characters survive normalization', () => {
    expect(slugify('你好')).toBe('');
  });
});
