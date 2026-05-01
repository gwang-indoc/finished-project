'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import DOMPurify from 'isomorphic-dompurify';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { removeAccountSchema, updateProfileSchema } from '@/lib/validation';

export interface RemoveAccountState {
  error?: string;
}

export async function removeAccount(
  _prevState: RemoveAccountState,
  formData: FormData,
): Promise<RemoveAccountState> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect('/authenticate');
  }

  const parsed = removeAccountSchema.safeParse({
    confirmEmail: formData.get('confirmEmail'),
  });

  if (!parsed.success) {
    return { error: 'Email did not match' };
  }

  // Trust the session for the user identity. confirmEmail is only a
  // confirmation gate — never used as a SQL lookup key. Compare exactly
  // (case-sensitive after trim) per design.md Decision 2.
  if (parsed.data.confirmEmail.trim() !== session.user.email) {
    return { error: 'Email did not match' };
  }

  const userId = session.user.id;

  // Sign out FIRST so better-auth can find its own session row and clear the
  // browser cookie. If we delete the session row first, better-auth's signOut
  // can't look it up and may leave a stale cookie. If signOut fails, abort
  // before touching any data — better to leave the account intact than to
  // orphan the user with a stale cookie pointing at a deleted account.
  try {
    await auth.api.signOut({ headers: reqHeaders });
  } catch {
    return { error: 'Failed to remove account, please try again' };
  }

  // Cascade in dependency order. FKs lack ON DELETE CASCADE and
  // `PRAGMA foreign_keys = ON` is set in lib/db.ts. The session DELETE is
  // idempotent (signOut above already removed the row) but kept for safety
  // in case better-auth ever stops removing it.
  try {
    db.transaction((id: string) => {
      db.run('DELETE FROM notes WHERE user_id = ?', [id]);
      db.run('DELETE FROM session WHERE userId = ?', [id]);
      db.run('DELETE FROM account WHERE userId = ?', [id]);
      db.run('DELETE FROM user WHERE id = ?', [id]);
    })(userId);
  } catch {
    // The user is already signed out (cookie cleared by signOut above).
    // Their data still exists. They can sign back in and try again.
    return { error: 'Failed to remove account, please try again' };
  }

  redirect('/');
}

export interface UpdateProfileState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/authenticate');
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name'),
    gender: formData.get('gender'),
    birthday: formData.get('birthday'),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) {
      if (v && v.length > 0) fieldErrors[k] = v[0]!;
    }
    return { error: 'Invalid input', fieldErrors };
  }

  const cleanName = DOMPurify.sanitize(parsed.data.name, { ALLOWED_TAGS: [] });

  db.run(
    "UPDATE user SET name = ?, gender = ?, birthday = ?, updatedAt = datetime('now') WHERE id = ?",
    [cleanName, parsed.data.gender, parsed.data.birthday, session.user.id],
  );

  revalidatePath('/settings');
  return { success: true };
}
