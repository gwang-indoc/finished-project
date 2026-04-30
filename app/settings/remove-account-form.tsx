'use client';

import { useActionState, useState } from 'react';
import { removeAccount, type RemoveAccountState } from './actions';

interface RemoveAccountFormProps {
  userEmail: string;
}

const initialState: RemoveAccountState = {};

export function RemoveAccountForm({ userEmail }: RemoveAccountFormProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [state, formAction, isPending] = useActionState(removeAccount, initialState);

  const trimmed = typed.trim();
  const matches = trimmed === userEmail;

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700'
      >
        Remove account…
      </button>

      {open && (
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='remove-account-title'
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
        >
          <div className='w-full max-w-md rounded-md bg-background border border-border p-6 shadow-lg'>
            <h3 id='remove-account-title' className='text-lg font-bold mb-2'>
              Permanently remove your account?
            </h3>
            <p className='text-sm text-foreground/70 mb-4'>
              This deletes your account, every note, and any public links. This cannot be undone.
              Type your email address to confirm.
            </p>

            <div className='mb-3'>
              <p className='text-xs text-foreground/60 mb-1'>Your email</p>
              <p className='px-3 py-2 border border-border rounded-md text-sm bg-foreground/5 mb-3'>
                {userEmail}
              </p>
              <input
                type='email'
                autoComplete='off'
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder='Type your email'
                aria-label='Type your email to confirm'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
              />
            </div>

            {state.error && (
              <p role='alert' className='text-red-600 text-sm mb-3'>
                {state.error}
              </p>
            )}

            <form action={formAction} className='flex justify-end gap-2'>
              <input type='hidden' name='confirmEmail' value={typed} />
              <button
                type='button'
                onClick={() => {
                  setOpen(false);
                  setTyped('');
                }}
                disabled={isPending}
                className='px-3 py-1.5 text-sm border border-border rounded-md hover:bg-foreground/5 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={!matches || isPending}
                className='px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isPending ? 'Removing…' : 'Remove account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
