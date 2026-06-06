import React, { useState } from 'react';
import Modal from 'react-modal';
import { Car } from '@/types/types';
import { updateCar } from '@/lib/api/adminApi';
import { useTranslation } from '@/providers/LanguageProvider';
import {
  carTypeKey,
  fuelTypeKey,
  transmissionKey,
} from '@/lib/utils/vehicleLocalization';
import { useEffect } from 'react';
import { getCompanyOffices } from '@/lib/api/companyApi';

interface OfficeOption {
  id: number;
  name?: string;
  address?: string;
}

const imageCopy = {
  bg: {
    images: 'Снимки',
    currentImage: 'Текуща снимка',
    removeImage: 'Махни',
    newImagesSelected: 'Избрани нови снимки: {{count}}',
    imagesHint:
      'Новите снимки ще се запазят заедно с текущите снимки, които не са премахнати.',
  },
  en: {
    images: 'Images',
    currentImage: 'Current image',
    removeImage: 'Remove',
    newImagesSelected: 'New images selected: {{count}}',
    imagesHint:
      'New images will be saved together with the current images that you have not removed.',
  },
};

interface EditCarModalProps {
  car: Car;
  onClose: () => void;
  onSuccess: () => void;
}

if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function EditCarModal({
  car,
  onClose,
  onSuccess,
}: EditCarModalProps) {
  const { locale, t } = useTranslation();
  const imageText = imageCopy[locale];
  const [formData, setFormData] = useState<Partial<Car>>({
    make: car.make,
    model: car.model,
    year: car.year,
    pricePerDay: car.pricePerDay,
    carType: car.carType,
    transmissionType: car.transmissionType,
    fuelType: car.fuelType,
    power: car.power,
    displacement: car.displacement,
    officeId: car.officeId,
  });
  const [existingImages, setExistingImages] = useState<string[]>(
    () => car.images ?? [],
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<OfficeOption[]>([]);

  useEffect(() => {
    async function loadOffices() {
      try {
        const data = await getCompanyOffices();

        setOffices(
          data
            .filter(
              (office): office is OfficeOption => typeof office.id === 'number',
            )
            .map((office) => ({
              id: office.id,
              name: office.name,
              address: office.address,
            })),
        );
      } catch {
        setOffices([]);
      }
    }

    void loadOffices();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'year' ||
        name === 'pricePerDay' ||
        name === 'power' ||
        name === 'displacement' ||
        name === 'officeId'
          ? Number(value)
          : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImages(Array.from(e.target.files ?? []));
  };

  const removeExistingImage = (image: string) => {
    setExistingImages((prev) => prev.filter((item) => item !== image));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        if (value !== undefined && value !== null) {
          payload.append(key, String(value));
        }
      }

      for (const image of existingImages) {
        payload.append('existingImages', image);
      }

      payload.append('imagesTouched', '1');

      for (const image of newImages) {
        payload.append('images', image);
      }

      await updateCar(car.id, payload);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error updating car:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      contentLabel={t('editCarModal.title')}
      className="bg-white rounded-lg py-4 max-w-lg w-full relative z-50 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
    >
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          {t('editCarModal.title')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.brand')}
              </label>
              <input
                type="text"
                name="make"
                value={formData.make || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.model')}
              </label>
              <input
                type="text"
                name="model"
                value={formData.model || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.year')}
              </label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.pricePerDay')}
              </label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.bodyType')}
              </label>
              <select
                name="carType"
                value={formData.carType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('editCarModal.selectType')}</option>
                {[
                  'SUV',
                  'SEDAN',
                  'HATCHBACK',
                  'COUPE',
                  'CONVERTIBLE',
                  'WAGON',
                  'VAN',
                  'PICKUP',
                  'OTHER',
                ].map((option) => {
                  const key = carTypeKey(option);
                  return (
                    <option key={option} value={option}>
                      {key ? t(`vehicle.bodyTypes.${key}`) : option}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.transmission')}
              </label>
              <select
                name="transmissionType"
                value={formData.transmissionType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('editCarModal.selectTransmission')}</option>
                {['AUTOMATIC', 'MANUAL', 'SEMI_AUTOMATIC', 'OTHER'].map(
                  (option) => {
                    const key = transmissionKey(option);
                    return (
                      <option key={option} value={option}>
                        {key ? t(`vehicle.transmissions.${key}`) : option}
                      </option>
                    );
                  },
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('vehicle.fuelType')}
              </label>
              <select
                name="fuelType"
                value={formData.fuelType || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('editCarModal.selectFuel')}</option>
                {['PETROL', 'DIESEL', 'ELECTRICITY', 'HYBRID', 'OTHER'].map(
                  (option) => {
                    const key = fuelTypeKey(option);
                    return (
                      <option key={option} value={option}>
                        {key ? t(`vehicle.fuelTypes.${key}`) : option}
                      </option>
                    );
                  },
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('editCarModal.power')}
              </label>
              <input
                type="number"
                name="power"
                value={formData.power || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('editCarModal.displacement')}
              </label>
              <input
                type="number"
                name="displacement"
                value={formData.displacement || ''}
                onChange={handleChange}
                required
                className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Office
            </label>

            <select
              name="officeId"
              value={formData.officeId ?? ''}
              onChange={handleChange}
              className="text-gray-500 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No office</option>

              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name || office.address || `Office #${office.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {imageText.images}
            </label>

            {existingImages.length > 0 ? (
              <div className="mb-3 grid grid-cols-3 gap-3">
                {existingImages.map((image) => (
                  <div
                    key={image}
                    className="relative overflow-hidden rounded border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={imageText.currentImage}
                      className="h-20 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs text-white"
                    >
                      {imageText.removeImage}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {newImages.length > 0 ? (
              <div className="mb-3 rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="mb-2 font-medium">
                  {imageText.newImagesSelected.replace(
                    '{{count}}',
                    String(newImages.length),
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {newImages.map((image, index) => (
                    <button
                      key={`${image.name}-${index}`}
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="rounded-full bg-white px-3 py-1 text-xs text-blue-800 shadow-sm"
                    >
                      {image.name} x
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <input
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-blue-700"
            />
            <p className="mt-1 text-xs text-gray-500">{imageText.imagesHint}</p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting
                ? t('profileSettings.saving')
                : t('profileSettings.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
