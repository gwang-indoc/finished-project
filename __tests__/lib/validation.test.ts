import { describe, it, expect } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  toggleSharingSchema,
  removeAccountSchema,
  updateProfileSchema,
} from '@/lib/validation';

describe('createNoteSchema', () => {
  it('passes with valid title and content', () => {
    const result = createNoteSchema.safeParse({
      title: 'My Note',
      content_json: '{"type":"doc","content":[]}',
    });
    expect(result.success).toBe(true);
  });

  it('fails with empty title', () => {
    const result = createNoteSchema.safeParse({
      title: '',
      content_json: '{"type":"doc"}',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('fails with title > 200 chars', () => {
    const result = createNoteSchema.safeParse({
      title: 'a'.repeat(201),
      content_json: '{"type":"doc"}',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toContain('Title is too long');
    }
  });

  it('fails with empty content', () => {
    const result = createNoteSchema.safeParse({
      title: 'My Note',
      content_json: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.content_json).toBeDefined();
    }
  });
});

describe('updateNoteSchema', () => {
  it('passes with valid UUID, title, and content', () => {
    const result = updateNoteSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Updated Note',
      content_json: '{"type":"doc","content":[]}',
    });
    expect(result.success).toBe(true);
  });

  it('fails with invalid UUID format', () => {
    const result = updateNoteSchema.safeParse({
      id: 'not-a-uuid',
      title: 'My Note',
      content_json: '{"type":"doc"}',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.id).toContain('Invalid note ID');
    }
  });
});

describe('removeAccountSchema', () => {
  it('passes with a valid email', () => {
    const result = removeAccountSchema.safeParse({ confirmEmail: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('fails when confirmEmail is missing', () => {
    const result = removeAccountSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmEmail).toBeDefined();
    }
  });

  it('fails when confirmEmail is not an email', () => {
    const result = removeAccountSchema.safeParse({ confirmEmail: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmEmail).toBeDefined();
    }
  });

  it('fails when confirmEmail exceeds 254 chars', () => {
    const local = 'a'.repeat(244);
    const oversized = `${local}@example.com`;
    expect(oversized.length).toBeGreaterThan(254);
    const result = removeAccountSchema.safeParse({ confirmEmail: oversized });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmEmail).toBeDefined();
    }
  });
});

describe('toggleSharingSchema', () => {
  it('transforms "true" string to boolean true', () => {
    const result = toggleSharingSchema.safeParse({
      noteId: 'some-id',
      enable: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enable).toBe(true);
    }
  });

  it('transforms "false" string to boolean false', () => {
    const result = toggleSharingSchema.safeParse({
      noteId: 'some-id',
      enable: 'false',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enable).toBe(false);
    }
  });
});

describe('updateProfileSchema', () => {
  it('passes with valid input', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is missing', () => {
    const result = updateProfileSchema.safeParse({
      gender: 'male',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it('fails when gender is missing', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.gender).toBeDefined();
    }
  });

  it('fails when birthday is missing', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.birthday).toBeDefined();
    }
  });

  it('fails when name is empty after trim', () => {
    const result = updateProfileSchema.safeParse({
      name: '   ',
      gender: 'non-binary',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it('fails when name is longer than 100 chars', () => {
    const result = updateProfileSchema.safeParse({
      name: 'a'.repeat(101),
      gender: 'male',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it('fails when gender is outside the allowed enum', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'other',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.gender).toBeDefined();
    }
  });

  it('fails when birthday has wrong shape', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990/06/15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.birthday).toBeDefined();
    }
  });

  it('fails when birthday is in the future', () => {
    const future = new Date();
    future.setUTCFullYear(future.getUTCFullYear() + 1);
    const futureDateStr = future.toISOString().slice(0, 10);
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: futureDateStr,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.birthday).toBeDefined();
    }
  });

  it('fails when birthday is before 1900-01-01', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1899-12-31',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.birthday).toBeDefined();
    }
  });

  it('fails when birthday is calendar-invalid (2026-02-30)', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '2026-02-30',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.birthday).toBeDefined();
    }
  });

  it('passes when occupation is omitted', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('passes when occupation is an empty string (treated as optional)', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990-06-15',
      occupation: '',
    });
    expect(result.success).toBe(true);
  });

  it('fails when occupation exceeds 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990-06-15',
      occupation: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.occupation).toContain('Occupation is too long');
    }
  });

  it('trims whitespace from occupation', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jane Doe',
      gender: 'female',
      birthday: '1990-06-15',
      occupation: '  Engineer  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.occupation).toBe('Engineer');
    }
  });
});
