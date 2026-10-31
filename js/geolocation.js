export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location services aren't available in this browser. You can still search for a place."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const messages = {
          1: "Location permission was denied. You can allow access in browser settings or search for a place.",
          2: "Your location couldn't be determined. Check your device's location services or search for a place.",
          3: "Finding your location took too long. Please try again or search for a place."
        };
        reject(new Error(messages[error.code] || "We couldn't access your location. Please search for a place instead."));
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}
