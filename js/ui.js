import {
  airQualityCategory, describeWeather, formatShortDate, formatTime,
  precipitationLabel, temperatureLabel, weatherIcon, windDirection, windLabel
} from "./weather-utils.js";
import { renderLineChart } from "./charts.js";

const byId = (id) => document.getElementById(id);
const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const finite = (value) => Number.isFinite(value);
const at = (collection, key, index) => Array.isArray(collection?.[key]) ? collection[key][index] : undefined;

export function setStatus(message = "", type = "info", retry = null) {
  const node = byId("status-message");
  node.replaceChildren();
  node.hidden = !message;
  node.classList.toggle("is-error", type === "error");
  if (!message) return;
  node.append(document.createTextNode(message));
  if (retry) {
    const button = make("button", "", "Try again");
    button.type = "button";
    button.addEventListener("click", retry, { once: true });
    node.append(button);
  }
}

export function setLoading(isLoading) {
  byId("loading-state").hidden = !isLoading;
  byId("weather-dashboard").hidden = isLoading || !appHasWeather;
  byId("welcome-panel").hidden = isLoading || appHasWeather;
  document.querySelectorAll("#refresh-button, #search-form button").forEach((button) => {
    if (button.id === "refresh-button" || button.classList.contains("search-submit")) {
      button.disabled = isLoading;
    }
  });
}

let appHasWeather = false;
export function setWeatherVisible(visible) {
  appHasWeather = visible;
  byId("weather-dashboard").hidden = !visible;
  byId("welcome-panel").hidden = visible;
}

export function setUpdated(timestamp, forecast, settings) {
  const updated = byId("last-updated");
  if (!timestamp) {
    updated.textContent = "Ready when you are";
    return;
  }
  updated.textContent = `Updated ${new Intl.DateTimeFormat("en", {
    hour: "numeric", minute: "2-digit", hour12: settings.clock === "12"
  }).format(timestamp)}`;
  const localDate = byId("local-date");
  try {
    localDate.textContent = new Intl.DateTimeFormat("en", {
      weekday: "long", month: "long", day: "numeric", hour: "numeric",
      minute: "2-digit", hour12: settings.clock === "12",
      timeZone: forecast.timezone || "UTC"
    }).format(new Date());
  } catch {
    localDate.textContent = forecast.current?.time
      ? formatTime(forecast.current.time, forecast, settings.clock, true)
      : "LOCAL WEATHER";
  }
}

