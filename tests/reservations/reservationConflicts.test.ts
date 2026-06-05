import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReservation } from '@/lib/services/reservations/createReservationService';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { CarRepository } from '@/lib/repository/CarRepository';

vi.mock('@/lib/repository/ReservationRepository', () => ({
  ReservationRepository: {
    findConflicting: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/repository/CarRepository', () => ({
  CarRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/mail/sendReservationPaymentEmail', () => ({
  sendReservationPaymentEmail: vi.fn(),
}));

describe('Reservation - availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Reservation create - unavailable period rejected', async () => {
    vi.mocked(CarRepository.findById).mockResolvedValue({
      id: 1,
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      pricePerDay: 70,
    } as never);

    vi.mocked(ReservationRepository.findConflicting).mockResolvedValue([
      { id: 99 },
    ] as never);

    await expect(
      createReservation({
        user: { id: 1, role: 'USER' },
        body: {
          carId: 1,
          startDate: '2026-07-10',
          endDate: '2026-07-12',
          paymentMethod: 'CARD',
          locale: 'bg',
        },
      }),
    ).rejects.toThrowError('DATES_NOT_AVAILABLE');
  });
});
