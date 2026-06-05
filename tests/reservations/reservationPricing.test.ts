import { describe, expect, it } from 'vitest';
import {
  calculateReservationPricing,
  getReservationDateRangeOrThrow,
} from '@/lib/services/reservations/reservationPricing';

describe('Reservation - date validation', () => {
  it('Reservation create - past start date rejected', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    expect(() =>
      getReservationDateRangeOrThrow(
        pastDate.toISOString(),
        new Date().toISOString(),
      ),
    ).toThrowError('INVALID_RESERVATION_DATES');
  });

  it('Reservation create - end date after start required', () => {
    const start = new Date('2026-07-10');
    const end = new Date('2026-07-05');

    expect(() =>
      getReservationDateRangeOrThrow(
        start.toISOString(),
        end.toISOString(),
      ),
    ).toThrowError('INVALID_RESERVATION_RANGE');
  });
});

describe('Reservation - pricing', () => {
  it('Reservation pricing - total amount calculated', () => {
    const start = new Date('2026-07-01T00:00:00.000Z');
    const end = new Date('2026-07-03T23:59:59.999Z');
    const result = calculateReservationPricing(start, end, 50);

    expect(result.days).toBe(3);
    expect(result.totalPrice).toBe(150);
  });
});