function locationLabel(location) {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

function addDetail(grid, label, value, icon, note = "") {
  if (value === null || value === undefined || value === "") return;
  const card = make("article", "detail-card");
  const top = make("div", "detail-top");
  top.append(make("span", "", label), make("span", "detail-icon", icon));
  card.append(top, make("p", "detail-value", value));
  if (note) card.append(make("p", "detail-note", note));
  grid.append(card);
}

function currentSummary(current, today, settings) {
  const condition = describeWeather(current.weather_code)[0];
  const temp = finite(current.temperature_2m) ? temperatureLabel(current.temperature_2m, settings) : "temperature unavailable";
  const rain = finite(today?.precipitation_probability_max) && today.precipitation_probability_max >= 50;
  const wind = finite(current.wind_speed_10m) && current.wind_speed_10m >= 35;
  const parts = [`${condition} and ${temp}`];
  if (rain) parts.push(`rain is possible today (${Math.round(today.precipitation_probability_max)}% chance)`);
  else if (finite(today?.precipitation_probability_max)) parts.push(`the precipitation chance is below 50% today (${Math.round(today.precipitation_probability_max)}%)`);
  if (wind) parts.push("winds are strong today (35 km/h threshold)");
  return `${parts.join(", ")}.`;
}

export function renderWeather(location, forecast, settings) {
  const current = forecast.current;
  const dailyTimes = forecast.daily?.time || [];
  const dailyIndex = current.time
    ? dailyTimes.findIndex((date) => date === current.time.slice(0, 10))
    : -1;
  const high = at(forecast.daily, "temperature_2m_max", dailyIndex);
  const low = at(forecast.daily, "temperature_2m_min", dailyIndex);
  const sunrise = at(forecast.daily, "sunrise", dailyIndex);
  const sunset = at(forecast.daily, "sunset", dailyIndex);
  const condition = describeWeather(current.weather_code);

  byId("location-name").textContent = location.name || "Selected location";
  byId("location-region").textContent = [location.admin1, location.country].filter(Boolean).join(", ");
  byId("current-temperature").textContent = finite(current.temperature_2m)
    ? Math.round(settings.temperature === "fahrenheit" ? current.temperature_2m * 9 / 5 + 32 : current.temperature_2m)
    : "—";
  byId("hero-temperature-unit").textContent = settings.temperature === "fahrenheit" ? "°F" : "°C";
  byId("current-condition").textContent = condition[0];
  byId("current-icon").innerHTML = weatherIcon(current.weather_code, current.is_day !== 0);
  byId("feels-like").textContent = temperatureLabel(current.apparent_temperature, settings);
  byId("today-high").textContent = temperatureLabel(high, settings);
  byId("today-low").textContent = temperatureLabel(low, settings);
  byId("weather-summary").textContent = currentSummary(current, forecast.daily.time?.[dailyIndex] ? {
    precipitation_probability_max: at(forecast.daily, "precipitation_probability_max", dailyIndex)
  } : null, settings);
  byId("sunrise").textContent = sunrise ? formatTime(sunrise, forecast, settings.clock) : "Unavailable";
  byId("sunset").textContent = sunset ? formatTime(sunset, forecast, settings.clock) : "Unavailable";
  byId("hero-sky").replaceChildren();
  const sky = make("span", current.is_day === 0 ? "sky-moon" : "sky-sun");
  byId("hero-sky").append(sky);
  if (!["Clear sky", "Mostly clear"].includes(condition[0])) byId("hero-sky").append(make("span", "sky-cloud"));

  const grid = byId("details-grid");
  grid.replaceChildren();
  addDetail(grid, "Humidity", finite(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : null, "◌");
  addDetail(grid, "Wind", finite(current.wind_speed_10m) ? windLabel(current.wind_speed_10m, settings) : null, "↗",
    finite(current.wind_direction_10m) ? `${windDirection(current.wind_direction_10m)} direction` : "");
  addDetail(grid, "Wind gusts", finite(current.wind_gusts_10m) ? windLabel(current.wind_gusts_10m, settings) : null, "⌁");
  addDetail(grid, "Pressure", finite(current.pressure_msl) ? `${Math.round(current.pressure_msl)} hPa` : null, "⌑");
  addDetail(grid, "Cloud cover", finite(current.cloud_cover) ? `${Math.round(current.cloud_cover)}%` : null, "☁");
  addDetail(grid, "Visibility", finite(current.visibility) ? `${(current.visibility / 1000).toFixed(1)} km` : null, "◉");
  addDetail(grid, "UV index", finite(current.uv_index) ? `${current.uv_index.toFixed(1)}` : null, "☼",
    finite(current.uv_index) ? (current.uv_index >= 6 ? "Elevated" : current.uv_index >= 3 ? "Moderate" : "Low") : "");
  const precipitation = finite(current.precipitation) ? precipitationLabel(current.precipitation, settings) : null;
  const probability = at(forecast.hourly, "precipitation_probability", getCurrentHourIndex(forecast));
  addDetail(grid, "Precipitation", precipitation, "↓", finite(probability) ? `${Math.round(probability)}% chance this hour` : "");
  addDetail(grid, "Dew point", finite(current.dew_point_2m) ? temperatureLabel(current.dew_point_2m, settings) : null, "≈");
  addDetail(grid, "Surface pressure", finite(current.surface_pressure) ? `${Math.round(current.surface_pressure)} hPa` : null, "⌑");

  renderHourly(forecast, settings);
  renderDaily(forecast, settings, current.time?.slice(0, 10));
  renderCharts(forecast, settings);
  renderInsights(current, forecast, settings, dailyIndex);
  byId("favorite-button").setAttribute("aria-label", `Save ${locationLabel(location)}`);
  setWeatherVisible(true);
}

function getCurrentHourIndex(forecast) {
  const currentTime = forecast.current?.time;
  const times = forecast.hourly?.time || [];
  if (typeof currentTime !== "string") return -1;
  const exact = times.indexOf(currentTime);
  if (exact >= 0) return exact;
  const currentHour = currentTime?.slice(0, 13);
  return times.findIndex((time) => typeof time === "string" && time.slice(0, 13) === currentHour);
}

function renderHourly(forecast, settings) {
  const container = byId("hourly-forecast");
  container.replaceChildren();
  const start = getCurrentHourIndex(forecast);
  const times = forecast.hourly.time || [];
  if (start < 0) {
    container.append(make("p", "empty-note", "Hourly timing is unavailable right now."));
    return;
  }
  const end = Math.min(start + 24, times.length);
  for (let index = start; index < end; index += 1) {
    const temperature = at(forecast.hourly, "temperature_2m", index);
    const code = at(forecast.hourly, "weather_code", index);
    const probability = at(forecast.hourly, "precipitation_probability", index);
    const card = make("article", `hour-card${index === start ? " is-current" : ""}`);
    const timeLabel = index === start ? "Now" : formatTime(times[index], forecast, settings.clock);
    card.setAttribute("aria-label", `${timeLabel}: ${describeWeather(code)[0]}, ${temperatureLabel(temperature, settings)}, precipitation chance ${finite(probability) ? `${Math.round(probability)} percent` : "unavailable"}`);
    card.append(make("span", "hour-time", timeLabel));
    const icon = make("span", "weather-icon");
    icon.innerHTML = weatherIcon(code, at(forecast.hourly, "is_day", index) !== 0);
    card.append(icon, make("span", "hour-temp", temperatureLabel(temperature, settings)));
    card.append(make("span", "hour-rain", finite(probability) ? `${Math.round(probability)}%` : "—"));
    container.append(card);
  }
  if (!container.childElementCount) container.append(make("p", "empty-note", "Hourly forecast is not available right now."));
}

function renderDaily(forecast, settings, currentDate) {
  const panel = byId("weekly-forecast");
  panel.replaceChildren();
  const times = forecast.daily.time || [];
  if (!times.length) {
    panel.append(make("p", "empty-note", "Daily forecast is not available right now."));
    return;
  }
  const allHighs = forecast.daily.temperature_2m_max || [];
  const allLows = forecast.daily.temperature_2m_min || [];
  const validRange = [...allHighs, ...allLows].filter(finite);
  const min = validRange.length ? Math.min(...validRange) : 0;
  const max = validRange.length ? Math.max(...validRange) : 1;
  const span = max - min || 1;
  times.slice(0, 7).forEach((date, index) => {
    const isToday = date === currentDate;
    const day = isToday ? "Today" : formatShortDate(date, forecast.timezone, { weekday: "short" });
    const row = make("div", `day-row${isToday ? " is-today" : ""}`);
    const dateNode = make("span", "day-name");
    dateNode.append(document.createTextNode(day), make("span", "day-date", formatShortDate(date, forecast.timezone, { month: "short", day: "numeric" })));
    row.append(dateNode);
    const condition = make("span", "day-condition");
    const icon = make("span", "weather-icon");
    const code = at(forecast.daily, "weather_code", index);
    icon.innerHTML = weatherIcon(code, true);
    condition.append(icon, make("span", "", describeWeather(code)[0]));
    row.append(condition);
    const high = at(forecast.daily, "temperature_2m_max", index);
    const low = at(forecast.daily, "temperature_2m_min", index);
    const temperatures = make("span", "day-temperatures");
    temperatures.append(make("span", "high", temperatureLabel(high, settings)), make("span", "low", temperatureLabel(low, settings)));
    row.append(temperatures);
    const track = make("span", "day-range-track");
    if (finite(high) && finite(low)) {
      const start = ((low - min) / span) * 100;
      const end = ((high - min) / span) * 100;
      track.style.background = `linear-gradient(90deg, #76c6f4 ${start}%, #f3b779 ${Math.max(start, end)}%, var(--border) ${Math.max(start, end)}%)`;
    } else track.hidden = true;
    row.append(track);
    const chance = at(forecast.daily, "precipitation_probability_max", index);
    const amount = at(forecast.daily, "precipitation_sum", index);
    const rainText = finite(chance) ? `↓ ${Math.round(chance)}%` : "—";
    const rain = make("span", "day-rain", rainText);
    if (finite(amount)) rain.title = `${precipitationLabel(amount, settings)} total precipitation`;
    row.append(rain);
    panel.append(row);
  });
}

function renderCharts(forecast, settings) {
  const start = getCurrentHourIndex(forecast);
  const hasStart = start >= 0;
  const end = hasStart ? Math.min(start + 24, forecast.hourly.time.length) : 0;
  const values = hasStart ? forecast.hourly.time.slice(start, end) : [];
  const label = values.map((time) => formatTime(time, forecast, settings.clock));
  const temperature = (forecast.hourly.temperature_2m || []).slice(hasStart ? start : 0, end).map((value) =>
    finite(value) ? (settings.temperature === "fahrenheit" ? value * 9 / 5 + 32 : value) : null
  );
  const chance = hasStart ? (forecast.hourly.precipitation_probability || []).slice(start, end) : [];
  const suffix = settings.temperature === "fahrenheit" ? "°F" : "°C";
  byId("temperature-chart-unit").textContent = suffix;
  renderLineChart(byId("temperature-chart"), temperature, label, {
    id: "temperature",
    ariaLabel: `Temperature forecast for the next ${values.length} hours`,
    formatValue: (value) => `${Math.round(value)}${suffix}`
  });
  renderLineChart(byId("precipitation-chart"), chance, label, {
    id: "precipitation",
    ariaLabel: `Hourly precipitation probability for the next ${values.length} hours`,
    formatValue: (value) => `${Math.round(value)}%`
  });
}

function renderInsights(current, forecast, settings, todayIndex) {
  const list = byId("weather-insights");
  list.replaceChildren();
  const chance = at(forecast.daily, "precipitation_probability_max", todayIndex);
  const uv = finite(current.uv_index) ? current.uv_index : at(forecast.daily, "uv_index_max", todayIndex);
  const wind = current.wind_speed_10m;
  const suggestions = [];
  if (finite(chance)) {
    if (chance >= 50) suggestions.push(["☂", "Rain is possible", `${Math.round(chance)}% chance of precipitation today (50% threshold). An umbrella may come in handy.`]);
    else suggestions.push(["☀", "Lower rain chance", `${Math.round(chance)}% chance of precipitation today, below the 50% threshold.`]);
  }
  if (finite(uv)) {
    if (uv >= 6) suggestions.push(["☼", "UV is elevated", `The UV index is ${uv.toFixed(1)}. Consider sun protection if you're spending time outside.`]);
    else if (uv >= 3) suggestions.push(["☼", "Moderate UV levels", `The UV index is ${uv.toFixed(1)}. Consider protection if you're outside for a while.`]);
    else suggestions.push(["☼", "Low UV levels", `The UV index is ${uv.toFixed(1)} right now.`]);
  }
  if (finite(wind)) {
    if (wind >= 35) suggestions.push(["↗", "Strong winds", `Wind is ${windLabel(wind, settings)} (35 km/h threshold). Secure loose items outdoors.`]);
    else suggestions.push(["↗", "Lighter winds", `Wind is ${windLabel(wind, settings)}, below the 35 km/h strong-wind threshold.`]);
  }
  if (!suggestions.length) suggestions.push(["i", "Insights unavailable", "There isn't enough forecast information to create an insight right now."]);
  for (const [symbol, title, description] of suggestions) {
    const item = make("div", "insight");
    item.append(make("span", "insight-symbol", symbol));
    const copy = make("p");
    copy.append(make("strong", "", title), document.createTextNode(description));
    item.append(copy);
    list.append(item);
  }
}

export function renderAirQuality(data) {
  const panel = byId("air-quality");
  panel.replaceChildren();
  const current = data?.current;
  const aqi = current?.european_aqi;
  const category = airQualityCategory(aqi);
  if (!current || !finite(aqi)) {
    panel.append(make("p", "air-unavailable", "European Air Quality Index data is not available for this location right now. Weather forecasts are still available."));
    const pollutants = pollutantDetails(current);
    if (pollutants.length) panel.append(createPollutants(pollutants));
    return;
  }
  const main = make("div", "air-main");
  main.append(make("span", "aqi-badge", String(Math.round(aqi))));
  const description = make("div");
  description.append(make("span", "aqi-label", "EUROPEAN AQI"), make("p", "aqi-category", category[0]), make("p", "aqi-guidance", category[1]));
  main.append(description);
  panel.append(main);
  const pollutants = pollutantDetails(current);
  if (pollutants.length) panel.append(createPollutants(pollutants));
  panel.append(make("p", "scale-note", "European AQI scale (0–20 good, 20–40 fair, 40–60 moderate, 60–80 poor, 80–100 very poor, above 100 extremely poor). Pollutant concentrations in μg/m³."));
}

function pollutantDetails(current) {
  if (!current) return [];
  return [
    ["PM2.5", current.pm2_5], ["PM10", current.pm10],
    ["NO₂", current.nitrogen_dioxide], ["O₃", current.ozone]
  ].filter(([, value]) => finite(value));
}

function createPollutants(pollutants) {
  const container = make("div", "pollutants");
  for (const [name, value] of pollutants) {
    const item = make("span", "pollutant", name);
    item.append(make("strong", "", Number(value).toFixed(1)));
    container.append(item);
  }
  return container;
}

export function renderSearchResults(results, message = "") {
  const box = byId("search-results");
  box.replaceChildren();
  if (message) {
    box.append(make("div", "search-result-message", message));
  } else {
    for (const result of results) {
      const button = make("button", "search-result");
      button.type = "button";
      button.setAttribute("role", "option");
      button.dataset.latitude = String(result.latitude);
      button.dataset.longitude = String(result.longitude);
      button.append(make("span", "result-pin", "⌖"));
      const text = make("span");
      text.append(make("span", "result-name", result.name), make("span", "result-region", [result.admin1, result.country].filter(Boolean).join(", ")));
      button.append(text);
      box.append(button);
    }
  }
  box.hidden = !results.length && !message;
  byId("location-search").setAttribute("aria-expanded", String(!box.hidden));
}

function chipText(location) {
  return [location.name, location.admin1, location.countryCode || location.country]
    .filter(Boolean)
    .join(", ");
}

export function renderLocations(favorites, recents, selected, onRemoveFavorite) {
  const favoritesNode = byId("saved-locations");
  favoritesNode.replaceChildren();
  if (!favorites.length) favoritesNode.append(make("p", "empty-note", "Save a place to find it here."));
  for (const place of favorites) {
    favoritesNode.append(createLocationChip(place, selected, true, onRemoveFavorite));
  }
  const recentNode = byId("recent-locations");
  recentNode.replaceChildren();
  if (!recents.length) recentNode.append(make("p", "empty-note", "Places you visit will show up here."));
  for (const place of recents) recentNode.append(createLocationChip(place, selected, false));
  byId("clear-recents").hidden = recents.length === 0;
}

function createLocationChip(location, selected, removable, onRemove) {
  const wrapper = make("span", "location-entry");
  const button = make("button", "location-chip", chipText(location));
  button.type = "button";
  button.dataset.latitude = String(location.latitude);
  button.dataset.longitude = String(location.longitude);
  button.title = locationLabel(location);
  if (selected && location.id === selected.id) button.setAttribute("aria-current", "true");
  wrapper.append(button);
  if (removable) {
    const remove = make("button", "remove-location", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${locationLabel(location)} from saved locations`);
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      onRemove(location);
    });
    wrapper.append(remove);
  }
  return wrapper;
}

export function updateFavoriteButton(isFavorite, locationName) {
  const button = byId("favorite-button");
  button.setAttribute("aria-pressed", String(isFavorite));
  button.querySelector("span:first-child").textContent = isFavorite ? "★" : "☆";
  button.querySelector(".favorite-label").textContent = isFavorite ? "Saved" : "Save place";
  button.setAttribute("aria-label", `${isFavorite ? "Remove" : "Save"} ${locationName} ${isFavorite ? "from" : "to"} saved locations`);
}

export function setSettingsControls(settings) {
  byId("temperature-setting").value = settings.temperature;
  byId("wind-setting").value = settings.wind;
  byId("precipitation-setting").value = settings.precipitation;
  byId("clock-setting").value = settings.clock;
  byId("theme-setting").value = settings.theme;
}
