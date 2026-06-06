'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import ImageSlider from '../../../components/vehicles/ImageSlider';
import ReviewsList from '../../../components/vehicles/ReviewsList';

import Engine from '../../../components/icons/Engine';
import GasPump from '../../../components/icons/GasPump';
import Transmission from '../../../components/icons/Transmission';
import Car from '../../../components/icons/Car';
import Cube from '../../../components/icons/Cube';
import { useTranslation } from '@/providers/LanguageProvider';
import { Car as CarType } from '../../../types/types';
import {
  addFavoriteCar,
  getFavoriteCars,
  getLoggedInUser,
  removeFavoriteCar,
} from '@/lib/api/userApi';
import { fetchCarById, fetchOfficeByCarId } from '@/lib/api/carApi';
import {
  fetchReviewsByCarId,
  checkReviewEligibility,
  submitReview,
} from '@/lib/api/reviewApi';
import { Office, User } from '@/types/database';
import { Heart } from '@/components/icons';
import { AngleLeft, FullHeart, LocationDot } from '@/components/icons';

const CarLocationMap = dynamic(
  () => import('@/components/vehicles/CarLocationMap'),
  { ssr: false },
);

function CarDetailPageInner() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();

  const carId = params?.id as string;
  const numericCarId = Number(carId);
  const shouldOpenReviewForm = searchParams.get('review') === '1';

  const [car, setCar] = useState<CarType | null>(null);
  const [reviews, setReviews] = useState<
    Array<{
      id?: number;
      rating: number;
      comment: string;
      createdAt?: string;
      user?: { name?: string; email?: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAddReview, setCanAddReview] = useState(false);
  const [activeReservationId, setActiveReservationId] = useState<number | null>(
    null,
  );
  const [user, setUser] = useState<User | null>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const loggedInUser = await getLoggedInUser();

        if (!mounted) {
          return;
        }

        setUser(loggedInUser);
      } catch (err) {
        console.error(t('carDetails.failedToLoadUser'), err);

        if (!mounted) {
          return;
        }

        setUser(null);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!carId) {
      return;
    }

    let mounted = true;

    async function loadPageData() {
      try {
        setLoading(true);
        setReviewsLoading(true);
        setError(null);

        const [carData, reviewsData, officeData] = await Promise.all([
          fetchCarById(carId),
          fetchReviewsByCarId(carId),
          fetchOfficeByCarId(Number(carId)).catch(() => null),
        ]);

        if (!mounted) {
          return;
        }

        setCar(carData);
        setReviews(reviewsData);
        setOffice(officeData);
      } catch (err) {
        if (!mounted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : t('carDetails.failedToLoadCar');
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
          setReviewsLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      mounted = false;
    };
  }, [carId]);

  useEffect(() => {
    if (!user || !Number.isInteger(numericCarId) || numericCarId <= 0) {
      setLiked(false);
      return;
    }

    let mounted = true;

    async function loadFavoriteState() {
      try {
        const favorites = await getFavoriteCars();

        if (!mounted) {
          return;
        }

        const isLiked = favorites.some(
          (favorite) => favorite.id === numericCarId,
        );
        setLiked(isLiked);
      } catch (err) {
        console.error(t('carDetails.failedToLoadFavoriteState'), err);

        if (!mounted) {
          return;
        }

        setLiked(false);
      }
    }

    loadFavoriteState();

    return () => {
      mounted = false;
    };
  }, [user, numericCarId]);

  useEffect(() => {
    if (!carId || reviewsLoading || !user) {
      setCanAddReview(false);
      setActiveReservationId(null);
      return;
    }

    let mounted = true;

    async function loadEligibility() {
      try {
        const data = await checkReviewEligibility(carId);

        if (!mounted) {
          return;
        }

        setCanAddReview(data.canAddReview);
        setActiveReservationId(data.reservationId);
      } catch (err) {
        console.error(t('carDetails.errorCheckingEligibility'), err);

        if (!mounted) {
          return;
        }

        setCanAddReview(false);
        setActiveReservationId(null);
      }
    }

    loadEligibility();

    return () => {
      mounted = false;
    };
  }, [carId, reviewsLoading, user]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!activeReservationId) {
      throw new Error(t('carDetails.noActiveReservation'));
    }

    const newReview = await submitReview({
      carId: numericCarId,
      rating,
      comment,
      reservationId: activeReservationId,
    });

    setReviews((prev) => [newReview, ...prev]);
    setCanAddReview(false);
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (likeLoading || !Number.isInteger(numericCarId) || numericCarId <= 0) {
      return;
    }

    try {
      setLikeLoading(true);

      if (liked) {
        await removeFavoriteCar(numericCarId);
        setLiked(false);
      } else {
        await addFavoriteCar(numericCarId);
        setLiked(true);
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const locationLabel =
    office?.address ||
    (office?.latitude && office?.longitude
      ? `${office.latitude}, ${office.longitude}`
      : t('carDetails.notAvailable'));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {t('carDetails.error')}
          </h1>
          <p className="text-gray-600">
            {error || t('carDetails.failedToLoadCar')}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t('carDetails.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-250 md:max-w-350 mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <AngleLeft className="w-5 h-5" />
          Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ImageSlider
              images={car.images || []}
              carName={`${car.make} ${car.model}`}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {car.make} {car.model}
                </h1>
                <p className="text-xl text-gray-600 mb-6">{car.year}</p>
              </div>

              {user?.role !== 'COMPANY' && (
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={likeLoading}
                  aria-label={
                    liked
                      ? t('carDetails.removeFavorite')
                      : t('carDetails.addFavorite')
                  }
                >
                  {liked ? (
                    <FullHeart className="text-red-500 w-8 h-8 cursor-pointer hover:scale-105 transition-all" />
                  ) : (
                    <Heart className="text-gray-400 w-8 h-8 cursor-pointer hover:scale-105 transition-all" />
                  )}
                </button>
              )}
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600">
                €{car.pricePerDay}
                <span className="text-lg font-normal text-gray-600">
                  {' '}
                  {t('carDetails.perDay')}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-600">
                {t('carDetails.specifications')}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Car className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.carType
                      ? t(`vehicle.bodyTypes.${car.carType.toLowerCase()}`)
                      : t('carDetails.notAvailable')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Transmission className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.transmissionType
                      ? t(
                          `vehicle.transmissions.${car.transmissionType.toLowerCase()}`,
                        )
                      : t('carDetails.notAvailable')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <GasPump className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.fuelType
                      ? t(`vehicle.fuelTypes.${car.fuelType.toLowerCase()}`)
                      : t('carDetails.notAvailable')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Engine className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.power
                      ? `${car.power} ${t('vehicle.hp')}`
                      : t('carDetails.notAvailable')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Cube className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.displacement || t('carDetails.notAvailable')} cc
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <LocationDot className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">{locationLabel}</span>
                </div>
              </div>
            </div>

            {car.company && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  {t('carDetails.rentalCompany')}
                </h3>
                <p className="text-gray-900">{car.company.name}</p>
              </div>
            )}

            {user && user.role !== 'COMPANY' && (
              <button
                type="button"
                onClick={() => router.push(`/reservation/${car.id}`)}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                {t('carDetails.reserveNow')}
              </button>
            )}
          </div>
        </div>

        {office && (
          <div className="my-5">
            <CarLocationMap lat={office.latitude} lng={office.longitude} />
          </div>
        )}

        <div className="mt-8">
          <ReviewsList
            reviews={reviews}
            loading={reviewsLoading}
            canAddReview={canAddReview}
            initialOpen={shouldOpenReviewForm}
            onSubmitReview={handleSubmitReview}
          />
        </div>
      </div>
    </div>
  );
}

export default function CarDetailPage() {
  return (
    <Suspense>
      <CarDetailPageInner />
    </Suspense>
  );
}
