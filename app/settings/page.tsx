import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { RemoveAccountForm } from './remove-account-form';
import { ProfileForm } from './profile-form';

interface ProfileRow {
  name: string;
  gender: string | null;
  birthday: string | null;
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/authenticate');
  }

  const profile = db
    .query<ProfileRow, [string]>('SELECT name, gender, birthday FROM user WHERE id = ?')
    .get(session.user.id);

  const defaultValues = {
    name: profile?.name ?? session.user.name ?? '',
    gender: profile?.gender ?? null,
    birthday: profile?.birthday ?? null,
  };

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Settings</h1>

      <section className='mb-8 max-w-xl'>
        <h2 className='text-sm font-medium text-foreground/60 mb-3'>Profile</h2>
        <ProfileForm defaultValues={defaultValues} />
      </section>

      <section className='mb-8 max-w-xl'>
        <h2 className='text-sm font-medium text-foreground/60 mb-2'>Email</h2>
        <p className='px-3 py-2 border border-border rounded-md text-sm bg-foreground/5'>
          {session.user.email}
        </p>
      </section>

      <section className='max-w-xl border border-red-300 dark:border-red-900 rounded-md p-4 bg-red-50 dark:bg-red-950/30'>
        <h2 className='text-sm font-bold text-red-700 dark:text-red-400 mb-1'>Danger zone</h2>
        <p className='text-sm text-red-700/80 dark:text-red-400/80 mb-4'>
          Permanently delete your account and all of your notes. This cannot be undone.
        </p>
        <RemoveAccountForm userEmail={session.user.email} />
      </section>
    </div>
  );
}
