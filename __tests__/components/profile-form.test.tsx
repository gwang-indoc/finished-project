import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileFormView } from '@/app/settings/profile-form';

vi.mock('@/app/settings/actions', () => ({
  updateProfile: vi.fn(),
}));

const defaultValues = { name: 'Jane', gender: 'female', birthday: '1990-06-15' };
const emptyState = {};
const noopAction = async () => {};

describe('ProfileFormView', () => {
  it('renders with defaultValues prefilled into Name, Gender, and Birthday inputs', () => {
    render(
      <ProfileFormView
        defaultValues={defaultValues}
        state={emptyState}
        isPending={false}
        formAction={noopAction}
      />,
    );

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Jane');

    const genderSelect = screen.getByLabelText('Gender') as HTMLSelectElement;
    expect(genderSelect).toBeInTheDocument();
    expect(genderSelect.value).toBe('female');

    const birthdayInput = screen.getByLabelText('Birthday') as HTMLInputElement;
    expect(birthdayInput).toBeInTheDocument();
    expect(birthdayInput.value).toBe('1990-06-15');
  });

  it('renders inline error text for each field present in state.fieldErrors', () => {
    render(
      <ProfileFormView
        defaultValues={defaultValues}
        state={{ fieldErrors: { name: 'Name is required', birthday: 'Use YYYY-MM-DD' } }}
        isPending={false}
        formAction={noopAction}
      />,
    );

    const alerts = screen.getAllByRole('alert');
    const alertTexts = alerts.map((a) => a.textContent);
    expect(alertTexts).toContain('Name is required');
    expect(alertTexts).toContain('Use YYYY-MM-DD');
  });

  it('shows a "Saved" indicator when state.success is true', () => {
    render(
      <ProfileFormView
        defaultValues={defaultValues}
        state={{ success: true }}
        isPending={false}
        formAction={noopAction}
      />,
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('submit button is disabled while isPending is true', () => {
    render(
      <ProfileFormView
        defaultValues={defaultValues}
        state={emptyState}
        isPending={true}
        formAction={noopAction}
      />,
    );

    const button = screen.getByRole('button', { name: /saving/i });
    expect(button).toBeDisabled();
  });
});
