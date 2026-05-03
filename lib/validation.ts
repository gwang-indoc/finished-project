import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content_json: z.string().min(1, 'Content is required'),
});

export const updateNoteSchema = z.object({
  id: z.string().uuid('Invalid note ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content_json: z.string().min(1, 'Content is required'),
});

export const toggleSharingSchema = z.object({
  noteId: z.string(),
  enable: z.enum(['true', 'false']).transform((v) => v === 'true'),
});

export const removeAccountSchema = z.object({
  confirmEmail: z.string().email('Invalid email').max(254, 'Email is too long'),
});

export const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const;
export type Gender = (typeof GENDERS)[number];

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  gender: z.enum(GENDERS),
  occupation: z.string().trim().max(100, 'Occupation is too long').optional(),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(s + 'T00:00:00Z');
      if (Number.isNaN(d.getTime())) return false;
      if (d.toISOString().slice(0, 10) !== s) return false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (d > today) return false;
      if (d < new Date('1900-01-01T00:00:00Z')) return false;
      return true;
    }, 'Birthday must be a real date between 1900-01-01 and today'),
});
