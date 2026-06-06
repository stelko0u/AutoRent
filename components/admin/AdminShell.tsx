'use client';

import React, { useEffect, useState, ReactNode, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminCompanies from './AdminCompanies';
import AdminAddCompany from './AdminAddCompany';
import AdminCars from './AdminCars';
import AdminReservations from './AdminReservations';
import AdminUsersPage from './AdminManageUsers';
import { AdminAuditPageClient } from '../audit/AdminAuditPageClient';
import { useTranslation } from '@/providers/LanguageProvider';

type AdminShellProps = {
  me: { name?: string; email?: string; role?: string; id?: number } | null;
  children?: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      startTransition(() => setActive(tab));
    }
  }, [searchParams]);

  useEffect(() => {
    const tabTitleMap: Record<string, string> = {
      dashboard: t('adminSidebar.dashboard'),
      companies: t('adminSidebar.manageCompanies'),
      'add-company': t('adminSidebar.addCompany'),
      cars: t('adminSidebar.manageCars'),
      users: t('adminSidebar.manageUsers'),
      audit: t('adminSidebar.auditLogs'),
    };

    const tabTitle = tabTitleMap[active] || t('adminSidebar.panelTitle');
    document.title = `${tabTitle} | Smart Rent`;
  }, [active, t]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex flex-col md:flex-row">
        <AdminSidebar active={active} setActive={setActive} />
        {/* <main className="flex-1 p-4 sm:p-6"> */}
        <main className="ml-64 flex-1" >
          <header className="mb-6">
            {/* <h1 className="text-2xl font-semibold">
              Admin — {me?.name ?? 'User'}
            </h1>
            <p className="text-sm text-gray-500">Use the sidebar to navigate</p> */}
          </header>

          {children ?? (
            <>
              {active === 'dashboard' && <AdminDashboard />}
              {active === 'companies' && <AdminCompanies />}
              {active === 'add-company' && <AdminAddCompany />}
              {active === 'cars' && <AdminCars />}
              {active === 'users' && <AdminUsersPage />}
              {active === 'audit' && <AdminAuditPageClient />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
