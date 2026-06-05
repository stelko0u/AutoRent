import type { CarType, FuelType, TransmissionType } from '@/types/types';
import {
  companyCarCreateSchema,
  getCompanyCarZodErrorCode,
} from '@/lib/validators/schemas';

type Input = {
  make: string | null;
  model: string | null;
  year: number | null;
  pricePerDay: number | null;
  power: number | null;
  displacement: number | null;
  carType: CarType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  images?: string[];
};

export function validateCompanyCarInput(input: Input) {
  const result = companyCarCreateSchema.safeParse(input);

  if (!result.success) {
    throw new Error(getCompanyCarZodErrorCode(result.error));
  }

  return result.data;
}
