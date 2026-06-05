import { describe, expect, it } from 'vitest';
import { calculateReservationPricing } from '@/lib/services/reservations/reservationPricing';

describe('Utilities - date calculations', () => {
  it('Date calculation - days between dates', () => {
    const start = new Date('2026-07-01T00:00:00.000Z');
    const end = new Date('2026-07-04T23:59:59.999Z');
    const result = calculateReservationPricing(start, end, 40);

    expect(result.days).toBe(4);
  });
});
