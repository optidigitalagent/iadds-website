'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

export function FooterNavigation({ links, label }: { links: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname();
  return <nav aria-label={label} className={styles.footerNav}>
    {links.map(item => <Link prefetch={false} href={item.href} key={item.href} data-navigation
      aria-current={pathname === item.href ? 'page' : pathname.startsWith(item.href + '/') ? 'location' : undefined}>
      {item.label}
    </Link>)}
  </nav>;
}
