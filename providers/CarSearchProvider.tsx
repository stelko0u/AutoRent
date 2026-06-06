'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchCarsByDateRange } from '@/lib/api/carApi';
import type { HomeCar, SearchFilters } from '@/types/home';

type DateFilterState = 'idle' | 'incomplete' | 'invalid' | 'ready';

type CarSearchContextType = {
  cars: HomeCar[];
  filteredCars: HomeCar[];
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  resetFilters: () => void;
  uniqueMakes: string[];
  uniqueLocations: string[];
  uniqueBodyTypes: string[];
  uniqueTransmissions: string[];
  uniqueFuelTypes: string[];
  isLoading: boolean;
  errorMessage: string;
  dateFilterState: DateFilterState;
};

const defaultFilters: SearchFilters = {
  query: '',
  make: '',
  location: '',
  bodyType: '',
  transmission: '',
  fuelType: '',
  minPrice: '',
  maxPrice: '',
  minHorsepower: '',
  maxHorsepower: '',
  yearFrom: '',
  yearTo: '',
  startDate: '',
  endDate: '',
};

const CarSearchContext = createContext<CarSearchContextType | null>(null);

function normalizeValue(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .trim();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map((value) => value.trim()))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function isValidDateValue(value: string): boolean {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function getDateFilterState(
  startDate: string,
  endDate: string,
): DateFilterState {
  const hasStartDate = Boolean(startDate);
  const hasEndDate = Boolean(endDate);

  if (!hasStartDate && !hasEndDate) {
    return 'idle';
  }

  if (!hasStartDate || !hasEndDate) {
    return 'incomplete';
  }

  if (!isValidDateValue(startDate) || !isValidDateValue(endDate)) {
    return 'invalid';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return 'invalid';
  }

  return 'ready';
}

export function CarSearchProvider({
  cars: initialCars,
  children,
}: {
  cars: HomeCar[];
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [cars, setCars] = useState<HomeCar[]>(initialCars);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const requestIdRef = useRef(0);

  const dateFilterState = useMemo(
    () => getDateFilterState(filters.startDate, filters.endDate),
    [filters.startDate, filters.endDate],
  );

  const setFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCars(initialCars);
    setIsLoading(false);
    setErrorMessage('');
  };

  useEffect(() => {
    let isActive = true;

    async function loadCarsByDates() {
      if (dateFilterState === 'idle') {
        setCars(initialCars);
        setIsLoading(false);
        setErrorMessage('');
        return;
      }

      if (dateFilterState === 'incomplete') {
        setCars(initialCars);
        setIsLoading(false);
        setErrorMessage('');
        return;
      }

      if (dateFilterState === 'invalid') {
        setCars([]);
        setIsLoading(false);
        setErrorMessage('');
        return;
      }

      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;

      setIsLoading(true);
      setErrorMessage('');

      try {
        const availableCars = await fetchCarsByDateRange(
          filters.startDate,
          filters.endDate,
        );

        if (!isActive || requestIdRef.current !== currentRequestId) {
          return;
        }

        setCars(availableCars);
      } catch (error: unknown) {
        if (!isActive || requestIdRef.current !== currentRequestId) {
          return;
        }

        console.error('Failed to fetch cars by date range:', error);
        setCars([]);
        setErrorMessage('Не успяхме да заредим свободните автомобили.');
      } finally {
        if (isActive && requestIdRef.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    }

    void loadCarsByDates();

    return () => {
      isActive = false;
    };
  }, [dateFilterState, filters.startDate, filters.endDate, initialCars]);

  const filteredCars = useMemo(() => {
    if (dateFilterState === 'invalid') {
      return [];
    }

    return cars.filter((car) => {
      const query = normalizeValue(filters.query);

      if (query) {
        const haystack = [
          car.name,
          car.make,
          car.model,
          car.carType,
          car.transmissionType,
          car.fuelType,
          car.location,
          car.companyName ?? '',
          car.year,
          car.power,
          car.pricePerDay,
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.make && car.make !== filters.make) {
        return false;
      }

      if (filters.location && car.location !== filters.location) {
        return false;
      }

      if (filters.bodyType && car.carType !== filters.bodyType) {
        return false;
      }

      if (
        filters.transmission &&
        car.transmissionType !== filters.transmission
      ) {
        return false;
      }

      if (filters.fuelType && car.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.minPrice && car.pricePerDay < Number(filters.minPrice)) {
        return false;
      }

      if (filters.maxPrice && car.pricePerDay > Number(filters.maxPrice)) {
        return false;
      }

      if (filters.minHorsepower && car.power < Number(filters.minHorsepower)) {
        return false;
      }

      if (filters.maxHorsepower && car.power > Number(filters.maxHorsepower)) {
        return false;
      }

      if (filters.yearFrom && car.year < Number(filters.yearFrom)) {
        return false;
      }

      if (filters.yearTo && car.year > Number(filters.yearTo)) {
        return false;
      }

      return true;
    });
  }, [cars, dateFilterState, filters]);

  const uniqueMakes = useMemo(
    () => uniqueSorted(cars.map((car) => car.make)),
    [cars],
  );

  const uniqueLocations = useMemo(() => {
    const carsForLocations = cars.filter((car) => {
      const query = normalizeValue(filters.query);

      if (query) {
        const haystack = [
          car.name,
          car.make,
          car.model,
          car.carType,
          car.transmissionType,
          car.fuelType,
          car.location,
          car.companyName ?? '',
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.make && car.make !== filters.make) {
        return false;
      }

      if (filters.bodyType && car.carType !== filters.bodyType) {
        return false;
      }

      if (
        filters.transmission &&
        car.transmissionType !== filters.transmission
      ) {
        return false;
      }

      if (filters.fuelType && car.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.minPrice && car.pricePerDay < Number(filters.minPrice)) {
        return false;
      }

      if (filters.maxPrice && car.pricePerDay > Number(filters.maxPrice)) {
        return false;
      }

      if (filters.minHorsepower && car.power < Number(filters.minHorsepower)) {
        return false;
      }

      if (filters.maxHorsepower && car.power > Number(filters.maxHorsepower)) {
        return false;
      }

      if (filters.yearFrom && car.year < Number(filters.yearFrom)) {
        return false;
      }

      if (filters.yearTo && car.year > Number(filters.yearTo)) {
        return false;
      }

      return true;
    });

    return uniqueSorted(
      carsForLocations
        .map((car) => car.location)
        .filter((location): location is string => Boolean(location)),
    );
  }, [cars, filters]);

  const uniqueBodyTypes = useMemo(
    () => uniqueSorted(cars.map((car) => car.carType ?? '')),
    [cars],
  );

  const uniqueTransmissions = useMemo(
    () => uniqueSorted(cars.map((car) => car.transmissionType ?? '')),
    [cars],
  );

  const uniqueFuelTypes = useMemo(
    () => uniqueSorted(cars.map((car) => car.fuelType ?? '')),
    [cars],
  );

  return (
    <CarSearchContext.Provider
      value={{
        cars,
        filteredCars,
        filters,
        setFilter,
        resetFilters,
        uniqueMakes,
        uniqueLocations,
        uniqueBodyTypes,
        uniqueTransmissions,
        uniqueFuelTypes,
        isLoading,
        errorMessage,
        dateFilterState,
      }}
    >
      {children}
    </CarSearchContext.Provider>
  );
}

export function useCarSearch() {
  const ctx = useContext(CarSearchContext);

  if (!ctx) {
    throw new Error('useCarSearch must be used inside CarSearchProvider');
  }

  return ctx;
}
