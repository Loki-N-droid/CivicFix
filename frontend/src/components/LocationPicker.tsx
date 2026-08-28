import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }
const DEFAULT_ZOOM = 5
const SELECTED_ZOOM = 16

const selectedIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type LocationPickerProps = {
  latitude: number | null
  longitude: number | null
  flyToKey: number
  onSelect: (latitude: number, longitude: number) => void
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (latitude: number, longitude: number) => void
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FlyToLocation({
  latitude,
  longitude,
  flyToKey,
}: {
  latitude: number
  longitude: number
  flyToKey: number
}) {
  const map = useMap()

  useEffect(() => {
    if (flyToKey === 0) {
      return
    }
    map.flyTo([latitude, longitude], SELECTED_ZOOM)
    // Only recenter when current-location is requested, not when the marker is dragged or the map is clicked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToKey, map])

  return null
}

export default function LocationPicker({
  latitude,
  longitude,
  flyToKey,
  onSelect,
}: LocationPickerProps) {
  const hasSelection = latitude !== null && longitude !== null
  const center = hasSelection
    ? { lat: latitude, lng: longitude }
    : DEFAULT_CENTER

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={hasSelection ? SELECTED_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={onSelect} />
        {hasSelection ? (
          <>
            <FlyToLocation
              latitude={latitude}
              longitude={longitude}
              flyToKey={flyToKey}
            />
            <Marker
              position={[latitude, longitude]}
              draggable
              icon={selectedIcon}
              eventHandlers={{
                dragend: (event) => {
                  const next = event.target.getLatLng()
                  onSelect(next.lat, next.lng)
                },
              }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  )
}
