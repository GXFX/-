import { useEffect, useState } from "react";

const FALLBACK = { lat: 55.7558, lng: 37.6173 }; // Москва, на случай отказа

export function useGeoLocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords(FALLBACK);
      setError("no_geolocation");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setCoords(FALLBACK);
        setError("denied");
      }
    );
  }, []);

  return { coords, error };
}
