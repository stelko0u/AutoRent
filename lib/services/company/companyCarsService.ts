import { NextRequest } from 'next/server';
import type { Car, CarType, FuelType, TransmissionType } from '@/types/types';
import { CarRepository } from '@/lib/repository/CarRepository';
// import { countReservationsByCarId } from '@/lib/repository/ReservationRepository';
import {
  mapCarType,
  mapFuelType,
  mapTransmissionType,
} from '@/lib/utils/carMappers';
import { saveCompanyCarImages } from '@/lib/utils/fileUpload';
import { validateCompanyCarInput } from '@/lib/validators/companyCarValidator';
import {
  companyCarUpdateSchema,
  getCompanyCarZodErrorCode,
} from '@/lib/validators/schemas';
import { ReservationRepository } from '@/lib/repository/ReservationRepository';

type CompanyUser = {
  id: number;
  companyId: number;
  role: 'COMPANY';
};

type CreateParsedInput = {
  make: string | null;
  model: string | null;
  year: number | null;
  pricePerDay: number | null;
  images: string[];
  carType: CarType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  power: number | null;
  displacement: number | null;
  officeId: number | null;
};

type UpdateParsedInput = Record<string, unknown>;

export async function getCompanyCars(companyId: number) {
  return CarRepository.findManyByCompanyId(companyId);
}

async function parseCreateCompanyCarRequest(
  req: NextRequest,
  companyId: number,
): Promise<CreateParsedInput> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  let make: string | null = null;
  let model: string | null = null;
  let year: number | null = null;
  let pricePerDay: number | null = null;
  let images: string[] = [];
  let carType: CarType | null = null;
  let transmissionType: TransmissionType | null = null;
  let fuelType: FuelType | null = null;
  let power: number | null = null;
  let displacement: number | null = null;
  let officeId: number | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();

    make = String(form.get('make') ?? '').trim();
    model = String(form.get('model') ?? '').trim();
    year = Number(form.get('year') ?? new Date().getFullYear());
    pricePerDay = Number(form.get('pricePerDay') ?? 0);
    power = Number(form.get('power') ?? 0);
    displacement = Number(form.get('displacement') ?? 0);

    carType = mapCarType(form.get('carType')?.toString() ?? null);
    transmissionType = mapTransmissionType(
      form.get('transmission')?.toString() ?? null,
    );
    fuelType = mapFuelType(form.get('fuelType')?.toString() ?? null);

    officeId = form.get('officeId') ? Number(form.get('officeId')) : null;

    const fileEntries = form.getAll('images') as File[];
    images = await saveCompanyCarImages(fileEntries, companyId);
  } else {
    type CarRequestBody = {
      make?: unknown;
      model?: unknown;
      year?: unknown;
      pricePerDay?: unknown;
      power?: unknown;
      displacement?: unknown;
      carType?: unknown;
      transmission?: unknown;
      transmissionType?: unknown;
      fuelType?: unknown;
      officeId?: unknown;
      images?: unknown;
    };

    let body: CarRequestBody | null = null;

    try {
      body = (await req.json()) as CarRequestBody;
    } catch {
      throw new Error('INVALID_JSON_BODY');
    }

    make = String(body?.make ?? '').trim();
    model = String(body?.model ?? '').trim();
    year = body?.year ? Number(body.year) : new Date().getFullYear();
    pricePerDay = body?.pricePerDay ? Number(body.pricePerDay) : 0;
    power = body?.power ? Number(body.power) : 0;
    displacement = body?.displacement ? Number(body.displacement) : 0;

    carType = mapCarType(body?.carType != null ? String(body.carType) : null);
    transmissionType =
      mapTransmissionType(
        body?.transmission != null ? String(body.transmission) : null,
      ) ||
      mapTransmissionType(
        body?.transmissionType != null ? String(body.transmissionType) : null,
      );
    fuelType = mapFuelType(
      body?.fuelType != null ? String(body.fuelType) : null,
    );

    officeId =
      body?.officeId != null && body.officeId !== ''
        ? Number(body.officeId)
        : null;

    if (Array.isArray(body?.images)) {
      images = body.images.filter(
        (it: unknown) => typeof it === 'string',
      ) as string[];
    }
  }

  return {
    make,
    model,
    year,
    pricePerDay,
    images,
    carType,
    transmissionType,
    fuelType,
    power,
    displacement,
    officeId,
  };
}

export async function createCompanyCar(req: NextRequest, user: CompanyUser) {
  const parsed = await parseCreateCompanyCarRequest(req, user.companyId);

  const valid = validateCompanyCarInput(parsed);

  const created = await CarRepository.create({
    make: valid.make,
    model: valid.model,
    year: valid.year,
    pricePerDay: valid.pricePerDay,
    power: valid.power,
    displacement: valid.displacement,
    images: valid.images,
    ownerId: Number(user.id),
    companyId: Number(user.companyId),
    carType: valid.carType,
    transmissionType: valid.transmissionType,
    fuelType: valid.fuelType,
    officeId: valid.officeId ?? undefined,
  });

  return {
    id: created.id,
    make: created.make,
    model: created.model,
    year: created.year,
    pricePerDay: created.pricePerDay,
    power: created.power,
    displacement: created.displacement,
    images: created.images,
    carType: created.carType,
    transmissionType: created.transmissionType,
    fuelType: created.fuelType,
    officeId: created.officeId,
    companyId: created.companyId,
    createdAt: created.createdAt,
  };
}

