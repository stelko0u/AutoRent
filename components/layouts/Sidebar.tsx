/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import NavItem from './NavItem';
import SignOutButton from '../auth/SignOutButton';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/providers/LanguageProvider';
import {
  Car,
  CarKey,
  Cars,
  ChartLine,
  CircleInfo,
  Clipboard,
  House,
  MagnifyingGlassPlus,
  MapPin,
  ScrewdriverWrench,
  ShieldExclamation,
  TriangleExclamation,
  User,
  UsersGear,
} from '../icons';

export default function Sidebar({
  active,
  setActive,
  isLoggedIn,
  role,
}: {
  active: string;
  setActive: (s: string) => void;
  isLoggedIn: boolean;
  role?: 'user' | 'company' | 'admin' | null;
}) {
  const { t } = useTranslation();

  const navItems: {
    label: string;
    key: string;
    href?: string;
    icon?: React.ReactNode;
  }[] = [];

  if (role === 'user') {
    navItems.push(
      {
        label: t('nav.home'),
        key: 'home',
        href: '/',
        icon: <House className="w-6 h-6" />,
      },
      {
        label: t('nav.browseCars'),
        key: 'browse',
        href: '/',
        icon: <MagnifyingGlassPlus className="w-6 h-6" />,
      },
      {
        label: t('nav.myRentals'),
        key: 'rentals',
        href: '/profile?tab=rentals',
        icon: <CarKey className="w-6 h-6" />,
      },
      {
        label: t('nav.profile'),
        key: 'profile',
        href: '/profile',
        icon: <User className="w-6 h-6" />,
      },
      {
        label: t('nav.about'),
        key: 'about',
        href: '/about',
        icon: <CircleInfo className="w-6 h-6" />,
      },
      {
        label: t('nav.contacts'),
        key: 'contacts',
        href: '/contacts',
        icon: <MapPin className="w-6 h-6" />,
      },
      {
        label: t('nav.faq'),
        key: 'faq',
        href: '/faq',
        icon: <Clipboard className="w-6 h-6" />,
      },
    );
  } else if (role === 'company') {
    navItems.push(
      {
        label: t('nav.dashboard'),
        key: 'dashboard',
        href: '/company?tab=dashboard',
        icon: <ChartLine className="w-6 h-6" />,
      },
      {
        label: t('nav.addCar'),
        key: 'add-car',
        href: '/company?tab=add-car',
        icon: <Car className="w-6 h-6" />,
      },
      {
        label: t('nav.manageCars'),
        key: 'manage-cars',
        href: '/company?tab=manage-cars',
        icon: <Cars className="w-6 h-6" />,
      },
      {
        label: t('nav.profile'),
        key: 'profile',
        href: '/profile',
        icon: <User className="w-6 h-6" />,
      },
      {
        label: t('nav.about'),
        key: 'about',
        href: '/about',
        icon: <CircleInfo className="w-6 h-6" />,
      },
      {
        label: t('nav.contacts'),
        key: 'contacts',
        href: '/contacts',
        icon: <MapPin className="w-6 h-6" />,
      },
      {
        label: t('nav.faq'),
        key: 'faq',
        href: '/faq',
        icon: <Clipboard className="w-6 h-6" />,
      },
    );
  } else if (role === 'admin') {
    navItems.push(
      {
        label: t('nav.adminPanel'),
        key: 'admin-panel',
        href: '/admin',
        icon: <ScrewdriverWrench className="w-6 h-6" />,
      },
      {
        label: t('nav.manageUsers'),
        key: 'manage-users',
        href: '/admin?tab=users',
        icon: <UsersGear className="w-6 h-6" />,
      },
      {
        label: t('nav.auditLogs'),
        key: 'reports',
        href: '/admin/?tab=audit',
        icon: <ShieldExclamation className="w-6 h-6" />,
      },
      {
        label: t('nav.about'),
        key: 'about',
        href: '/about',
        icon: <CircleInfo className="w-6 h-6" />,
      },
      {
        label: t('nav.contacts'),
        key: 'contacts',
        href: '/contacts',
        icon: <MapPin className="w-6 h-6" />,
      },
      {
        label: t('nav.faq'),
        key: 'faq',
        href: '/faq',
        icon: <Clipboard className="w-6 h-6" />,
      },
    );
  } else {
    navItems.push({
      label: t('nav.home'),
      key: 'home',
      href: '/',
      icon: <House className="w-6 h-6" />,
    });
    navItems.push(
      {
        label: t('nav.about'),
        key: 'about',
        href: '/about',
        icon: <CircleInfo className="w-6 h-6" />,
      },
      {
        label: t('nav.contacts'),
        key: 'contacts',
        href: '/contacts',
        icon: <MapPin className="w-6 h-6" />,
      },
      {
        label: t('nav.faq'),
        key: 'faq',
        href: '/faq',
        icon: <Clipboard className="w-6 h-6" />,
      },
    );
  }

  return (
    <aside className="min-h-screen w-64 flex flex-col border-r border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt={`${t('common.appName')} Logo`}
          className="h-24 w-24 object-contain"
        />
        <div>
          <h3 className="text-lg font-semibold">{t('common.appName')}</h3>
          <h4 className="text-sm text-gray-500">{t('common.driveSafe')}</h4>
        </div>
      </div>

      <div className="mt-4">
        <LanguageSwitcher />
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <a
            key={item.key}
            href={item.href || '#'}
            onClick={() => setActive(item.key)}
            className="block cursor-pointer"
          >
            <NavItem
              label={item.label}
              active={active === item.key}
              onClick={() => setActive(item.key)}
              icon={item.icon}
            />
          </a>
        ))}
      </nav>

      <div className="mt-auto">
        {isLoggedIn ? (
          <SignOutButton />
        ) : (
          <div className="flex flex-col gap-2">
            <a
              href="/signin"
              className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition-all hover:scale-102"
            >
              {t('common.signIn')}
            </a>
            <a
              href="/signup"
              className="cursor-pointer rounded-lg border border-indigo-600 px-3 py-2 text-center text-sm font-semibold text-indigo-600 transition-all hover:scale-102"
            >
              {t('common.signUp')}
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
