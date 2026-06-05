export function getReservationDateRangeOrThrow(
  startDateInput: string,
  endDateInput: string,
) {
  const start = new Date(startDateInput);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDateInput);
  end.setHours(23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('INVALID_RESERVATION_DATES');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new Error('INVALID_RESERVATION_DATES');
  }

  if (start > end) {
    throw new Error('INVALID_RESERVATION_RANGE');
  }

  return { start, end };
}

export function calculateReservationPricing(
  start: Date,
  end: Date,
  pricePerDay: number | string,
) {
  const diffTime = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalPrice = days * Number(pricePerDay || 0);

  return {
    days,
    totalPrice,
  };
}
