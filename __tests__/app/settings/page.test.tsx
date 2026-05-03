import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`__redirect__:${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mockRedirect }));

import SettingsPage from '@/app/settings/page';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /settings/profile', () => {
    expect(() => SettingsPage()).toThrow('__redirect__:/settings/profile');
    expect(mockRedirect).toHaveBeenCalledWith('/settings/profile');
  });
});
