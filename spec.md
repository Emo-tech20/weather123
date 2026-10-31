Emo Weather --- Product Specification
Project name: Emo Weather
Product type: Responsive weather web application
Core stack: HTML5, CSS3, Vanilla JavaScript
Suggested API: Open-Meteo (current conditions, forecasts, geocoding,
air quality and weather data); no API key is required for its public
forecast endpoints.
Storage: localStorage for user preferences, saved locations and
recent searches.
1. Project Overview
Emo Weather is a modern, attractive, fast and responsive weather
application that helps users understand current weather conditions and
plan ahead. It should work on desktop, tablet and mobile browsers.

The app must use real weather data from a weather API. It must never
display fabricated or hard-coded weather information as if it were live.
When data cannot be loaded, show a clear error or unavailable state.
2. Product Goals
- Show accurate current weather for a searched or detected location.
- Provide hourly and 7-day forecasts.
- Make important weather information easy to understand at a glance.
- Allow users to save and quickly switch between favourite locations.
- Provide useful alerts and environmental information where supported
  by the data provider.
- Deliver a polished, accessible experience on small and large
  screens.
3. Technology and Architecture
Frontend
- Semantic HTML5.
- Modern CSS3 with CSS variables, Flexbox and Grid.
- Vanilla JavaScript using ES modules where practical.
- Fetch API with async/`await`.
- No frontend framework unless explicitly approved later.
Weather and location data
Use Open-Meteo services: - Geocoding API to search for cities and
places. - Forecast API for current, hourly and daily weather. - Air
Quality API for AQI and pollutant information. - Use browser Geolocation
API only after the user grants permission. - Use a suitable timezone
returned by the API for displaying local forecast times.

Keep API requests in a dedicated service module so the provider can be
changed later. Check the provider's current terms, attribution
requirements and usage limits before public/commercial launch.
Suggested project structure
emo-weather/
├── index.html
├── README.md
├── spec.md
├── assets/
│   ├── icons/
│   └── images/
├── css/
│   ├── styles.css
│   └── responsive.css
└── js/
    ├── app.js
    ├── api.js
    ├── geolocation.js
    ├── storage.js
    ├── ui.js
    ├── weather-utils.js
    └── charts.js
Keep the project simple. Do not add a backend or database for the
initial version.
4. Main Features
4.1 Dashboard
- Display selected location name, region/country when available, and
  local date/time.
- Prominent current temperature.
- Weather condition description and matching weather icon.
- "Feels like" temperature.
- Today's high and low.
- Sunrise and sunset.
- A short, data-driven weather summary.
- Refresh control and visible last-updated time.
- Loading skeleton while data is being fetched.
4.2 Location Search
- Search by city, town or place name.
- Show matching results with region/country to distinguish similar
  names.
- Select a result to load its weather.
- Support Enter key and an accessible clear-search control.
- Show helpful empty, loading and error states.
- Prevent unnecessary duplicate API requests while the user types
  (debounce search).
4.3 Current Location
- "Use my location" button.
- Ask for browser location permission only after the user selects the
  feature.
- If permission is denied or unavailable, explain the issue and keep
  manual search available.
- Do not continuously track the user.
- Do not store precise coordinates unless necessary for a
  user-selected saved location.
4.4 Current Weather Details
Show available values for: - Temperature. - Feels-like temperature. -
Weather condition. - Relative humidity. - Wind speed and direction. -
Wind gusts. - Atmospheric pressure. - Cloud cover. - Visibility, when
available. - UV index. - Precipitation amount/probability. - Dew point,
when available.

Do not show empty, misleading or invented values when a field is
unavailable.
4.5 Hourly Forecast
- Display the next 24 hours.
- Show hour, weather icon, temperature and precipitation probability.
- Make the current hour easy to identify.
- Use a horizontally scrollable layout on narrow screens.
- Include accessible text labels; do not communicate weather using
  colour alone.
