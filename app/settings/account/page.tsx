import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { RemoveAccountForm } from '../remove-account-form';

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/authenticate');
  }

  return (
    <section className='max-w-xl border border-red-300 dark:border-red-900 rounded-md p-4 bg-red-50 dark:bg-red-950/30'>
      <h2 className='text-sm font-bold text-red-700 dark:text-red-400 mb-1'>Danger zone</h2>
      <p className='text-sm text-red-700/80 dark:text-red-400/80 mb-4'>
        Permanently delete your account and all of your notes. This cannot be undone.
      </p>
      <RemoveAccountForm userEmail={session.user.email} />
    </section>
  );
}
