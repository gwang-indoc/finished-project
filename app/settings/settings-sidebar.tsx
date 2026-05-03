'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/account', label: 'Account' },
] as const;

const activeClass = 'bg-foreground/10 font-medium text-foreground';
const inactiveClass = 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground';
const baseClass = 'px-3 py-2 rounded-md block';

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className='flex flex-col gap-1'>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
