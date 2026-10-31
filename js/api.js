const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

async function requestJson(url, label, signal) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("We couldn't connect to the weather service. Check your connection and try again.");
  }

  if (response.status === 429) {
    throw new Error("The weather service is receiving too many requests. Please wait a moment and retry.");
  }
  if (!response.ok) {
    throw new Error(`${label} is temporarily unavailable (HTTP ${response.status}). Please try again.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${label} returned an unreadable response. Please try again.`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${label} returned an invalid response. Please try again.`);
  }
  if (data.error) {
    throw new Error(typeof data.reason === "string" ? data.reason : `${label} could not complete the request.`);
  }
  return data;
}

function assertForecastShape(data) {
  const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
  if (!isRecord(data.current) || !isRecord(data.hourly) ||
      !Array.isArray(data.hourly.time) || data.hourly.time.length === 0 ||
      !isRecord(data.daily) || !Array.isArray(data.daily.time) || data.daily.time.length === 0 ||
      !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    throw new Error("The weather service returned incomplete forecast data. Please try again.");
  }
  return data;
}

export async function searchLocations(query, signal) {
  const url = new URL(GEOCODING_BASE);
  url.search = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json"
  });
  const data = await requestJson(url, "Location search", signal);
  if (data.results !== undefined && !Array.isArray(data.results)) {
    throw new Error("Location search returned an invalid result list.");
  }
  return (data.results || []).filter((place) =>
    Number.isFinite(place.latitude) && Number.isFinite(place.longitude) &&
    typeof place.name === "string"
  ).map((place) => ({
    id: `${place.latitude.toFixed(5)},${place.longitude.toFixed(5)}`,
    name: place.name,
    admin1: typeof place.admin1 === "string" ? place.admin1 : "",
    country: typeof place.country === "string" ? place.country : "",
    countryCode: typeof place.country_code === "string" ? place.country_code : "",
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: typeof place.timezone === "string" ? place.timezone : "auto"
  }));
}

export async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day",
      "precipitation", "weather_code", "cloud_cover", "pressure_msl", "surface_pressure",
      "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility",
      "dew_point_2m", "uv_index"
    ].join(","),
    hourly: [
      "temperature_2m", "apparent_temperature", "precipitation_probability",
      "precipitation", "weather_code", "wind_speed_10m", "uv_index", "is_day"
    ].join(","),
    daily: [
      "weather_code", "temperature_2m_max", "temperature_2m_min",
      "precipitation_probability_max", "precipitation_sum", "sunrise", "sunset", "uv_index_max"
    ].join(","),
    forecast_days: "7",
    timezone: "auto"
  });
  const data = assertForecastShape(await requestJson(`${API_BASE}?${params}`, "Weather data"));
  return data;
}

export async function getAirQuality(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "european_aqi,us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
    timezone: "auto"
  });
  const data = await requestJson(`${AIR_QUALITY_BASE}?${params}`, "Air-quality data");
  if (!data.current || typeof data.current !== "object") {
    throw new Error("Air-quality data is not available for this location right now.");
  }
  return data;
}
