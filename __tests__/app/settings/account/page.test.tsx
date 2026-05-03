import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockGetSession, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`__redirect__:${path}`);
  }),
}));

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/navigation', () => ({ redirect: mockRedirect }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/app/settings/actions', () => ({
  removeAccount: vi.fn(),
  updateProfile: vi.fn(),
}));

import AccountPage from '@/app/settings/account/page';

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Danger zone heading and warning paragraph', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });

    const ui = await AccountPage();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeInTheDocument();
    expect(screen.getByText(/Permanently delete your account/)).toBeInTheDocument();
  });

  it('renders <RemoveAccountForm> for the session user', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });

    const ui = await AccountPage();
    render(ui);

    expect(screen.getByRole('button', { name: /Remove account/ })).toBeInTheDocument();
  });

  it('does NOT render the Profile or Email sections', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });

    const ui = await AccountPage();
    render(ui);

    expect(screen.queryByRole('heading', { name: 'Profile' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Email' })).not.toBeInTheDocument();
  });

  it('redirects to /authenticate when the user is not signed in', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow('__redirect__:/authenticate');
    expect(mockRedirect).toHaveBeenCalledWith('/authenticate');
  });
});
