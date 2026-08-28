import { useCallback, useState } from 'react'

export type GeolocationStatus =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unavailable'

export type GeoCoords = {
  latitude: number
  longitude: number
}

const PERMISSION_DENIED = 1
const POSITION_UNAVAILABLE = 2

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setMessage(
        'Location is unavailable in this browser. Click the map to choose a point instead.',
      )
      return
    }

    setStatus('loading')
    setMessage('Getting your current location…')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('granted')
        setMessage('Using your current location. You can drag the marker to adjust it.')
      },
      (error) => {
        if (error.code === PERMISSION_DENIED) {
          setStatus('denied')
          setMessage(
            'Location permission was denied. Click the map to choose a point instead.',
          )
          return
        }

        if (error.code === POSITION_UNAVAILABLE) {
          setStatus('unavailable')
          setMessage(
            'Your location is currently unavailable. Click the map to choose a point instead.',
          )
          return
        }

        setStatus('unavailable')
        setMessage(
          'Could not determine your location. Click the map to choose a point instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }, [])

  return { status, coords, message, requestLocation }
}