4.6 7-Day Forecast
For each day show: - Day and date. - Weather icon and condition. - High
and low temperatures. - Precipitation probability. - Optional
precipitation total where supported. - Highlight today. - Use the API's
daily timezone and units consistently.
4.7 Weather Charts
- Temperature trend chart for the next 24 hours.
- Precipitation probability chart.
- Optional wind trend chart.
- Use accessible chart labels and a text/data alternative.
- Charts must resize on mobile.
- Use a lightweight chart library only if necessary; otherwise build
  simple charts with HTML/CSS/SVG.
4.8 Saved Locations
- Add and remove favourite locations.
- Switch between saved locations without searching again.
- Persist favourites in localStorage.
- Prevent duplicate saved locations.
- Clearly identify the currently selected location.
4.9 Recent Searches
- Keep a small history of recently selected places.
- Allow users to clear search history.
- Store only the place information needed to repeat a search.
- Persist in localStorage.
4.10 Air Quality
Where supported, show: - AQI value and category. - PM2.5 and PM10. -
Nitrogen dioxide, ozone and other available pollutants. - Plain-language
guidance based on the provider's documented AQI scale. - A clear
explanation of the scale used; do not mix different AQI systems without
labelling them.
4.11 Weather Alerts and Severe Conditions
- Display official alerts only when a reliable alert source is
  integrated and the alert applies to the selected location.
- Show alert title, issuing authority, affected area, validity period
  and official instructions/link when available.
- Do not invent alerts or imply that an alert feed is comprehensive if
  it is not.
- If no official alert provider is configured, label the section as
  unavailable or omit it. Do not generate fake alerts from ordinary
  forecast values.
4.12 Weather Insights
Generate short summaries from actual API values, such as: - Whether the
day is warmer or cooler than yesterday, if comparison data is
available. - Whether rain is likely during the selected period. -
Whether UV levels are elevated. - Whether wind conditions are strong. -
Practical suggestions such as carrying an umbrella, based on transparent
thresholds.

These are informational suggestions, not official warnings. Avoid
exaggerated or alarmist wording.
4.13 Settings
- Celsius/Fahrenheit.
- Kilometres per hour, miles per hour or metres per second for wind.
- Millimetres or inches for precipitation.
- 12-hour or 24-hour clock.
- Light, dark and system theme.
- Persist settings in localStorage.
- Apply settings consistently to all displayed values and charts.
4.14 Theme and Visual Design
Create a premium, modern weather interface branded Emo Weather.

Design direction: - Clean, contemporary and visually rich. - Deep
navy/charcoal dark theme with a bright sky-blue accent; include a
polished light theme. - Soft gradients and subtle glass-like surfaces,
used carefully for readability. - Large, clear temperature typography. -
Weather icons that match the actual condition. - Rounded cards,
consistent spacing and subtle transitions. - Avoid excessive glow,
clutter and unnecessary animation. - Use CSS variables for colours,
spacing, typography, radii and shadows. - Create a simple Emo Weather
wordmark/logo using text or original CSS/SVG artwork.

Do not copy another weather app's exact interface or branding.
5. Responsive Design
Desktop
- Spacious dashboard with a clear main weather panel.
- Current conditions and detail cards arranged in a balanced grid.
- Forecast sections easy to scan.
Tablet
- Adapt card columns and chart widths.
- Keep search and key weather information prominent.
Mobile
- Mobile-first layout.
- No horizontal page overflow.
- Search and location controls easy to tap.
- Forecast row may scroll horizontally inside its own section.
- Use touch targets of approximately 44 × 44 CSS pixels where
  practical.
- Keep text readable and avoid overly dense cards.
6. Accessibility
- Use semantic HTML landmarks and headings.
- Ensure keyboard navigation for every interactive control.
- Provide visible focus indicators.
- Add accessible names to icon-only buttons.
- Use sufficient text/background contrast.
- Provide meaningful alternative text where needed.
- Respect prefers-reduced-motion.
- Do not rely on colour alone to communicate status.
- Announce important loading/error updates politely with appropriate
  live regions.
