# Map Architecture — EchoHeritage

This document explains how the **map view** is built, what libraries are used,
how geofencing works, and the upgrade path from the hackathon prototype to a
full production app.

---

## 1. What the map does

EchoHeritage's map is the "arrival trigger" of the product:

1. Show all historical monuments as pins on a map.
2. Show the user's current (or simulated) location.
3. When the user enters a **500 m geofence** around a monument, light up a
   **"⚡ Trigger fact"** button.
4. Tapping it opens the site detail page with AI-generated + audio facts.

The map must run **client-side only** (no API key, no backend) so the prototype
deploys anywhere — including a static Netlify site.

---

## 2. Tech stack (current prototype)

| Concern | Chosen tech | Why |
|---|---|---|
| Map rendering | **Leaflet 1.9.4** | Light (~42 KB), no API key, MIT license, huge plugin ecosystem |
| Base tiles | **OpenStreetMap** (`tile.openstreetmap.org`) | Free, no key, production-usable with attribution |
| Geofence math | **`geoService.js`** (custom Haversine) | Zero-dependency, ~20 lines, testable pure functions |
| React integration | **`react-leaflet`** avoided → direct Leaflet in `useEffect` | Avoids version-mismatch headaches; full control |
| Marker style | **`L.divIcon`** + custom CSS | Golden heritage pins, no image assets needed |

**Files involved:**
- `src/components/MapView.jsx` — the interactive map
- `src/services/geoService.js` — distance + geofence logic
- `src/components/SimBar.jsx` — simulated GPS controls
- `src/data/sites.json` — monument coordinates + metadata

---

## 3. Map components in detail

### 3.1 MapView.jsx

- Initialised **once** with `L.map()` in a `useEffect` (with proper cleanup).
- **Tile layer:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Site markers:** one `L.marker` per monument using a `divIcon` (custom HTML
  pin). The active/nearest site gets a glowing pin.
- **Popup:** each marker binds a popup with a "Show me details →" button that
  routes to the detail page via `onSelectSite`.
- **Geofence circle:** `L.circle` around the active site, dashed golden ring,
  radius = `GEOFENCE_RADIUS_M` (500 m).
- **User marker:** a pulsing blue dot (`divIcon` + CSS) representing the user's
  location, with `map.flyTo()` animation on movement.
- **Layer groups** (`markerLayer`, `overlayLayer`) keep markers/circles separate
  so they can be cleared and redrawn independently on state changes.

### 3.2 geoService.js (pure logic)

```
distanceMeters(lat1, lng1, lat2, lng2)  → Haversine distance in metres
isNear(user, site, radius=500)          → boolean geofence check
findNearbySites(user, sites, radius)    → sorted list within radius
nearestSite(user, sites)                → closest monument regardless of radius
formatDistance(m)                       → "350 m" / "1.4 km"
```

Geofence is a simple circle around each monument's coordinates. No polygon
loading, no external geocoding — fast, offline, deterministic.

---

## 4. Data model for the map

```jsonc
// src/data/sites.json
{
  "id": "red-fort",
  "name": "Red Fort",
  "lat": 28.6562,
  "lng": 77.241,
  "area": "Old Delhi",
  "era": "Mughal Era",
  "builtYear": "1648",
  "tags": ["fort", "unesco", "mughal"],
  "facts": [ { "label": "Built", "value": "1648" } ],
  "story": "...",            // used by the AI explainer
  "visit": { "open": "...", "fee": "..." }   // visitor info
}
```

Only `lat`/`lng`/`id`/`name` are strictly needed by the map; the rest powers
the detail page and AI layer.

---

## 5. Simulated GPS (demo mode)

For hackathon demos we can't walk to the monument, so `SimBar.jsx` fakes a GPS
fix:

1. Pick a monument from the dropdown → **"Simulate arrival"**.
2. Sets `userLocation = { lat: site.lat + 0.002, lng: site.lng + 0.002 }`
   (~220 m offset, inside the 500 m fence).
3. The blue dot flies to the spot, the geofence circle activates, and
   `isNear()` returns true → the **"⚡ Trigger fact"** button appears.

This makes the core "location-triggered audio fact" flow demoable in 2 clicks
without leaving the room.

---

## 6. Upgrade path → production

### 6.1 Tiles / map provider

| Option | Key required | Notes |
|---|---|---|
| OpenStreetMap (current) | No | Free, but tile usage policy: heavy apps should self-host a tile server |
| **MapLibre GL** | Optional | Free, vector tiles, offline support, terrain |
| Mapbox GL JS | Yes (paid tier free 50k loads/mo) | Beautiful vector maps, customization |
| **Google Maps JS SDK** | Yes | Brand recognition, Places API for real POI data, Street View |
| Leaflet + Google tiles | Yes (now enforced) | Works but requires key + billing |

**Recommendation:** keep Leaflet for the prototype; for the final product use
**MapLibre GL + self-hosted vector tiles** (cost control) or **Google Maps JS
SDK** (if the judges expect Google branding). The rest of the code only touches
coordinates + `lat`/`lng`, so swapping the renderer is isolated to `MapView.jsx`.

### 6.2 Real GPS

```js
navigator.geolocation.watchPosition(
  (pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    setUserLocation({ lat, lng });
  },
  onError,
  { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
)
```

On a phone browser this runs the same `isNear()` logic against real positions.

### 6.3 Background geofencing (native app)

Web browsers can't reliably geofence in the background. For a native wrapper
(Capacitor/Flutter/React Native):

- **Android:** `GeofencingClient` / `flutter_geofencing` — up to 100 fences/device.
- **iOS:** `CLCircularRegion` + `startMonitoring(for:)`.
- Register each monument as a circular region; the OS wakes the app on entry
  and the app speaks the audio fact automatically.

### 6.4 Marker clustering

With hundreds of monuments (e.g., all of India's ASI sites), use
`leaflet.markercluster` to group pins when zoomed out, splitting on zoom in.

### 6.5 Performance

- Lazy-load the map chunk (`React.lazy`) so the Discover page stays light.
- Throttle GPS updates to ~1/sec; only recompute geofences on change.
- Cache tile bounds / use raster tiles with correct zoom ranges.

### 6.6 Offline mode

PWA + `leaflet.offline` / service worker caching lets tourists pre-download
tile areas before visiting remote monuments with poor connectivity — a real
differentiator in India's rural heritage sites.

---

## 7. Security & legal

- Always keep the OSM attribution visible (required by the OSM policy).
- Don't expose API keys client-side for Google/Mapbox — proxy through a
  Function (Netlify Functions) if needed.
- Monument coordinates come from **public government data** (ASI); no user data
  is collected for the map.

---

## 8. File checklist

```
src/components/MapView.jsx     # Leaflet map, markers, geofence, user dot
src/components/SimBar.jsx      # simulated GPS bar
src/services/geoService.js     # distance + geofence pure functions
src/data/sites.json            # monument data (lat/lng + facts)
src/index.css                  # marker/pin/popup styles
```

---

## 9. Decision summary

| Question | Prototype answer | Final answer |
|---|---|---|
| Map library | Leaflet | Leaflet+MapLibre or Google Maps SDK |
| Tiles | OpenStreetMap | Self-hosted/vector tiles or Google |
| Location | Simulated GPS | `watchPosition` + native geofencing |
| Geofence radius | 500 m circle | Configurable, per-site radius |
| Clustering | None (13 sites) | `leaflet.markercluster` |
| Offline | No | PWA tile caching |
