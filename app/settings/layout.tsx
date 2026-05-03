import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { SettingsSidebar } from './settings-sidebar';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/authenticate');
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Settings</h1>
      <div className='flex flex-col md:flex-row gap-6'>
        <aside className='w-44 flex-none'>
          <SettingsSidebar />
        </aside>
        <div className='flex-1'>{children}</div>
      </div>
    </div>
  );
}
