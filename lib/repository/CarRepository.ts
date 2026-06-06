import { query, queryOne, execute } from '../db';
import { Car } from '@/types/database';

interface CarSearchFilters {
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  startDate?: string;
  endDate?: string;
}

export class CarRepository {
  static async findById(id: number): Promise<Car | null> {
    return queryOne<Car>('SELECT * FROM "Car" WHERE id = $1', [id]);
  }

  static async getAll(): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car"');
  }

  static async create(
    data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Car> {
    const fields = Object.keys(data)
      .map((key) => `"${key}"`)
      .join(', ');
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const values = Object.values(data);

    const result = await queryOne<Car>(
      `INSERT INTO "Car" (${fields}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result!;
  }

  static async update(
    id: number,
    data: Partial<Omit<Car, 'id' | 'createdAt'>>,
  ): Promise<Car | null> {
    const entries = Object.entries(data);

    if (entries.length === 0) {
      return this.findById(id);
    }

    const setClause = entries
      .map(([key], index) => `"${key}" = $${index + 2}`)
      .join(', ');

    const values = [id, ...entries.map(([, value]) => value)];

    return queryOne<Car>(
      `UPDATE "Car"
     SET ${setClause}, "updatedAt" = NOW()
     WHERE id = $1
     RETURNING *`,
      values,
    );
  }

  static async findMany(where?: Partial<Car>): Promise<Car[]> {
    if (!where) return query<Car>('SELECT * FROM "Car"');

    const entries = Object.entries(where);
    const whereClause = entries
      .map(([key], i) => `${key} = $${i + 1}`)
      .join(' AND ');
    const values = entries.map(([, value]) => value);

    return query<Car>(`SELECT * FROM "Car" WHERE ${whereClause}`, values);
  }

  static async findByOwner(ownerId: number): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car" WHERE "ownerId" = $1', [ownerId]);
  }

  static async findByCompany(companyId: number): Promise<Car[]> {
    return query<Car>('SELECT * FROM "Car" WHERE "companyId" = $1', [
      companyId,
    ]);
  }

  static async countByCompany(companyId: number): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM "Car" WHERE "companyId" = $1',
      [companyId],
    );
    return parseInt(result[0]?.count || '0', 10);
  }

  static async findManyByCompanyId(companyId: number) {
    const cars = await query('SELECT * FROM "Car" WHERE "companyId" = $1', [
      companyId,
    ]);
    return cars;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await execute('DELETE FROM "Car" WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
  static async hasReservations(carId: number): Promise<boolean> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM "Reservation" WHERE "carId" = $1',
      [carId],
    );
    return parseInt(result[0]?.count || '0', 10) > 0;
  }

  static async findFiltered(filters: CarSearchFilters) {
    const conditions: string[] = [];
    const values: Array<string | number> = [];

    if (filters.make) {
      values.push(filters.make);
      conditions.push(`c.make = $${values.length}`);
    }

    if (filters.transmission) {
      values.push(filters.transmission);
      conditions.push(`c.transmission = $${values.length}`);
    }

    if (filters.fuelType) {
      values.push(filters.fuelType);
      conditions.push(`c.fuelType = $${values.length}`);
    }

    if (typeof filters.minPrice === 'number') {
      values.push(filters.minPrice);
      conditions.push(`c."pricePerDay" >= $${values.length}`);
    }

    if (typeof filters.maxPrice === 'number') {
      values.push(filters.maxPrice);
      conditions.push(`c."pricePerDay" <= $${values.length}`);
    }

    // 🔥 ТУК Е МАГИЯТА
    if (filters.startDate && filters.endDate) {
      values.push(filters.startDate);
      const startIndex = values.length;

      values.push(filters.endDate);
      const endIndex = values.length;

      conditions.push(`
        NOT EXISTS (
          SELECT 1
          FROM "Reservation" r
          WHERE r."carId" = c.id
            AND r."startDate" <= $${endIndex}
            AND r."endDate" >= $${startIndex}
            AND r.status IN ('PENDING', 'CONFIRMED')
        )
      `);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
  SELECT
    c.*,
    o.name as "location",
    comp.name as "companyName"
  FROM "Car" c
  LEFT JOIN "Office" o ON o.id = c."officeId"
  LEFT JOIN "Company" comp ON comp.id = c."companyId"
  ${where}
  ORDER BY c.id DESC
`;

    return query(sql, values);
  }
}
