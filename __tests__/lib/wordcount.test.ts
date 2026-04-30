import { describe, it, expect } from 'vitest';
import { wordCount } from '@/lib/wordcount';

describe('wordCount', () => {
  it('returns zero for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('returns zero for whitespace-only strings', () => {
    expect(wordCount('   ')).toBe(0);
    expect(wordCount('\n\t  ')).toBe(0);
  });

  it('returns one for a single word', () => {
    expect(wordCount('hello')).toBe(1);
  });

  it('counts multiple words separated by single spaces', () => {
    expect(wordCount('hello world')).toBe(2);
  });

  it('treats runs of whitespace as a single separator', () => {
    expect(wordCount('one  two   three')).toBe(3);
  });

  it('trims leading and trailing whitespace before counting', () => {
    expect(wordCount('  hello world  ')).toBe(2);
  });

  it('treats newlines and tabs as separators', () => {
    expect(wordCount('a\nb\nc')).toBe(3);
    expect(wordCount('a\tb c')).toBe(3);
  });
});
