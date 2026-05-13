'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import StudentNavbar from '../layouts/StudentNavbar';
import EnterpriseNavbar from '../layouts/EnterpriseNavbar';
import AdminNavbar from '../layouts/AdminNavbar';
import { useRole } from '@/lib/use-role';
import { useEffect, useState } from 'react';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { role, isStudent, isEnterprise, isAdmin } = useRole();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Routes where navbar should be hidden
  const hideNavbarRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/choose-role',
    '/enterprise/login',
    '/enterprise/register',
    '/admin/login',
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname?.startsWith(route),
  );

  // On homepage, show the default Navbar (has its own nav)
  if (pathname === '/') {
    return null;
  }

  if (shouldHideNavbar) {
    return null;
  }

  // Use role-based navbar when mounted
  if (mounted) {
    if (isEnterprise) return <EnterpriseNavbar />;
    if (isAdmin) return <AdminNavbar />;
    if (isStudent) return <StudentNavbar />;
  }

  // Default fallback
  return <Navbar />;
}