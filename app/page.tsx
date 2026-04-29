import Link from 'next/link';

export default function Home() {
  return (
    <div className='relative flex min-h-screen items-center justify-center p-8'>
      <div className='absolute top-4 right-6'>
        <Link
          href='/help'
          className='inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground'
        >
          <span className='inline-flex h-4 w-4 items-center justify-center rounded-full border border-foreground/40 text-[10px] font-bold'>
            ?
          </span>
          Help
        </Link>
      </div>
      <main className='max-w-md text-center'>
        <h1 className='text-4xl font-bold mb-4'>Welcome to Notes</h1>
        <p className='text-foreground/60 mb-8'>
          A simple note-taking app with rich text editing and public sharing.
        </p>
        <div className='flex gap-4 justify-center'>
          <Link
            href='/authenticate'
            className='px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800'
          >
            Log in
          </Link>
          <Link
            href='/authenticate?mode=signup'
            className='px-6 py-2 border border-foreground rounded-lg hover:bg-foreground/10'
          >
            Sign up
          </Link>
        </div>
      </main>
    </div>
  );
}
