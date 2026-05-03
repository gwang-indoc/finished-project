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

import ProfilePage from '@/app/settings/profile/page';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({ get: mockGet });
  });

  it('renders the Profile section with prefilled defaults from the user row', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });
    mockGet.mockReturnValue({
      name: 'Jane',
      gender: 'female',
      birthday: '1990-06-15',
    });

    const ui = await ProfilePage();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const genderSelect = screen.getByLabelText('Gender') as HTMLSelectElement;
    const birthdayInput = screen.getByLabelText('Birthday') as HTMLInputElement;
    expect(nameInput.value).toBe('Jane');
    expect(genderSelect.value).toBe('female');
    expect(birthdayInput.value).toBe('1990-06-15');
  });

  it('renders the Email section displaying the session user email', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });
    mockGet.mockReturnValue({
      name: 'Jane',
      gender: 'female',
      birthday: '1990-06-15',
    });

    const ui = await ProfilePage();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('does not render the Danger zone heading or the Remove account form', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });
    mockGet.mockReturnValue({
      name: 'Jane',
      gender: 'female',
      birthday: '1990-06-15',
    });

    const ui = await ProfilePage();
    render(ui);

    expect(screen.queryByRole('heading', { name: 'Danger zone' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove account/ })).not.toBeInTheDocument();
  });

  it('redirects to /authenticate when there is no session', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow('__redirect__:/authenticate');
    expect(mockRedirect).toHaveBeenCalledWith('/authenticate');
  });

  it('passes occupation from DB as defaultValues.occupation to ProfileForm', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });
    mockGet.mockReturnValue({
      name: 'Jane',
      gender: 'female',
      birthday: '1990-06-15',
      occupation: 'Software Engineer',
    });

    const ui = await ProfilePage();
    render(ui);

    const occupationInput = screen.getByLabelText('Occupation') as HTMLInputElement;
    expect(occupationInput.value).toBe('Software Engineer');
  });

  it('passes null occupation when DB row has no occupation', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'jane@example.com', name: 'Jane' },
    });
    mockGet.mockReturnValue({
      name: 'Jane',
      gender: 'female',
      birthday: '1990-06-15',
      occupation: null,
    });

    const ui = await ProfilePage();
    render(ui);

    const occupationInput = screen.getByLabelText('Occupation') as HTMLInputElement;
    expect(occupationInput.value).toBe('');
  });
});
