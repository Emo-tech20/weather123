const STORAGE_KEY = "emo-weather-preferences";

const DEFAULTS = {
  settings: {
    temperature: "celsius",
    wind: "kmh",
    precipitation: "mm",
    clock: "24",
    theme: "system"
  },
  favorites: [],
  recents: []
};

function cloneDefaults() {
  return {
    settings: { ...DEFAULTS.settings },
    favorites: [],
    recents: []
  };
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      throw new Error("Stored preferences have an invalid format.");
    }
    const settings = { ...DEFAULTS.settings };
    for (const [key, allowed] of Object.entries({
      temperature: ["celsius", "fahrenheit"],
      wind: ["kmh", "mph", "ms"],
      precipitation: ["mm", "inch"],
      clock: ["12", "24"],
      theme: ["system", "light", "dark"]
    })) {
      if (allowed.includes(stored.settings?.[key])) settings[key] = stored.settings[key];
    }
    const validPlace = (place) => place && typeof place.name === "string" &&
      Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
    return {
      settings,
      favorites: Array.isArray(stored.favorites) ? stored.favorites.filter(validPlace).slice(0, 12) : [],
      recents: Array.isArray(stored.recents) ? stored.recents.filter(validPlace).slice(0, 5) : []
    };
  } catch (error) {
    console.warn("Emo Weather preferences could not be loaded:", error);
    return cloneDefaults();
  }
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error("Emo Weather preferences could not be saved:", error);
    return false;
  }
}
