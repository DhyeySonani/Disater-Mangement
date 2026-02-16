import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function MapComponent({ locations }) {
  const containerStyle = {
    width: "100%",
    height: "400px"
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_KEY">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 23.0225, lng: 72.5714 }}
        zoom={6}
      >
        {locations.map((loc, index) => (
          <Marker
            key={index}
            position={{ lat: loc.lat, lng: loc.lng }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
