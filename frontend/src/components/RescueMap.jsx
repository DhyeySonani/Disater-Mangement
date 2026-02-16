import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in React/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

// Custom red marker for SOS/rescue points
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DEFAULT_CENTER = [23.0225, 72.5714];
const DEFAULT_ZOOM = 6;

// Component to fit bounds when markers change
function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [markers, map]);
  return null;
}

export default function RescueMap({ markers = [], height = "400px" }) {
  const validMarkers = useMemo(
    () =>
      markers.filter(
        (m) =>
          m &&
          typeof m.lat === "number" &&
          typeof m.lng === "number" &&
          Number.isFinite(m.lat) &&
          Number.isFinite(m.lng)
      ),
    [markers]
  );

  const initialCenter =
    validMarkers.length === 1
      ? [validMarkers[0].lat, validMarkers[0].lng]
      : DEFAULT_CENTER;

  const initialZoom = validMarkers.length ? 10 : DEFAULT_ZOOM;

  return (
    <div
      style={{ height, borderRadius: "12px", overflow: "hidden" }}
      className="border border-slate-200"
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!!validMarkers.length && <FitBounds markers={validMarkers} />}
        {validMarkers.map((m) => (
          <Marker
            key={m.id || `${m.lat}-${m.lng}`}
            position={[m.lat, m.lng]}
            icon={redIcon}
          >
            <Popup>
              <div className="text-sm text-slate-800 max-w-[220px]">
                {m.title && <p className="font-semibold mb-1">{m.title}</p>}
                {m.description && (
                  <p className="text-slate-600 mb-1">{m.description}</p>
                )}
                {m.phone && (
                  <p className="text-slate-700">
                    Contact:{" "}
                    <a
                      href={`tel:${m.phone}`}
                      className="text-red-600 hover:underline"
                    >
                      {m.phone}
                    </a>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
