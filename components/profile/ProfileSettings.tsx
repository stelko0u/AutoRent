'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  changeUserPassword,
  updateUserProfile,
  type ChangePasswordPayload,
  type UpdateUserProfilePayload,
} from '@/lib/api/userApi';
import { Circle } from '@/components/icons';
import type { ProfilePageUser } from '@/app/profile/page';
import { useTranslation } from '@/providers/LanguageProvider';

interface ProfileSettingsProps {
  user: ProfilePageUser;
}

type ProfileFormData = {
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function formatDateForInput(date?: Date | string): string {
  if (!date) {
    return '';
  }

  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().split('T')[0] ?? '';
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
    postalCode: user.postalCode ?? '',
    dateOfBirth: formatDateForInput(user.dateOfBirth),
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccessMessage = (message: string) => {
    setSuccess(message);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const updateProfileField =
    (field: keyof ProfileFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (error || success) {
        clearMessages();
      }
    };

  const updatePasswordField =
    (field: keyof PasswordFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setPasswordData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (error || success) {
        clearMessages();
      }
    };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    try {
      setProfileLoading(true);

      const payload: UpdateUserProfilePayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        dateOfBirth: formData.dateOfBirth,
      };

      await updateUserProfile(payload);

      showSuccessMessage(t('profileSettings.profileUpdated'));
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('profileSettings.failedProfileUpdate');

      setError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profileSettings.passwordsDoNotMatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError(t('profileSettings.passwordMin'));
      return;
    }

    try {
      setPasswordLoading(true);

      const payload: ChangePasswordPayload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      await changeUserPassword(payload);

      showSuccessMessage(t('profileSettings.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('profileSettings.failedPasswordChange');

      setError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          {t('profileSettings.profileInformation')}
        </h2>

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-100 p-4 text-red-700">
            <Circle className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-100 p-4 text-green-700">
            <Circle className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" />
            <span>{success}</span>
          </div>
        ) : null}

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.fullName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={updateProfileField('name')}
                placeholder={t('profileSettings.fullNamePlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.email')}
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('profileSettings.emailCannotChange')}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.phoneNumber')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={updateProfileField('phone')}
                placeholder="0888 123 456"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.dateOfBirth')}
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={updateProfileField('dateOfBirth')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.address')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={updateProfileField('address')}
                placeholder={t('profileSettings.addressPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.city')}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={updateProfileField('city')}
                placeholder={t('profileSettings.cityPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.postalCode')}
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={updateProfileField('postalCode')}
                placeholder="12345"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('profileSettings.country')}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={updateProfileField('country')}
                placeholder={t('profileSettings.countryPlaceholder')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full rounded-lg bg-indigo-600 px-6 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400 md:w-auto"
          >
            {profileLoading
              ? t('profileSettings.saving')
              : t('profileSettings.saveChanges')}
          </button>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          {t('profileSettings.changePassword')}
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('profileSettings.currentPassword')}
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={updatePasswordField('currentPassword')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('profileSettings.newPassword')}
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={updatePasswordField('newPassword')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('profileSettings.minimumChars')}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('profileSettings.confirmNewPassword')}
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={updatePasswordField('confirmPassword')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-600 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full rounded-lg bg-indigo-600 px-6 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400 md:w-auto"
          >
            {passwordLoading
              ? t('profileSettings.changing')
              : t('profileSettings.changePasswordButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
