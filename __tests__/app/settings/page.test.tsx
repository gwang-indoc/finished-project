import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockGetSession, mockGet, mockQuery, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGet: vi.fn(),
  mockQuery: vi.fn(() => ({ get: mockGet })),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`__redirect__:${path}`);
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: mockQuery,
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import SettingsPage from '@/app/settings/page';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({ get: mockGet });
  });

  it('renders Profile section with prefilled values above Email and Danger zone', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Existing' },
    });
    mockGet.mockReturnValue({
      name: 'Existing',
      gender: 'female',
      birthday: '1990-06-15',
    });

    const ui = await SettingsPage();
    render(ui);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const genderSelect = screen.getByLabelText('Gender') as HTMLSelectElement;
    const birthdayInput = screen.getByLabelText('Birthday') as HTMLInputElement;
    expect(nameInput.value).toBe('Existing');
    expect(genderSelect.value).toBe('female');
    expect(birthdayInput.value).toBe('1990-06-15');

    const profileHeading = screen.getByRole('heading', { name: 'Profile' });
    const emailHeading = screen.getByRole('heading', { name: 'Email' });
    const dangerHeading = screen.getByRole('heading', { name: 'Danger zone' });

    const order = profileHeading.compareDocumentPosition(emailHeading);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const order2 = emailHeading.compareDocumentPosition(dangerHeading);
    expect(order2 & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('redirects to /authenticate when there is no session', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(SettingsPage()).rejects.toThrow('__redirect__:/authenticate');
    expect(mockRedirect).toHaveBeenCalledWith('/authenticate');
  });

  it('renders empty profile inputs when user has no gender or birthday yet', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u2', email: 'new@example.com', name: 'New User' },
    });
    mockGet.mockReturnValue({
      name: 'New User',
      gender: null,
      birthday: null,
    });

    const ui = await SettingsPage();
    render(ui);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const genderSelect = screen.getByLabelText('Gender') as HTMLSelectElement;
    const birthdayInput = screen.getByLabelText('Birthday') as HTMLInputElement;
    expect(nameInput.value).toBe('New User');
    expect(genderSelect.value).toBe('');
    expect(birthdayInput.value).toBe('');
  });
});
