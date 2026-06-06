import { NextResponse } from 'next/server';

export function handleCompanyCarsError(error: unknown) {
  console.error('company/cars route error:', error);

  if (error instanceof Error) {
    switch (error.message) {
      case 'FORBIDDEN':
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      case 'MISSING_COMPANY_CONTEXT':
        return NextResponse.json(
          { error: 'Missing company or owner id' },
          { status: 400 },
        );

      case 'INVALID_JSON_BODY':
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 },
        );

      case 'INVALID_CAR_ID':
        return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });

      case 'CAR_NOT_FOUND':
        return NextResponse.json({ error: 'Car not found' }, { status: 404 });

      case 'UNAUTHORIZED_CAR_ACCESS':
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      case 'TOO_MANY_FILES':
        return NextResponse.json({ error: 'Too many files' }, { status: 400 });

      case 'MISSING_MAKE_OR_MODEL':
        return NextResponse.json(
          { error: 'Missing required fields: make or model' },
          { status: 400 },
        );

      case 'INVALID_YEAR':
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 });

      case 'INVALID_PRICE':
        return NextResponse.json(
          { error: 'Invalid pricePerDay' },
          { status: 400 },
        );

      case 'INVALID_CAR_TYPE':
        return NextResponse.json(
          { error: 'Missing or invalid carType' },
          { status: 400 },
        );

      case 'INVALID_TRANSMISSION':
        return NextResponse.json(
          { error: 'Missing or invalid transmission' },
          { status: 400 },
        );
      case 'CAR_HAS_ACTIVE_RESERVATIONS':
        return NextResponse.json(
          {
            error:
              'Автомобилът има активни резервации и не може да бъде изтрит.',
          },
          { status: 400 },
        );

      case 'INVALID_FUEL_TYPE':
        return NextResponse.json(
          { error: 'Missing or invalid fuelType' },
          { status: 400 },
        );

      case 'INVALID_POWER':
        return NextResponse.json(
          { error: 'Invalid power (HP)' },
          { status: 400 },
        );

      case 'INVALID_DISPLACEMENT':
        return NextResponse.json(
          { error: 'Invalid displacement (cc)' },
          { status: 400 },
        );

      case 'INVALID_OFFICE_ID':
        return NextResponse.json(
          { error: 'Invalid officeId' },
          { status: 400 },
        );

      case 'NO_UPDATE_FIELDS':
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 },
        );

      case 'CAR_HAS_RESERVATIONS':
        return NextResponse.json(
          { error: 'Cannot delete car with existing reservations' },
          { status: 400 },
        );
    }
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
