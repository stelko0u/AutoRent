import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markPaymentFailed } from '@/lib/services/payments/markPaymentFailedService';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';

vi.mock('@/lib/repository/ReservationRepository', () => ({
  ReservationRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/repository/PaymentsRepository', () => ({
  PaymentsRepository: {
    findByReservation: vi.fn(),
    update: vi.fn(),
  },
}));

describe('Reservation - status transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Reservation status - cancel on payment failure', async () => {
    vi.mocked(ReservationRepository.findById).mockResolvedValue({
      id: 10,
    } as never);

    vi.mocked(PaymentsRepository.findByReservation).mockResolvedValue({
      id: 77,
    } as never);

    await markPaymentFailed({ reservationId: 10 });

    expect(ReservationRepository.update).toHaveBeenCalledWith(10, {
      status: 'CANCELLED',
    });
    expect(PaymentsRepository.update).toHaveBeenCalledWith(77, {
      paymentStatus: 'FAILED',
    });
  });
});
