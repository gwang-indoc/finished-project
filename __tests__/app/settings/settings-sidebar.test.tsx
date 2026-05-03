import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }));

import { SettingsSidebar } from '@/app/settings/settings-sidebar';

describe('SettingsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both Profile and Account link labels', () => {
    mockUsePathname.mockReturnValue('/settings/profile');
    render(<SettingsSidebar />);
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument();
  });

  it('marks Profile active when pathname is /settings/profile', () => {
    mockUsePathname.mockReturnValue('/settings/profile');
    render(<SettingsSidebar />);
    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink.className).toContain('bg-foreground/10');
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(accountLink.className).not.toContain('bg-foreground/10');
  });

  it('marks Account active when pathname is /settings/account', () => {
    mockUsePathname.mockReturnValue('/settings/account');
    render(<SettingsSidebar />);
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(accountLink.className).toContain('bg-foreground/10');
    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink.className).not.toContain('bg-foreground/10');
  });
});
