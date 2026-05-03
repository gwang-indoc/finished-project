import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockGetSession, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`__redirect__:${path}`);
  }),
}));

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/navigation', () => ({ redirect: mockRedirect, usePathname: () => '/settings' }));

import SettingsLayout from '@/app/settings/layout';

describe('SettingsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /authenticate when there is no session', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(SettingsLayout({ children: <div>kid</div> })).rejects.toThrow(
      '__redirect__:/authenticate',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/authenticate');
  });

  it('renders the Settings heading and children when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com', name: 'A' } });
    const ui = await SettingsLayout({ children: <div data-testid='kid'>kid content</div> });
    render(ui);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('kid')).toHaveTextContent('kid content');
  });
});
