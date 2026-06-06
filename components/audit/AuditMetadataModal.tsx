'use client';

import React, { useEffect } from 'react';

interface AuditMetadataModalProps {
  isOpen: boolean;
  title: string;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  onClose: () => void;
}

type Primitive = string | number | boolean | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatLabel(key: string): string {
  const dictionary: Record<string, string> = {
    source: 'Източник',
    before: 'Преди промяната',
    after: 'След промяната',
    changedFields: 'Променени полета',
    deletedUser: 'Изтрит потребител',
    deletedCompany: 'Изтрита компания',
    deletedCar: 'Изтрита кола',
    deletedOffice: 'Изтрит офис',
    targetUser: 'Засегнат потребител',
    company: 'Компания',
    office: 'Офис',
    car: 'Кола',
    reason: 'Причина',
    email: 'Имейл',
    name: 'Име',
    address: 'Адрес',
    city: 'Град',
    country: 'Държава',
    postalCode: 'Пощенски код',
    dateOfBirth: 'Дата на раждане',
    phone: 'Телефон',
    id: 'ID',
    role: 'Роля',
    userId: 'Потребител ID',
    companyId: 'Компания ID',
    officeId: 'Офис ID',
    make: 'Марка',
    model: 'Модел',
    year: 'Година',
    pricePerDay: 'Цена на ден',
    transmissionType: 'Трансмисия',
    fuelType: 'Гориво',
    carType: 'Тип кола',
    latitude: 'Ширина',
    longitude: 'Дължина',
    maintenancePercent: 'Процент поддръжка',
    ownerId: 'Собственик ID',
    stripeAccountId: 'Stripe акаунт',
    banned: 'Блокиран',
    sentTo: 'Изпратено до',
    devOverrideUsed: 'Използван dev override',
    onboardingEmail: 'Имейл за onboarding',
    targetRole: 'Роля на засегнатия',
    action: 'Действие',
  };

  if (dictionary[key]) {
    return dictionary[key];
  }

  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function formatPrimitive(value: Primitive): string {
  if (value === null || value === undefined || value === '') {
    return 'Няма данни';
  }

  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Не';
  }

  return String(value);
}
function isDiffMetadata(metadata: Record<string, unknown>): metadata is Record<
  string,
  unknown
> & {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
} {
  return isRecord(metadata.before) && isRecord(metadata.after);
}

function renderDiffSection(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): React.ReactNode {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  );

  const changedKeys = keys.filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );

  if (changedKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Няма открити промени.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changedKeys.map((key) => (
        <div
          key={key}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">
              {formatLabel(key)}
            </div>
          </div>

          <div className="grid gap-px bg-slate-200 md:grid-cols-2">
            <div className="bg-red-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700">
                Преди
              </div>

              <div className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-900">
                {isRecord(before[key]) || Array.isArray(before[key])
                  ? renderValue(before[key])
                  : formatPrimitive(before[key] as Primitive)}
              </div>
            </div>

            <div className="bg-green-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-green-700">
                След
              </div>

              <div className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-900">
                {isRecord(after[key]) || Array.isArray(after[key])
                  ? renderValue(after[key])
                  : formatPrimitive(after[key] as Primitive)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderValue(value: unknown): React.ReactNode {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        {formatPrimitive(value)}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          Няма данни
        </div>
      );
    }

    const allPrimitive = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean',
    );

    if (allPrimitive) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={`${String(item)}-${index}`}
              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
            >
              {formatPrimitive(item as Primitive)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Елемент {index + 1}
            </div>
            {renderValue(item)}
          </div>
        ))}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          Няма данни
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {formatLabel(key)}
            </div>
            {renderValue(nestedValue)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      {String(value)}
    </div>
  );
}

function renderMetadataSections(metadata: Record<string, unknown>) {
  if (isDiffMetadata(metadata)) {
    return (
      <div className="space-y-4">
        {'reason' in metadata && metadata.reason ? (
          <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">
              Причина
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {String(metadata.reason)}
            </div>
          </section>
        ) : null}

        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            Промени
          </div>

          {renderDiffSection(metadata.before, metadata.after)}
        </section>
      </div>
    );
  }

  const priorityKeys = [
    'reason',
    'source',
    'changedFields',
    'targetUser',
    'deletedUser',
    'deletedCompany',
    'deletedCar',
    'deletedOffice',
    'company',
    'office',
    'car',
    'onboardingEmail',
  ];

  const entries = Object.entries(metadata);

  const sortedEntries = [...entries].sort(([a], [b]) => {
    const aIndex = priorityKeys.indexOf(a);
    const bIndex = priorityKeys.indexOf(b);

    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Няма налични метаданни за този запис.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEntries.map(([key, value]) => (
        <section
          key={key}
          className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-3 text-sm font-semibold text-slate-900">
            {formatLabel(key)}
          </div>

          {renderValue(value)}
        </section>
      ))}
    </div>
  );
}

export function AuditMetadataModal({
  isOpen,
  title,
  errorMessage,
  metadata,
  onClose,
}: AuditMetadataModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Audit Details
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close metadata modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="font-semibold">Грешка:</span> {errorMessage}
            </div>
          ) : null}

          {renderMetadataSections(metadata)}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
}
