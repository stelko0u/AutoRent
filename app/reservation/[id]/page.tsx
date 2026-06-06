'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';

import Calendar from '../../../components/reservations/Calendar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import type { User } from '@/types/database';
import {
  createReservation,
  getReservationPageData,
  type ReservationCar,
  type ReservationPeriod,
} from '@/lib/api/reservationApi';
import { ArrowLeft } from '@/components/icons';
import { CreditCard, MoneyBill1 } from '@/components/icons';
import { useTranslation } from '@/providers/LanguageProvider';

export default function ReservationPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const carId = params?.id as string;

  const [car, setCar] = useState<ReservationCar | null>(null);
  const [reservations, setReservations] = useState<ReservationPeriod[]>([]);

  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ON_SPOT'>(
    'CARD',
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { userData } = useCurrentUser<User>();

  useEffect(() => {
    if (!carId) return;

    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const data = await getReservationPageData(carId);

        if (!isMounted) return;

        setCar(data.car);
        setReservations(data.reservations);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : t('reservationPage.failedToLoad'),
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [carId, t]);

  useEffect(() => {
    if (!userData) return;

    const nameParts = userData.name?.split(' ') || [];

    if (nameParts.length >= 2 && !firstName && !lastName) {
      setFirstName(nameParts[0]);
      setLastName(nameParts.slice(1).join(' '));
    }

    if (userData.email && !email) {
      setEmail(userData.email);
    }

    if (userData.phone && !phone) {
      setPhone(userData.phone);
    }
  }, [userData, firstName, lastName, email, phone]);

  const calculateDays = (): number => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    return differenceInCalendarDays(selectedEndDate, selectedStartDate) + 1;
  };

  const calculateTotal = (): number => {
    if (!car) return 0;
    return calculateDays() * car.pricePerDay;
  };

  const days = calculateDays();
  const total = calculateTotal();

  const handleContinue = async () => {
    if (userData?.role === 'COMPANY') {
      setError(t('reservationPage.companyCannotRent'));
      return;
    }

    if (
      !selectedStartDate ||
      !selectedEndDate ||
      !car ||
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      setError(t('reservationPage.requiredFields'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await createReservation({
        carId: car.id,
        startDate: selectedStartDate.toISOString(),
        endDate: selectedEndDate.toISOString(),
        firstName,
        lastName,
        email,
        phone,
        paymentMethod,
        locale,
      });

      const reservationId = data.reservation?.id;
      const nextStep = data.flow?.nextStep;

      if (!reservationId) {
        throw new Error(t('reservationPage.missingReservationId'));
      }

      if (paymentMethod === 'CARD') {
        if (nextStep === 'PAYMENT_PAGE') {
          router.push(`/payment/${reservationId}`);
          return;
        }

        router.push(
          `/reservation/success?id=${reservationId}&step=check-email`,
        );
        return;
      }

      router.push(`/reservation/success?id=${reservationId}&step=created`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t('reservationPage.failedCreate'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        {t('reservationPage.loading')}
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || t('reservationPage.carNotFound')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{t('reservationPage.back')}</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {car.make} {car.model}
              </h2>

              {car.images?.[0] && (
                <div className="relative w-full h-64 rounded-xl mb-4 overflow-hidden">
                  <Image
                    src={car.images[0]}
                    className="object-cover"
                    alt={t('reservationPage.carImageAlt')}
                    fill
                  />
                </div>
              )}

              <p className="text-gray-600 text-lg">
                {t('reservationPage.pricePerDay')}
                <span className="font-semibold text-gray-900 ml-2">
                  €{car.pricePerDay}
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {t('reservationPage.selectDates')}
              </h3>

              <Calendar
                reservations={reservations}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                onDateSelect={(start, end) => {
                  setSelectedStartDate(start);
                  setSelectedEndDate(end);
                }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {t('reservationPage.personalInfo')}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {t('reservationPage.firstName')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {t('reservationPage.lastName')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {t('reservationPage.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    {t('reservationPage.phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {t('reservationPage.paymentMethod')}
              </h3>

              <div className="space-y-3">
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">
                      {t('reservationPage.payOnlineTitle')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('reservationPage.payOnlineDescription')}
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </label>

                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'ON_SPOT'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ON_SPOT"
                    checked={paymentMethod === 'ON_SPOT'}
                    onChange={() => setPaymentMethod('ON_SPOT')}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">
                      {t('reservationPage.payOnSiteTitle')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('reservationPage.payOnSiteDescription')}
                    </div>
                  </div>
                  <MoneyBill1 className="w-8 h-8 text-gray-400" />
                </label>
              </div>

              {paymentMethod === 'ON_SPOT' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>{t('reservationPage.note')}</strong>{' '}
                    {t('reservationPage.onSpotNote')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 h-fit sticky top-10">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              {t('reservationPage.summary')}
            </h3>

            {!selectedStartDate && (
              <p className="text-gray-500 text-sm">
                {t('reservationPage.selectDatesHint')}
              </p>
            )}

            {selectedStartDate && selectedEndDate && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('reservationPage.pickUp')}
                    </span>
                    <span className="font-medium text-gray-800">
                      {selectedStartDate.toLocaleDateString(
                        locale === 'bg' ? 'bg-BG' : 'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        },
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('reservationPage.dropOff')}
                    </span>
                    <span className="font-medium text-gray-800">
                      {selectedEndDate.toLocaleDateString(
                        locale === 'bg' ? 'bg-BG' : 'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        },
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('reservationPage.duration')}
                    </span>
                    <span className="font-medium text-gray-800">
                      {days}{' '}
                      {days === 1
                        ? t('reservationPage.day')
                        : t('reservationPage.days')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t('reservationPage.payment')}
                    </span>
                    <span className="font-medium text-gray-800">
                      {paymentMethod === 'CARD'
                        ? t('reservationPage.onlineCard')
                        : t('reservationPage.onSite')}
                    </span>
                  </div>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      €{car.pricePerDay} × {days} {t('reservationPage.days')}
                    </span>
                    <span className="text-gray-800">€{total.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span className="text-gray-800">
                      {t('reservationPage.total')}
                    </span>
                    <span className="text-indigo-600">€{total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={submitting || userData?.role === 'COMPANY'}
                  className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {submitting
                    ? t('reservationPage.processing')
                    : paymentMethod === 'CARD'
                      ? t('reservationPage.createReservation')
                      : t('reservationPage.confirmReservation')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
