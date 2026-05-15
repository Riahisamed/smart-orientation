'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Bot, LogOut, Settings, User, Building2, TrendingUp } from 'lucide-react';
import { useAuthUser } from '@/lib/use-auth-user';
import { ThemeToggle } from './theme-toggle';
import LanguageSwitcher from './LanguageSwitcher';
import ChatModal from './ChatModal';
import { useTranslations } from '@/lib/i18n/context';

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuthUser();

  const navigationLinks = [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.orientation', href: '/orientation' },
    { key: 'nav.test', href: '/orientation-test' },
    { key: 'nav.tCalculator', href: '/t-calculator' },
    { key: 'nav.fgCalculator', href: '/fg-calculator' },
    { key: 'nav.aiAssistant', href: '/chat', icon: Bot },
  ];

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-slate-200/80 bg-white/85 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            aria-label="ORIA home"
            className="flex items-center"
          >
            <Image
              src="/images/oria-logo.png"
              alt="ORIA Logo"
              width={180}
              height={60}
              sizes="(max-width: 768px) 128px, 180px"
              className="h-[52px] w-auto object-contain transition-none"
              priority
            />
          </Link>
        </div>

        <div className="hidden items-center space-x-6 md:flex">
          {navigationLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-300 ${
                  pathname === link.href
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {t(link.key)}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />

          <Link href="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 transition-all duration-200 hover:scale-110 dark:bg-gray-700">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 transition-all duration-200 hover:scale-110 dark:bg-gray-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-medium text-white">
                {user.initials}
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div onClick={() => setIsDropdownOpen(false)} className="fixed inset-0 z-10" />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email || (isAuthenticated ? 'Compte connecté' : 'Invité')}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4" />
                    {t("common.profile")}
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4" />
                    {t("common.settings")}
                  </Link>

                  <hr className="my-1 border-gray-200 dark:border-gray-700" />

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? t("common.loading") : t("common.logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

     

      <ChatModal open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </nav>
  );
}
