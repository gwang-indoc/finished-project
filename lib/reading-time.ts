import { wordCount } from '@/lib/wordcount';

export function readingTime(input: string): number {
  const n = wordCount(input);
  if (n === 0) return 0;
  return Math.ceil(n / 200);
}
