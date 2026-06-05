import { Car } from '@/types/types';

function getBrowserLocale(): 'bg' | 'en' {
  if (typeof document !== 'undefined') {
    const localeCookie = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('locale='))
      ?.split('=')[1];

    if (localeCookie === 'en' || localeCookie === 'bg') {
      return localeCookie;
    }
  }

  if (typeof window !== 'undefined') {
    const savedLocale = window.localStorage.getItem('locale');

    if (savedLocale === 'en' || savedLocale === 'bg') {
      return savedLocale;
    }
  }

  return 'bg';
}

export async function fetchUsers(): Promise<{ users: import('@/types/database').User[] }> {
  const res = await fetch('/api/admin/users', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (res.status === 403) {
    throw new Error('Unauthorized — admin role required');
  }
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteUser(userId: number | string): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Failed to delete user');
  }
}

export async function banUser(
  userId: number | string,
  reason: string,
): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: userId,
      action: 'ban',
      reason: reason || null,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Failed to ban user');
  }
}

export async function unbanUser(userId: number | string): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, action: 'unban' }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Failed to unban user');
  }
}

export async function fetchDashboardStats(): Promise<import('@/types/types').DashboardStats> {
  const response = await fetch('/api/admin/dashboard');

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

export type AdminReservationFilters = {
  companyId?: number | string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminReservationRow = {
  id: number;
  company_id: number;
  company_name: string;
  car_id: number;
  car_make: string;
  car_model: string;
  car_year: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  start_date: string;
  end_date: string;
  total_price: string | number | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
};

export async function fetchAdminReservations(
  filters: AdminReservationFilters = {},
): Promise<AdminReservationRow[]> {
  const searchParams = new URLSearchParams();

  if (filters.companyId) {
    searchParams.set('companyId', String(filters.companyId));
  }

  if (filters.dateFrom) {
    searchParams.set('dateFrom', filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set('dateTo', filters.dateTo);
  }

  const url = searchParams.toString()
    ? `/api/admin/reservations?${searchParams.toString()}`
    : '/api/admin/reservations';

  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to load reservations');
  }

  return Array.isArray(data?.reservations) ? data.reservations : [];
}

export async function fetchCarsAndCompanies(): Promise<{
  cars: import('@/types/types').CarRow[];
  companies: import('@/types/types').Company[];
}> {
  const [carsRes, companiesRes] = await Promise.all([
    fetch('/api/admin/cars', {
      credentials: 'include',
    }),
    fetch('/api/admin/companies', {
      credentials: 'include',
    }),
  ]);

  if (!carsRes.ok) {
    throw new Error(`Load cars failed (${carsRes.status})`);
  }

  if (!companiesRes.ok) {
    throw new Error(`Load companies failed (${companiesRes.status})`);
  }

  const carsJson = await carsRes.json();
  const companiesJson = await companiesRes.json();

  const carsData = Array.isArray(carsJson.cars) ? carsJson.cars : [];
  const companiesData = Array.isArray(companiesJson.companies)
    ? companiesJson.companies
    : [];

  return { cars: carsData, companies: companiesData };
}

export async function deleteCar(id: number): Promise<void> {
  const res = await fetch('/api/admin/cars', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Delete failed (${res.status}) ${txt}`);
  }
}

export async function fetchCompanies(): Promise<import('@/types/types').Company[]> {
  const res = await fetch('/api/admin/companies', {
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || `Failed to load (${res.status})`);
  }

  const json = await res.json();
  return Array.isArray(json.companies) ? json.companies : [];
}

export async function updateCompany(payload: {
  id: number;
  name: string;
  email: string;
  maintenancePercent: number;
}): Promise<void> {
  const res = await fetch('/api/admin/companies', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || `Save failed (${res.status})`);
  }
}

export async function deleteCompany(id: number): Promise<void> {
  const res = await fetch('/api/admin/companies', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || `Delete failed (${res.status})`);
  }
}

export async function updateCar(
  id: number,
  formData: Partial<Car> | FormData,
): Promise<void> {
  const isMultipart = formData instanceof FormData;
  const res = await fetch(`/api/company/cars?id=${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: isMultipart ? undefined : { 'Content-Type': 'application/json' },
    body: isMultipart ? formData : JSON.stringify(formData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || `Failed to update car (${res.status})`);
  }
}

export async function createCompany(payload: {
  name: string;
  email: string;
  maintenancePercent: number;
  // password: string;
}): Promise<void> {
  const locale = getBrowserLocale();
  const res = await fetch('/api/admin/companies', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-locale': locale },
    body: JSON.stringify({ ...payload, locale }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Failed (${res.status})`);
  }
}
