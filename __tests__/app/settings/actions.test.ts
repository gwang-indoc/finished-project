import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockSignOut, mockRun, mockTransactionFactory, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockSignOut: vi.fn(),
    mockRun: vi.fn(),
    // db.transaction(cb) returns a function; calling it invokes cb in a SQLite
    // transaction. Model the same shape so the action's call site works
    // unchanged.
    mockTransactionFactory: vi.fn(
      (cb: (...args: unknown[]) => unknown) =>
        (...args: unknown[]) =>
          cb(...args),
    ),
    mockRevalidatePath: vi.fn(),
  }));

vi.mock('@/lib/db', () => ({
  db: {
    run: mockRun,
    transaction: mockTransactionFactory,
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

import { removeAccount, updateProfile } from '@/app/settings/actions';

const formDataWith = (confirmEmail: string) => {
  const fd = new FormData();
  fd.set('confirmEmail', confirmEmail);
  return fd;
};

const sqlForUser = (userId: string) => [
  ['DELETE FROM notes WHERE user_id = ?', [userId]],
  ['DELETE FROM session WHERE userId = ?', [userId]],
  ['DELETE FROM account WHERE userId = ?', [userId]],
  ['DELETE FROM user WHERE id = ?', [userId]],
];

describe('removeAccount', () => {
  const userId = 'u1';
  const userEmail = 'user@example.com';
  const otherEmail = 'other@example.com';

  beforeEach(() => {
    mockGetSession.mockReset();
    mockSignOut.mockReset();
    mockRun.mockReset();
    mockTransactionFactory.mockClear();
  });

  it('with matching email + valid session, signs out then runs the four DELETEs in order for the session user and redirects', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: userEmail } });

    await expect(removeAccount({}, formDataWith(userEmail))).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockTransactionFactory).toHaveBeenCalledTimes(1);
    expect(mockRun.mock.calls).toEqual(sqlForUser(userId));
  });

  it('with mismatched email, returns an inline error and runs no DELETEs', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: userEmail } });

    const result = await removeAccount({}, formDataWith('wrong@example.com'));

    expect(result).toEqual({ error: 'Email did not match' });
    expect(mockRun).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('without a session, redirects to /authenticate without touching the database', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(removeAccount({}, formDataWith(userEmail))).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mockRun).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('with a tampered confirmEmail that matches a different user, refuses and runs no DELETEs', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: userEmail } });

    const result = await removeAccount({}, formDataWith(otherEmail));

    expect(result).toEqual({ error: 'Email did not match' });
    expect(mockRun).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('when signOut throws, aborts before any DELETE and surfaces an error', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: userEmail } });
    mockSignOut.mockRejectedValueOnce(new Error('signOut failed'));

    const result = await removeAccount({}, formDataWith(userEmail));

    expect(result).toEqual({ error: 'Failed to remove account, please try again' });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('when the cascade transaction throws, surfaces an error and does not redirect', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: userEmail } });
    // signOut succeeds, then the first DELETE inside the transaction explodes.
    mockRun.mockImplementationOnce(() => {
      throw new Error('FK violation');
    });

    const result = await removeAccount({}, formDataWith(userEmail));

    expect(result).toEqual({ error: 'Failed to remove account, please try again' });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('updateProfile', () => {
  const userId = 'u1';
  const initialState = {};

  const profileFormData = (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.set('name', overrides.name ?? 'Jane Doe');
    fd.set('gender', overrides.gender ?? 'female');
    fd.set('birthday', overrides.birthday ?? '1990-06-15');
    if (overrides.userId !== undefined) fd.set('userId', overrides.userId);
    return fd;
  };

  beforeEach(() => {
    mockGetSession.mockReset();
    mockSignOut.mockReset();
    mockRun.mockReset();
    mockRevalidatePath.mockReset();
  });

  it('without a session, redirects to /authenticate and writes nothing', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(updateProfile(initialState, profileFormData())).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mockRun).not.toHaveBeenCalled();
  });

  it('with valid input, updates the user row and returns { success: true }', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });

    const result = await updateProfile(initialState, profileFormData());

    expect(result).toEqual({ success: true });
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(
      "UPDATE user SET name = ?, gender = ?, birthday = ?, updatedAt = datetime('now') WHERE id = ?",
      ['Jane Doe', 'female', '1990-06-15', userId],
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/settings');
  });

  it('with missing name, returns fieldErrors.name and writes nothing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });

    const result = await updateProfile(initialState, profileFormData({ name: '' }));

    expect(result).toMatchObject({
      error: expect.any(String),
      fieldErrors: { name: expect.any(String) },
    });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('with gender outside enum, returns fieldErrors.gender and writes nothing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });

    const result = await updateProfile(initialState, profileFormData({ gender: 'other' }));

    expect(result).toMatchObject({
      error: expect.any(String),
      fieldErrors: { gender: expect.any(String) },
    });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('with a future birthday, returns fieldErrors.birthday and writes nothing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });

    const result = await updateProfile(initialState, profileFormData({ birthday: '2099-01-01' }));

    expect(result).toMatchObject({
      error: expect.any(String),
      fieldErrors: { birthday: expect.any(String) },
    });
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('ignores a userId field in formData and only updates session.user.id', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });
    const fd = profileFormData({ userId: 'attacker-id' });

    const result = await updateProfile(initialState, fd);

    expect(result).toEqual({ success: true });
    // The fourth parameter must be the session user's id, not 'attacker-id'
    const callArgs = mockRun.mock.calls[0] as [string, unknown[]];
    expect(callArgs[1][3]).toBe(userId);
  });

  it('sanitizes a name containing <script> tags before persisting', async () => {
    mockGetSession.mockResolvedValue({ user: { id: userId, email: 'user@example.com' } });
    const fd = profileFormData({ name: 'Jane <script>alert(1)</script>' });

    const result = await updateProfile(initialState, fd);

    expect(result).toEqual({ success: true });
    const callArgs = mockRun.mock.calls[0] as [string, unknown[]];
    const persistedName = callArgs[1][0] as string;
    expect(persistedName).not.toContain('<script>');
    expect(persistedName).not.toContain('</script>');
    expect(persistedName).not.toContain('<');
  });
});
