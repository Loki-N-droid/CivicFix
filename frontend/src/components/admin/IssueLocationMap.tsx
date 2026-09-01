import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { Icon } from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const ZOOM = 16

const markerIconInstance = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type IssueLocationMapProps = {
  latitude: number
  longitude: number
}

/** Read-only counterpart to LocationPicker — same tile layer and marker
 * assets, but no click handler and no draggable marker, since an admin is
 * viewing a location that was already fixed at submission time. */
export default function IssueLocationMap({ latitude, longitude }: IssueLocationMapProps) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={ZOOM}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={markerIconInstance} />
      </MapContainer>
    </div>
  )
}
