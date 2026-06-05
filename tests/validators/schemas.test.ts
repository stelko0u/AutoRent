import { describe, expect, it } from 'vitest';
import {
  companyCarCreateSchema,
  signupSchema,
} from '@/lib/validators/schemas';

describe('Validation - schemas (Zod)', () => {
  it('Signup validation - invalid email', () => {
    const result = signupSchema.safeParse({
      firstName: 'Ivan',
      lastName: 'Petrov',
      email: 'invalid-email',
      password: 'Strong#Pass123',
      phone: '+359 888 123 456',
      address: 'ul. Vitosha 10',
      city: 'Sofia',
      country: 'Bulgaria',
      postalCode: '1000',
      dateOfBirth: '1995-06-12',
      locale: 'bg',
    });

    expect(result.success).toBe(false);
  });

  it('Signup validation - short password', () => {
    const result = signupSchema.safeParse({
      firstName: 'Ivan',
      lastName: 'Petrov',
      email: 'ivan.petrov@example.com',
      password: 'short',
      phone: '+359 888 123 456',
      address: 'ul. Vitosha 10',
      city: 'Sofia',
      country: 'Bulgaria',
      postalCode: '1000',
      dateOfBirth: '1995-06-12',
      locale: 'bg',
    });

    expect(result.success).toBe(false);
  });

  it('Car validation - empty make rejected', () => {
    const result = companyCarCreateSchema.safeParse({
      make: '',
      model: 'Corolla',
      year: 2021,
      pricePerDay: 70,
      power: 90,
      displacement: 1600,
      carType: 'SEDAN',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
      officeId: 2,
      images: [],
    });

    expect(result.success).toBe(false);
  });

  it('Car validation - negative price rejected', () => {
    const result = companyCarCreateSchema.safeParse({
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      pricePerDay: -5,
      power: 90,
      displacement: 1600,
      carType: 'SEDAN',
      transmissionType: 'AUTOMATIC',
      fuelType: 'PETROL',
      officeId: 2,
      images: [],
    });

    expect(result.success).toBe(false);
  });
});
