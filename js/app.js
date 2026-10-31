import { getAirQuality, getWeather, searchLocations } from "./api.js";
import { getCurrentCoordinates } from "./geolocation.js";
import { loadPreferences, savePreferences } from "./storage.js";
import {
  renderAirQuality, renderLocations, renderSearchResults as drawSearchResults,
  renderWeather, setLoading, setSettingsControls, setStatus, setUpdated,
  setWeatherVisible, updateFavoriteButton
} from "./ui.js";

const makeId = (place) => `${Number(place.latitude).toFixed(5)},${Number(place.longitude).toFixed(5)}`;
const normalizePlace = (place) => ({ ...place, id: place.id || makeId(place) });
const state = {
  preferences: loadPreferences(),
  selected: null,
  forecast: null,
  airQuality: null,
  fetchedAt: null,
  cache: new Map(),
  searchController: null,
  searchTimer: null,
  loadId: 0
};
state.preferences.favorites = state.preferences.favorites.map(normalizePlace);
state.preferences.recents = state.preferences.recents.map(normalizePlace);
const CACHE_TTL = 10 * 60 * 1000;
const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);
const displayName = (place) => [place.name, place.admin1, place.country].filter(Boolean).join(", ");

function renderSearchResults(results, message = "") {
  state.lastResults = results;
  drawSearchResults(results, message);
}

function persist() {
  const saved = savePreferences(state.preferences);
  if (!saved) setStatus("Your browser couldn't save these preferences. Check storage settings or free up space.", "error");
}

function applyTheme() {
  const preference = state.preferences.settings.theme;
  const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.dataset.theme = preference === "system" ? (systemPrefersLight ? "light" : "dark") : preference;
  $("#theme-button").setAttribute("aria-label", `Color theme: ${preference}. Open settings to change it.`);
}

function renderPersonalization() {
  renderLocations(
    state.preferences.favorites,
    state.preferences.recents,
    state.selected,
    removeFavorite
  );
  const saved = state.selected && state.preferences.favorites.some((place) => place.id === state.selected.id);
  if (state.selected) updateFavoriteButton(Boolean(saved), displayName(state.selected));
}

function addRecent(place) {
  if (place.isCurrentLocation) return;
  state.preferences.recents = [
    place,
    ...state.preferences.recents.filter((item) => item.id !== place.id)
  ].slice(0, 5);
  persist();
}

function addFavorite(place) {
  if (state.preferences.favorites.some((item) => item.id === place.id)) return;
  state.preferences.favorites = [...state.preferences.favorites, place].slice(0, 12);
  persist();
}

function removeFavorite(place) {
  state.preferences.favorites = state.preferences.favorites.filter((item) => item.id !== place.id);
  persist();
  renderPersonalization();
}

async function loadLocation(place, { refresh = false, addToHistory = false } = {}) {
  const requestId = ++state.loadId;
  const target = normalizePlace(place);
  state.selected = target;
  if (addToHistory) addRecent(state.selected);
  $("#location-search").value = "";
  $("#clear-search").hidden = true;
  renderSearchResults([]);
  renderPersonalization();
  setStatus("");

  const cacheKey = state.selected.id;
  const cached = state.cache.get(cacheKey);
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL;
  setLoading(true);
  try {
    if (!refresh && isFresh) {
      state.forecast = cached.forecast;
      state.fetchedAt = cached.fetchedAt;
      renderWeather(state.selected, state.forecast, state.preferences.settings);
      setUpdated(state.fetchedAt, state.forecast, state.preferences.settings);
      if (cached.airQuality) {
        state.airQuality = cached.airQuality;
        renderAirQuality(cached.airQuality);
      } else {
        try {
          state.airQuality = await getAirQuality(target.latitude, target.longitude);
          if (requestId !== state.loadId) return;
          cached.airQuality = state.airQuality;
          renderAirQuality(state.airQuality);
        } catch {
          if (requestId !== state.loadId) return;
          state.airQuality = null;
          renderAirQuality(null);
          setStatus("Weather is available, but air-quality data couldn't be loaded. You can retry to check again.", "info", () => loadLocation(target, { refresh: true }));
        }
      }
      setLoading(false);
      return;
    }

    const [weatherResult, airResult] = await Promise.allSettled([
      getWeather(state.selected.latitude, state.selected.longitude),
      getAirQuality(state.selected.latitude, state.selected.longitude)
    ]);
    if (requestId !== state.loadId) return;
    if (weatherResult.status === "rejected") throw weatherResult.reason;

    state.forecast = weatherResult.value;
    state.fetchedAt = new Date();
    state.airQuality = airResult.status === "fulfilled" ? airResult.value : null;
    state.cache.set(cacheKey, {
      forecast: state.forecast,
      airQuality: state.airQuality,
      fetchedAt: state.fetchedAt
    });
    renderWeather(state.selected, state.forecast, state.preferences.settings);
    setUpdated(state.fetchedAt, state.forecast, state.preferences.settings);
    renderAirQuality(state.airQuality);

    if (airResult.status === "rejected") {
      setStatus("Weather is available, but air-quality data couldn't be loaded. You can retry to check again.", "info", () => loadLocation(target, { refresh: true }));
    }
  } catch (error) {
    if (requestId !== state.loadId) return;
    setStatus(error instanceof Error ? error.message : "Weather data couldn't be loaded. Please try again.", "error", () => loadLocation(target, { refresh: true }));
    const previous = state.cache.get(cacheKey);
    if (previous?.forecast) {
      state.forecast = previous.forecast;
      state.fetchedAt = previous.fetchedAt;
      state.airQuality = previous.airQuality;
      renderWeather(target, previous.forecast, state.preferences.settings);
      setUpdated(previous.fetchedAt, previous.forecast, state.preferences.settings);
      renderAirQuality(previous.airQuality);
      setStatus("Showing previously loaded weather because the latest update failed. " + (error instanceof Error ? error.message : ""), "error", () => loadLocation(target, { refresh: true }));
    } else {
      state.forecast = null;
      state.airQuality = null;
      setWeatherVisible(false);
      renderAirQuality(null);
    }
  } finally {
    if (requestId === state.loadId) {
      setLoading(false);
      renderPersonalization();
    }
  }
}

