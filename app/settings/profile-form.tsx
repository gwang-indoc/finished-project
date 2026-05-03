'use client';

import { useActionState } from 'react';
import { updateProfile, type UpdateProfileState } from './actions';

interface DefaultValues {
  name: string;
  gender: string | null;
  birthday: string | null;
  occupation: string | null;
}

interface ProfileFormViewProps {
  defaultValues: DefaultValues;
  state: UpdateProfileState;
  isPending: boolean;
  formAction: (payload: FormData) => void;
}

export function ProfileFormView({
  defaultValues,
  state,
  isPending,
  formAction,
}: ProfileFormViewProps) {
  return (
    <form action={formAction} className='space-y-4'>
      <div>
        <label htmlFor='profile-name' className='block text-sm font-medium mb-1'>
          Name
        </label>
        <input
          id='profile-name'
          type='text'
          name='name'
          defaultValue={defaultValues.name}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/30 bg-background'
        />
        {state.fieldErrors?.name && (
          <p role='alert' className='text-red-600 text-sm mt-1'>
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor='profile-gender' className='block text-sm font-medium mb-1'>
          Gender
        </label>
        <select
          id='profile-gender'
          name='gender'
          defaultValue={defaultValues.gender ?? ''}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/30 bg-background'
        >
          <option value=''>Select…</option>
          <option value='male'>Male</option>
          <option value='female'>Female</option>
          <option value='non-binary'>Non-binary</option>
          <option value='prefer-not-to-say'>Prefer not to say</option>
        </select>
        {state.fieldErrors?.gender && (
          <p role='alert' className='text-red-600 text-sm mt-1'>
            {state.fieldErrors.gender}
          </p>
        )}
      </div>

      <div>
        <label htmlFor='profile-birthday' className='block text-sm font-medium mb-1'>
          Birthday
        </label>
        <input
          id='profile-birthday'
          type='date'
          name='birthday'
          defaultValue={defaultValues.birthday ?? ''}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/30 bg-background'
        />
        {state.fieldErrors?.birthday && (
          <p role='alert' className='text-red-600 text-sm mt-1'>
            {state.fieldErrors.birthday}
          </p>
        )}
      </div>

      <div>
        <label htmlFor='profile-occupation' className='block text-sm font-medium mb-1'>
          Occupation
        </label>
        <input
          id='profile-occupation'
          type='text'
          name='occupation'
          defaultValue={defaultValues.occupation ?? ''}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/30 bg-background'
        />
        {state.fieldErrors?.occupation && (
          <p role='alert' className='text-red-600 text-sm mt-1'>
            {state.fieldErrors.occupation}
          </p>
        )}
      </div>

      <div className='flex items-center gap-3'>
        <button
          type='submit'
          disabled={isPending}
          className='px-3 py-1.5 text-sm bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isPending ? 'Saving…' : 'Save profile'}
        </button>
        {state.success && <p className='text-green-600 text-sm'>Saved</p>}
      </div>
    </form>
  );
}

export function ProfileForm({ defaultValues }: { defaultValues: DefaultValues }) {
  const [state, formAction, isPending] = useActionState(updateProfile, {} as UpdateProfileState);

  return (
    <ProfileFormView
      defaultValues={defaultValues}
      state={state}
      isPending={isPending}
      formAction={formAction}
    />
  );
}
