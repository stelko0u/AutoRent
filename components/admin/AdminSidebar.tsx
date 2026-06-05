'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  Cars,
  ChartLine,
  Clipboard,
  Plus,
  ShieldExclamation,
  UsersGear,
} from '../icons';
import { useTranslation } from '@/providers/LanguageProvider';

export default function AdminSidebar({
  active,
  setActive,
}: {
  active: string;
  setActive: (s: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const items = [
    {
      key: 'dashboard',
      label: t('adminSidebar.dashboard'),
      icon: <ChartLine className="w-5 h-5" />,
    },
    {
      key: 'companies',
      label: t('adminSidebar.manageCompanies'),
      icon: <Building className="w-5 h-5" />,
    },
    {
      key: 'add-company',
      label: t('adminSidebar.addCompany'),
      icon: <Plus className="w-5 h-5" />,
    },
    {
      key: 'cars',
      label: t('adminSidebar.manageCars'),
      icon: <Cars className="w-5 h-5" />,
    },

    {
      key: 'users',
      label: t('adminSidebar.manageUsers'),
      icon: <UsersGear className="w-5 h-5" />,
    },
    {
      key: 'audit',
      label: t('adminSidebar.auditLogs'),
      icon: <ShieldExclamation className="w-5 h-5" />,
    },
  ];

  const handleTabChange = (key: string) => {
    setActive(key);
    router.push(`/admin?tab=${key}`);
  };

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              AD
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('adminSidebar.panelTitle')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('adminSidebar.panelSubtitle')}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            {t('adminSidebar.backToSite')}
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => handleTabChange(it.key)}
              className={
                'shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ' +
                (active === it.key
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700')
              }
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden min-h-screen w-64 flex-col border-r border-gray-200 bg-white p-6 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
            AD
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {t('adminSidebar.panelTitle')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('adminSidebar.panelSubtitle')}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => handleTabChange(it.key)}
              className={
                'w-full rounded-md px-3 py-2 text-left hover:bg-gray-100 ' +
                (active === it.key
                  ? 'border border-indigo-200 bg-indigo-50'
                  : '')
              }
            >
              <span className="flex items-center gap-3">
                {it.icon}
                {it.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <Link
            href="/"
            className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {t('adminSidebar.backToSite')}
          </Link>
        </div>
      </aside>
    </>
  );
}
