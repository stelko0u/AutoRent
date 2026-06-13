'use client';

'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import { Building, MapPin, Plus } from '../icons';
import {
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelMetricCard,
  CompanyPanelPageHeader,
  CompanyPanelSearch,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import {
  deleteCompanyOffice,
  getCompanyOffices,
  saveCompanyOffice,
} from '@/lib/api/companyApi';
import { useAlert } from '@/providers/AlertProvider';
import { useTranslation } from '@/providers/LanguageProvider';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
});

type OfficeItem = {
  id?: number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

interface CompanyOfficesProps {
  companyId: number;
}

export default function CompanyOffices({ companyId }: CompanyOfficesProps) {
  const { t } = useTranslation();
  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [editing, setEditing] = useState<OfficeItem | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showConfirm } = useAlert();

  const companyColors = {
    1: '#6366f1',
    2: '#8b5cf6',
    3: '#10b981',
  } satisfies Record<number, string>;

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const nextOffices = await getCompanyOffices();
      setOffices(nextOffices);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyOffices.failedLoad'));
      setOffices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [t]);

  const filteredOffices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return offices;
    }

    return offices.filter((office) =>
      [office.name, office.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [offices, search]);

  function startCreate() {
    setEditing({ name: '', address: '' });
    setPos(null);
  }

  function startEdit(office: OfficeItem) {
    setEditing(office);
    setPos(
      office.latitude != null && office.longitude != null
        ? [office.latitude, office.longitude]
        : null,
    );
  }

  async function save() {
    if (!editing) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await saveCompanyOffice({
        companyId,
        id: editing.id,
        name: editing.name,
        address: editing.address,
        latitude: pos?.[0],
        longitude: pos?.[1],
      });

      setEditing(null);
      setPos(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyOffices.failedSave'));
    } finally {
      setSaving(false);
    }
  }

  async function removeOffice(id: number) {
    showConfirm({
      type: 'warning',
      title: t('companyOffices.deleteOffice'),
      message: t('companyOffices.deleteConfirm'),
      confirmText: t('companyOffices.delete'),
      cancelText: t('companyOffices.cancel'),
      onConfirm: async () => {
        try {
          setError(null);
          await deleteCompanyOffice(id);
          await load();
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : t('companyOffices.failedDelete'),
          );
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <CompanyPanelPageHeader
        eyebrow={t('companyOffices.offices')}
        title={t('companyOffices.title')}
        description={t('companyOffices.description')}
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label={t('companyOffices.totalOffices')}
              value={String(offices.length)}
              description={t('companyOffices.locations')}
            />
            <CompanyPanelInfoCard
              label={t('companyOffices.visibleResults')}
              value={String(filteredOffices.length)}
              description={t('companyOffices.visibleResults')}
              tone="success"
            />
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      {/* <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompanyPanelMetricCard
          title={t('companyOffices.locations')}
          value={offices.length}
          icon={<Building className="h-5 w-5 text-indigo-600" />}
          accentClassName="bg-indigo-50"
        />
        <CompanyPanelMetricCard
          title={t('companyOffices.mappedOffices')}
          value={
            offices.filter(
              (office) => office.latitude != null && office.longitude != null,
            ).length
          }
          icon={<MapPin className="h-5 w-5 text-blue-600" />}
          accentClassName="bg-blue-50"
        />
        <CompanyPanelMetricCard
          title={t('companyOffices.namedOffices')}
          value={offices.filter((office) => Boolean(office.name)).length}
          icon={<Building className="h-5 w-5 text-emerald-600" />}
          accentClassName="bg-emerald-50"
        />
        <CompanyPanelMetricCard
          title={t('companyOffices.withAddress')}
          value={offices.filter((office) => Boolean(office.address)).length}
          icon={<MapPin className="h-5 w-5 text-amber-600" />}
          accentClassName="bg-amber-50"
        />
      </section> */}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <CompanyPanelCard
          title={t('companyOffices.officeList')}
          description={t('companyOffices.officeListDescription')}
          rightSlot={
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex h-11 items-center rounded-2xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('companyOffices.addOffice')}
            </button>
          }
        >
          <CompanyPanelToolbar
            rightSlot={
              <CompanyPanelSearch
                value={search}
                onChange={setSearch}
                placeholder={t('companyOffices.searchPlaceholder')}
              />
            }
          />

          <div className="space-y-4 px-6 pb-6 sm:px-8">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                {t('companyOffices.loadingOffices')}
              </div>
            ) : filteredOffices.length === 0 ? (
              <CompanyPanelEmptyState
                title={t('companyOffices.noOffices')}
                description={t('companyOffices.noOfficesDescription')}
              />
            ) : (
              filteredOffices.map((office) => (
                <div
                  key={office.id ?? `${office.name}-${office.address}`}
                  className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {office.name ||
                          t('companyOffices.officeDefault', {
                            id: office.id ?? 'new',
                          })}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {office.address || t('companyOffices.noAddress')}
                      </p>
                    </div>

                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(office)}
                      className="inline-flex h-10 items-center rounded-xl bg-amber-50 px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      {t('companyOffices.edit')}
                    </button>

                    {office.id ? (
                      <button
                        type="button"
                        onClick={() => void removeOffice(office.id as number)}
                        className="inline-flex h-10 items-center rounded-xl bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        {t('companyOffices.delete')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </CompanyPanelCard>

        <div className="space-y-6">
          <CompanyPanelCard
            title={t('companyOffices.officeMap')}
            description={t('companyOffices.officeMapDescription')}
          >
            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-3xl border border-gray-200">
                <MapComponent
                  offices={offices.filter(
                    (office): office is OfficeItem & { id: number } =>
                      office.id != null,
                  )}
                  editing={editing}
                  pos={pos}
                  setPos={setPos}
                  companyColors={companyColors}
                />
              </div>
            </div>
          </CompanyPanelCard>

          {editing ? (
            <CompanyPanelCard
              title={
                editing.id
                  ? t('companyOffices.editOffice')
                  : t('companyOffices.createOffice')
              }
              description={t('companyOffices.editDescription')}
            >
              <div className="grid gap-4 px-6 py-6 sm:px-8">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('companyOffices.officeName')}
                  </label>
                  <input
                    value={editing.name ?? ''}
                    onChange={(event) =>
                      setEditing({ ...editing, name: event.target.value })
                    }
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('companyOffices.address')}
                  </label>
                  <input
                    value={editing.address ?? ''}
                    onChange={(event) =>
                      setEditing({ ...editing, address: event.target.value })
                    }
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  {t('companyOffices.mapHint')}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="inline-flex h-11 items-center rounded-2xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving
                      ? t('companyOffices.saving')
                      : editing.id
                        ? t('companyOffices.saveChanges')
                        : t('companyOffices.createOfficeButton')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setPos(null);
                    }}
                    className="inline-flex h-11 items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    {t('companyOffices.cancel')}
                  </button>
                </div>
              </div>
            </CompanyPanelCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
