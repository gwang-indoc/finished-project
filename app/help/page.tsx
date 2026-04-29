import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className='max-w-2xl mx-auto px-6 py-12'>
      <div className='mb-8'>
        <Link href='/' className='text-sm text-foreground/60 hover:text-foreground'>
          ← Back to home
        </Link>
      </div>

      <h1 className='text-3xl font-bold mb-2'>Help</h1>
      <p className='text-foreground/60 mb-10'>Everything you need to know about NextNotes.</p>

      <div className='space-y-10'>
        <section>
          <h2 className='text-xl font-semibold mb-3'>Creating Notes</h2>
          <p className='text-foreground/80 leading-relaxed'>
            After signing in, go to your Dashboard and click <strong>New Note</strong>. Give your
            note a title and start writing. Your notes are saved automatically and appear on your
            dashboard sorted by last updated.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>Rich Text Editing</h2>
          <p className='text-foreground/80 leading-relaxed'>
            The note editor supports rich text formatting. Use the toolbar to apply bold, italic,
            headings, bullet lists, and more. You can also use standard keyboard shortcuts like{' '}
            <kbd className='px-1.5 py-0.5 text-sm border border-border rounded'>Ctrl+B</kbd> for
            bold and{' '}
            <kbd className='px-1.5 py-0.5 text-sm border border-border rounded'>Ctrl+I</kbd> for
            italic.
          </p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>Sharing Notes Publicly</h2>
          <p className='text-foreground/80 leading-relaxed'>
            Any note can be made public. Open a note, toggle the <strong>Public</strong> switch, and
            a shareable link will be generated. Anyone with the link can read the note — no account
            required. Toggle it off at any time to make the note private again.
          </p>
        </section>
      </div>
    </div>
  );
}
