import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from '../profile-form';

interface ProfileRow {
  name: string;
  gender: string | null;
  birthday: string | null;
}

export default async function ProfilePage() {
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
    <>
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
    </>
  );
}