async function runSearch(query) {
  state.searchController?.abort();
  const value = query.trim();
  if (value.length < 2) {
    renderSearchResults([], value ? "Type at least two characters to search." : "");
    return;
  }
  state.searchController = new AbortController();
  const { signal } = state.searchController;
  renderSearchResults([], "Searching places…");
  try {
    const results = await searchLocations(value, signal);
    if (signal.aborted) return;
    if (!results.length) {
      renderSearchResults([], "No places found. Try another spelling or nearby city.");
      return;
    }
    renderSearchResults(results);
  } catch (error) {
    if (error.name === "AbortError") return;
    renderSearchResults([], error instanceof Error ? error.message : "Location search failed. Please try again.");
  }
}

function debounceSearch(query) {
  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(() => runSearch(query), 350);
}

function chooseCurrentLocation() {
  setStatus("Requesting your location only for this weather lookup…");
  getCurrentCoordinates()
    .then(({ latitude, longitude }) => loadLocation({
      id: `${latitude.toFixed(5)},${longitude.toFixed(5)}`,
      name: "Current location",
      admin1: "",
      country: "",
      latitude,
      longitude,
      timezone: "auto",
      isCurrentLocation: true
    }))
    .catch((error) => setStatus(error.message, "error"));
}

function toggleFavorite() {
  if (!state.selected) return;
  const isFavorite = state.preferences.favorites.some((place) => place.id === state.selected.id);
  if (isFavorite) {
    removeFavorite(state.selected);
  } else {
    addFavorite(state.selected);
  }
  renderPersonalization();
}

function applySettings() {
  const settings = state.preferences.settings;
  setSettingsControls(settings);
  applyTheme();
  if (state.selected && state.forecast) {
    renderWeather(state.selected, state.forecast, settings);
    setUpdated(state.fetchedAt, state.forecast, settings);
    renderAirQuality(state.airQuality);
    renderPersonalization();
  }
}

$("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  window.clearTimeout(state.searchTimer);
  runSearch($("#location-search").value);
});

$("#location-search").addEventListener("input", (event) => {
  const query = event.currentTarget.value;
  $("#clear-search").hidden = !query;
  debounceSearch(query);
});

$("#location-search").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    state.searchController?.abort();
    renderSearchResults([]);
  }
});

$("#clear-search").addEventListener("click", () => {
  state.searchController?.abort();
  $("#location-search").value = "";
  $("#clear-search").hidden = true;
  renderSearchResults([]);
  $("#location-search").focus();
});

$("#search-results").addEventListener("click", (event) => {
  const button = event.target.closest("button.search-result");
  if (!button) return;
  const place = state.lastResults?.find((item) =>
    item.latitude === Number(button.dataset.latitude) && item.longitude === Number(button.dataset.longitude)
  );
  if (place) loadLocation(place, { addToHistory: true });
});

$("#search-results").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    state.lastResults = [];
    $("#location-search").focus();
  }
});

$("#locate-button").addEventListener("click", chooseCurrentLocation);
$("#welcome-locate").addEventListener("click", chooseCurrentLocation);
$("#favorite-button").addEventListener("click", toggleFavorite);
$("#refresh-button").addEventListener("click", () => {
  if (state.selected) loadLocation(state.selected, { refresh: true });
});
$("#saved-locations").addEventListener("click", (event) => activateLocationChip(event, state.preferences.favorites));
$("#recent-locations").addEventListener("click", (event) => activateLocationChip(event, state.preferences.recents));

function activateLocationChip(event, locations) {
  const button = event.target.closest("button.location-chip");
  if (!button) return;
  const place = locations.find((item) =>
    item.latitude === Number(button.dataset.latitude) && item.longitude === Number(button.dataset.longitude)
  );
  if (place) loadLocation(place, { addToHistory: true });
}

$("#clear-recents").addEventListener("click", () => {
  state.preferences.recents = [];
  persist();
  renderPersonalization();
});

$("#settings-button").addEventListener("click", () => $("#settings-dialog").showModal());
$("#settings-form").addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const { name, value } = event.target;
  const key = { temperature: "temperature", wind: "wind", precipitation: "precipitation", clock: "clock", theme: "theme" }[name];
  if (!key) return;
  state.preferences.settings[key] = value;
  persist();
  applySettings();
});
$("#theme-button").addEventListener("click", () => {
  const currentTheme = root.dataset.theme;
  state.preferences.settings.theme = currentTheme === "light" ? "dark" : "light";
  persist();
  applyTheme();
  setSettingsControls(state.preferences.settings);
});
$("#settings-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (state.preferences.settings.theme === "system") applyTheme();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search")) renderSearchResults([]);
});

applySettings();
renderPersonalization();
window.setInterval(() => {
  if (state.forecast && state.fetchedAt) {
    setUpdated(state.fetchedAt, state.forecast, state.preferences.settings);
  }
}, 60_000);
