import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import LocationPicker from '../components/LocationPicker'
import { useGeolocation } from '../hooks/useGeolocation'
import { fetchCategories } from '../services/categories'
import { createIssue } from '../services/issues'

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const reportIssueSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10),
  category_id: z.number().int().positive('Select a category'),
  citizen_severity: z.enum(['low', 'medium', 'high']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(255).optional(),
})

type ReportIssueForm = z.infer<typeof reportIssueSchema>

function imageError(files: File[]): string | null {
  if (files.length > MAX_IMAGES) {
    return `You can attach up to ${MAX_IMAGES} images.`
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return `${file.name} is not a JPEG, PNG, or WEBP image.`
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `${file.name} exceeds the 5 MB size limit.`
    }
  }

  return null
}

export default function ReportIssuePage() {
  const [images, setImages] = useState<File[]>([])
  const [imageMessage, setImageMessage] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [flyToKey, setFlyToKey] = useState(0)
  const { status, coords, message: geoMessage, requestLocation } = useGeolocation()

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportIssueForm>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      title: '',
      description: '',
      citizen_severity: 'medium',
      address: '',
    },
  })

  const latitude = watch('latitude')
  const longitude = watch('longitude')

  useEffect(() => {
    if (!coords) {
      return
    }
    setValue('latitude', coords.latitude, { shouldValidate: true })
    setValue('longitude', coords.longitude, { shouldValidate: true })
    setFlyToKey((key) => key + 1)
  }, [coords, setValue])

  function handleMapSelect(nextLatitude: number, nextLongitude: number) {
    setValue('latitude', nextLatitude, { shouldValidate: true })
    setValue('longitude', nextLongitude, { shouldValidate: true })
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? [])
    const error = imageError(next)
    setImageMessage(error)
    setImages(error ? [] : next)
  }

  async function onSubmit(values: ReportIssueForm) {
    setSubmitMessage(null)
    setSubmitError(null)

    const error = imageError(images)
    if (error) {
      setImageMessage(error)
      return
    }

    try {
      const issue = await createIssue({
        title: values.title,
        description: values.description,
        category_id: values.category_id,
        citizen_severity: values.citizen_severity,
        latitude: values.latitude,
        longitude: values.longitude,
        address: values.address?.trim() || null,
        images,
      })
      setSubmitMessage(`Issue #${issue.id} submitted. Location saved with the report.`)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setSubmitError('You need to be signed in to submit a report.')
        return
      }
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setSubmitError(
          typeof detail === 'string' ? detail : 'Could not submit the issue. Please try again.',
        )
        return
      }
      setSubmitError('Could not submit the issue. Please try again.')
    }
  }

  const geoStatusLabel = {
    idle: 'Location not requested yet.',
    loading: 'Getting your current location…',
    granted: 'Location permission granted.',
    denied: 'Location permission denied.',
    unavailable: 'Current location unavailable.',
  }[status]

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Report an issue</h1>
        <p className="mt-1 text-slate-500">
          Choose a location on the map, then send latitude and longitude with your report.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              {...register('title')}
            />
            {errors.title ? (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              {...register('description')}
            />
            {errors.description ? (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="category_id">
                Category
              </label>
              <select
                id="category_id"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                defaultValue=""
                {...register('category_id', { valueAsNumber: true })}
              >
                <option value="" disabled>
                  {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                </option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesError ? (
                <p className="mt-1 text-sm text-red-600">Could not load categories.</p>
              ) : null}
              {errors.category_id ? (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              ) : null}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-slate-700"
                htmlFor="citizen_severity"
              >
                Severity
              </label>
              <select
                id="citizen_severity"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                {...register('citizen_severity')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-700">Location</h2>
              <button
                type="button"
                onClick={requestLocation}
                disabled={status === 'loading'}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? 'Locating…' : 'Use current location'}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">{geoStatusLabel}</p>
            {geoMessage ? <p className="mt-1 text-sm text-slate-600">{geoMessage}</p> : null}
            <p className="mt-1 text-sm text-slate-500">
              Click the map to place a marker, then drag it to adjust the point.
            </p>
            <div className="mt-3">
              <LocationPicker
                latitude={Number.isFinite(latitude) ? latitude : null}
                longitude={Number.isFinite(longitude) ? longitude : null}
                flyToKey={flyToKey}
                onSelect={handleMapSelect}
              />
            </div>
            {latitude !== undefined && longitude !== undefined ? (
              <p className="mt-2 text-sm text-slate-600">
                Selected coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No location selected yet.</p>
            )}
            {errors.latitude || errors.longitude ? (
              <p className="mt-1 text-sm text-red-600">Select a location on the map.</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="address">
              Address (optional)
            </label>
            <input
              id="address"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              placeholder="Street, landmark, or area"
              {...register('address')}
            />
            {errors.address ? (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="images">
              Photos (optional, up to 5)
            </label>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1 w-full text-sm text-slate-700"
              onChange={handleImagesChange}
            />
            {imageMessage ? <p className="mt-1 text-sm text-red-600">{imageMessage}</p> : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          {submitMessage ? <p className="text-sm text-green-700">{submitMessage}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      </div>
    </div>
  )
}
