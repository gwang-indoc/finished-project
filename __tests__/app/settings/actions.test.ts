import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession, mockSignOut, mockRun, mockTransactionFactory } = vi.hoisted(() => ({
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

import { removeAccount } from '@/app/settings/actions';

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