7. Data Handling and Reliability
- Separate API, storage, formatting and UI logic.
- Validate API responses before rendering.
- Handle network errors, rate limits, invalid locations and malformed
  responses.
- Show loading, empty, offline and error states.
- Avoid repeated calls when the same location/data is already fresh.
- Use a modest cache in memory and/or localStorage, with a visible
  timestamp.
- Do not present stale cached data as live; label it clearly.
- Use safe DOM methods such as textContent for user/API-provided
  text.
- Never place secrets or private credentials in frontend code.
- Do not silently replace failed live data with demo values.
8. Suggested User Experience
1. On first visit, show a welcoming dashboard with a city search and a
   "Use my location" option.
2. Do not request location permission automatically.
3. After a location is selected, load current conditions, hourly
   forecast, daily forecast and supported air-quality data.
4. Save the selected location as the current location; let the user
   favourite it.
5. Let the user change units, clock format and theme in settings.
6. Remember preferences and favourites on the next visit.
9. Error and Empty States
Provide clear messages for: - No search results. - Location permission
denied. - Location unavailable. - Network/API unavailable. - API rate
limit reached. - Weather data temporarily unavailable. - Air-quality
data unavailable. - Official alerts not supported or unavailable.

Every error state should explain what happened in plain language and
provide a useful next action, such as retrying or searching manually.
10. Performance
- Keep JavaScript modular and avoid unnecessary dependencies.
- Debounce location search.
- Avoid fetching every section repeatedly when changing UI settings.
- Lazy-load nonessential assets.
- Use SVG icons where possible.
- Minimise layout shifts and large image assets.
- Ensure the dashboard remains usable on slower mobile connections.
11. Security and Privacy
- Request geolocation only following an explicit user action.
- Explain why location access is needed.
- Do not collect personal information or create accounts in version 1.
- Do not expose secrets in source code.
- Treat API responses and search input as untrusted data.
- Avoid unsafe HTML injection.
- Keep saved preferences and favourites local to the browser.
12. Testing and Acceptance Criteria
The project is complete when:
- [ ] The app loads without console errors.
- [ ] A user can search for and select a valid location.
- [ ] Current conditions come from the live API.
- [ ] Hourly forecast displays the next 24 hours.
- [ ] 7-day forecast displays the available daily data.
- [ ] Weather details display valid values and units.
- [ ] Celsius/Fahrenheit conversion works correctly.
- [ ] Wind and precipitation unit settings work correctly.
- [ ] 12/24-hour clock setting works.
- [ ] Light, dark and system themes work.
- [ ] Favourite locations can be added, removed and reopened.
- [ ] Recent searches persist and can be cleared.
- [ ] Geolocation is requested only after user action.
- [ ] Denied location permission does not break manual search.
- [ ] API/network failures show useful messages.
- [ ] Missing API fields are handled without fake values.
- [ ] Layout works at mobile, tablet and desktop widths.
- [ ] Keyboard navigation and visible focus states work.
- [ ] No secrets or credentials are committed.
- [ ] README explains setup, API endpoints used and deployment.
13. Deployment
Prepare the app for static hosting on Vercel or GitHub Pages: - No
backend is required for the initial version. - Include a suitable
vercel.json only if the project needs custom routing or headers. -
Ensure asset paths are relative and work from the deployed site root. -
Test the production build/site, not only the local preview. - Document
deployment steps in README.md.
14. Development Phases
Phase 1 --- Foundation: Project structure, responsive layout, theme,
location search and live current weather.

Phase 2 --- Forecasts: Hourly forecast, 7-day forecast, weather
details and charts.

Phase 3 --- Personalisation: Saved locations, recent searches, unit
settings, clock format and themes.

Phase 4 --- Environmental data: Air quality and supported official
weather alerts.

Phase 5 --- Quality: Accessibility, error handling, performance,
testing, README and deployment.

Build each phase cleanly and test it before moving to the next. Do not
leave nonfunctional buttons or placeholder sections presented as
completed features.