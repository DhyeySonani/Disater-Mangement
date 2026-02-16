import { useMemo, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 };
const DEFAULT_ZOOM = 6;
const containerStyle = { width: "100%", height: "400px", borderRadius: "12px" };

export default function RescueMap({ markers = [], height = "400px" }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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

  const mapCenter = useMemo(() => {
    if (validMarkers.length === 0) return DEFAULT_CENTER;
    if (validMarkers.length === 1)
      return { lat: validMarkers[0].lat, lng: validMarkers[0].lng };
    const sum = validMarkers.reduce(
      (acc, m) => ({ lat: acc.lat + m.lat, lng: acc.lng + m.lng }),
      { lat: 0, lng: 0 }
    );
    return {
      lat: sum.lat / validMarkers.length,
      lng: sum.lng / validMarkers.length
    };
  }, [validMarkers]);

  const onLoad = useCallback((map) => {
    if (validMarkers.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    validMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds, 40);
  }, [validMarkers]);

  if (!apiKey) {
    return (
      <div
        className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-sm"
        style={{ height }}
      >
        Add VITE_GOOGLE_MAPS_API_KEY to .env to show rescue map.
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height }}
        center={mapCenter}
        zoom={validMarkers.length === 1 ? 14 : validMarkers.length > 1 ? 10 : DEFAULT_ZOOM}
        onLoad={onLoad}
        options={{ mapTypeControl: true, streetViewControl: false, fullscreenControl: true }}
      >
        {validMarkers.map((m) => (
          <Marker
            key={m.id || `${m.lat}-${m.lng}`}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.title}
            label={m.label}
            onClick={() => setSelectedMarker(m)}
          />
        ))}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1 text-sm text-slate-800 max-w-[220px]">
              {selectedMarker.title && <p className="font-semibold">{selectedMarker.title}</p>}
              {selectedMarker.description && <p className="text-slate-600 mt-1">{selectedMarker.description}</p>}
              {selectedMarker.phone && <p className="mt-1">Contact: {selectedMarker.phone}</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
