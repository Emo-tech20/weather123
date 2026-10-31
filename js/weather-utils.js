export const WEATHER_CODES = {
  0: ["Clear sky", "sun"],
  1: ["Mostly clear", "sun"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloud"],
  45: ["Fog", "fog"],
  48: ["Depositing rime fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Drizzle", "drizzle"],
  55: ["Heavy drizzle", "drizzle"],
  56: ["Light freezing drizzle", "sleet"],
  57: ["Freezing drizzle", "sleet"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Light freezing rain", "sleet"],
  67: ["Freezing rain", "sleet"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Light rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Heavy rain showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with hail", "storm"],
  99: ["Thunderstorm with heavy hail", "storm"]
};

export function describeWeather(code) {
  return WEATHER_CODES[code] || ["Conditions unavailable", "cloud"];
}

export function weatherIcon(code, isDay = true) {
  const [, type] = describeWeather(code);
  const sun = '<circle cx="32" cy="27" r="11" fill="#ffc979"/><g stroke="#ffc979" stroke-width="3" stroke-linecap="round"><path d="M32 8v5M32 41v5M13 27h5M46 27h5M18.5 13.5l3.6 3.6M41.9 37.9l3.6 3.6M45.5 13.5l-3.6 3.6"/></g>';
  const cloud = '<path d="M16 48h31a11 11 0 0 0 0-22h-1a15 15 0 0 0-28-3 13 13 0 0 0-2 25Z" fill="#d9e8f5"/><path d="M16 48h31a11 11 0 0 0 0-22h-1a15 15 0 0 0-28-3 13 13 0 0 0-2 25Z" fill="url(#cloud-shade)"/>';
  const rain = '<path d="M17 39h29a10 10 0 0 0 0-20h-1a14 14 0 0 0-26-3 12 12 0 0 0-2 23Z" fill="#b9d1e5"/><g stroke="#72c9ff" stroke-width="3" stroke-linecap="round"><path d="m23 44-3 7m14-7-3 7m14-7-3 7"/></g>';
  const snow = '<path d="M17 38h29a10 10 0 0 0 0-20h-1a14 14 0 0 0-26-3 12 12 0 0 0-2 23Z" fill="#c6d9e9"/><g fill="#83d1ff"><circle cx="22" cy="48" r="2.5"/><circle cx="33" cy="51" r="2.5"/><circle cx="44" cy="47" r="2.5"/></g>';
  const fog = '<path d="M19 36h27a9 9 0 0 0 0-18h-1a13 13 0 0 0-24-3 11 11 0 0 0-2 21Z" fill="#c7d7e5"/><g stroke="#83c9ef" stroke-width="3" stroke-linecap="round"><path d="M12 43h38M17 50h29"/></g>';
  const storm = '<path d="M16 38h30a10 10 0 0 0 0-20h-1a14 14 0 0 0-26-3 12 12 0 0 0-3 23Z" fill="#bac9dd"/><path d="m33 37-8 12h8l-3 9 13-16h-9l4-5Z" fill="#ffd06f"/>';
  let artwork;
  if (type === "sun") artwork = isDay ? sun : '<circle cx="35" cy="25" r="13" fill="#dce8f5"/><circle cx="41" cy="20" r="12" fill="#19273b"/><g fill="#dce8f5"><circle cx="18" cy="17" r="1.5"/><circle cx="49" cy="40" r="1.5"/></g>';
  else if (type === "partly") artwork = `${sun}<path d="M20 50h26a9 9 0 0 0 0-18h-1a13 13 0 0 0-24-2 11 11 0 0 0-1 20Z" fill="#d9e8f5"/>`;
  else if (type === "rain" || type === "drizzle" || type === "sleet") artwork = rain;
  else if (type === "snow") artwork = snow;
  else if (type === "fog") artwork = fog;
  else if (type === "storm") artwork = storm;
  else artwork = cloud;
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="cloud-shade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#87abc8" stop-opacity=".14"/></linearGradient></defs>${artwork}</svg>`;
}

export function convertTemperature(value, unit) {
  if (!Number.isFinite(value)) return null;
  return unit === "fahrenheit" ? (value * 9 / 5) + 32 : value;
}

export function temperatureLabel(value, settings, includeUnit = true) {
  const converted = convertTemperature(value, settings.temperature);
  if (converted === null) return "—";
  const suffix = settings.temperature === "fahrenheit" ? "°F" : "°C";
  return `${Math.round(converted)}${includeUnit ? suffix : ""}`;
}

export function convertWind(value, unit) {
  if (!Number.isFinite(value)) return null;
  if (unit === "mph") return value * 0.621371;
  if (unit === "ms") return value / 3.6;
  return value;
}

export function windLabel(value, settings) {
  const converted = convertWind(value, settings.wind);
  if (converted === null) return "—";
  const unit = { kmh: "km/h", mph: "mph", ms: "m/s" }[settings.wind];
  return `${Math.round(converted)} ${unit}`;
}

export function precipitationLabel(value, settings) {
  if (!Number.isFinite(value)) return "—";
  if (settings.precipitation === "inch") return `${(value / 25.4).toFixed(2)} in`;
  return `${value.toFixed(1)} mm`;
}

export function formatTime(apiTime, forecast, clock = "24", dateStyle = false) {
  if (typeof apiTime !== "string") return "—";
  const parts = apiTime.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!parts) return "—";
  const [, year, month, day, hour = "0", minute = "0"] = parts;
  const offset = Number.isFinite(forecast?.utc_offset_seconds) ? forecast.utc_offset_seconds : 0;
  const instant = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) - offset * 1000);
  const timeZone = typeof forecast?.timezone === "string" ? forecast.timezone : "UTC";
  try {
    return new Intl.DateTimeFormat("en", dateStyle
      ? { weekday: "long", month: "long", day: "numeric", timeZone }
      : { hour: "numeric", minute: "2-digit", hour12: clock === "12", timeZone }
    ).format(instant);
  } catch {
    return dateStyle ? `${month}/${day}/${year}` : `${hour}:${minute}`;
  }
}

export function formatShortDate(apiDate, timezone = "UTC", options = {}) {
  const [year, month, day] = String(apiDate).split("-").map(Number);
  if (!year || !month || !day) return "—";
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  try {
    return new Intl.DateTimeFormat("en", { ...options, timeZone: timezone }).format(date);
  } catch {
    return `${month}/${day}`;
  }
}

export function windDirection(degrees) {
  if (!Number.isFinite(degrees)) return "—";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}

export function airQualityCategory(value) {
  if (!Number.isFinite(value)) return null;
  if (value <= 20) return ["Good", "Air quality is good. Enjoy your usual outdoor activities."];
  if (value <= 40) return ["Fair", "Air quality is generally acceptable for most people."];
  if (value <= 60) return ["Moderate", "Sensitive people may wish to reduce prolonged outdoor exertion."];
  if (value <= 80) return ["Poor", "Consider reducing prolonged outdoor exertion, especially if sensitive."];
  if (value <= 100) return ["Very poor", "Sensitive groups should consider limiting prolonged outdoor activity."];
  return ["Extremely poor", "Consider avoiding prolonged outdoor exertion and follow local health advice."];
}
