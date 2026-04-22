'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hideNavbarRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname?.startsWith(route),
  );

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}