export async function deleteCompanyCar(
  carId: number,
  companyId: number,
): Promise<void> {
  if (!carId || Number.isNaN(carId)) {
    throw new Error('INVALID_CAR_ID');
  }

  const car = await CarRepository.findById(carId);

  if (!car) {
    throw new Error('CAR_NOT_FOUND');
  }

  if (car.companyId !== companyId) {
    throw new Error('UNAUTHORIZED_CAR_ACCESS');
  }

  const reservations = await ReservationRepository.findByCar(carId);

  const hasActiveReservations = reservations.some(
    (reservation) =>
      reservation.status === 'PENDING' ||
      reservation.status === 'CONFIRMED' ||
      reservation.status === 'IN_PROGRESS',
  );

  if (hasActiveReservations) {
    throw new Error('CAR_HAS_ACTIVE_RESERVATIONS');
  }

  await CarRepository.delete(carId);
}

export async function updateCompanyCar(
  req: NextRequest,
  carId: number,
  companyId: number,
) {
  if (!carId || Number.isNaN(carId)) {
    throw new Error('INVALID_CAR_ID');
  }

  const existingCar = await CarRepository.findById(carId);

  if (!existingCar) {
    throw new Error('CAR_NOT_FOUND');
  }

  if (existingCar.companyId !== companyId) {
    throw new Error('UNAUTHORIZED_CAR_ACCESS');
  }

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  let body: UpdateParsedInput;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    body = {};

    for (const key of [
      'make',
      'model',
      'year',
      'pricePerDay',
      'power',
      'displacement',
      'carType',
      'transmission',
      'transmissionType',
      'fuelType',
      'officeId',
    ]) {
      const value = form.get(key);

      if (value !== null && typeof value !== 'object') {
        body[key] = value;
      }
    }

    const keptImages = form
      .getAll('existingImages')
      .filter((value): value is string => typeof value === 'string');
    const fileEntries = form
      .getAll('images')
      .filter((value): value is File => value instanceof File);
    const uploadedImages = await saveCompanyCarImages(fileEntries, companyId);

    if (
      form.get('imagesTouched') === '1' ||
      keptImages.length > 0 ||
      uploadedImages.length > 0
    ) {
      body.images = [...keptImages, ...uploadedImages];
    }
  } else {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new Error('INVALID_JSON_BODY');
    }
  }

  const updateInput: Record<string, unknown> = {};

  if (body.make !== undefined) updateInput.make = String(body.make).trim();
  if (body.model !== undefined) updateInput.model = String(body.model).trim();
  if (body.year !== undefined) updateInput.year = Number(body.year);
  if (body.pricePerDay !== undefined) {
    updateInput.pricePerDay = Number(body.pricePerDay);
  }
  if (body.power !== undefined) updateInput.power = Number(body.power);
  if (body.displacement !== undefined) {
    updateInput.displacement = Number(body.displacement);
  }

  if (body.carType !== undefined) {
    updateInput.carType =
      mapCarType(body.carType != null ? String(body.carType) : null) ??
      undefined;
  }

  if (body.transmission !== undefined || body.transmissionType !== undefined) {
    updateInput.transmissionType =
      mapTransmissionType(
        body.transmission != null ? String(body.transmission) : null,
      ) ??
      mapTransmissionType(
        body.transmissionType != null ? String(body.transmissionType) : null,
      ) ??
      undefined;
  }

  if (body.fuelType !== undefined) {
    updateInput.fuelType =
      mapFuelType(body.fuelType != null ? String(body.fuelType) : null) ??
      undefined;
  }

  if (body.officeId !== undefined) {
    updateInput.officeId =
      body.officeId === null || body.officeId === ''
        ? null
        : Number(body.officeId);
  }

  if (body.images !== undefined && Array.isArray(body.images)) {
    updateInput.images = body.images.filter(
      (it: unknown) => typeof it === 'string',
    );
  }

  const result = companyCarUpdateSchema.safeParse(updateInput);

  if (!result.success) {
    throw new Error(getCompanyCarZodErrorCode(result.error));
  }

  const { officeId, ...validatedUpdateData } = result.data;
  const updateData: Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt'>> = {
    ...validatedUpdateData,
  };

  if (officeId !== undefined && officeId !== null) {
    updateData.officeId = officeId;
  }

  const updated = await CarRepository.update(carId, updateData);

  if (!updated) {
    throw new Error('CAR_NOT_FOUND');
  }

  return updated;
}
