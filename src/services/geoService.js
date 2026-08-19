/**
 * geoService.js — distance + geofencing helpers for the map.
 * Pure math, no dependencies.
 */

const EARTH_RADIUS_M = 6371000

/** Haversine distance between two lat/lng points, in metres. */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

/** Default geofence radius in metres. */
export const GEOFENCE_RADIUS_M = 500

/** True when the user's location is within radius metres of the site. */
export function isNear(user, site, radius = GEOFENCE_RADIUS_M) {
  if (!user) return false
  return distanceMeters(user.lat, user.lng, site.lat, site.lng) <= radius
}

/** Returns all sites within radius, sorted by distance. */
export function findNearbySites(user, sites, radius = GEOFENCE_RADIUS_M) {
  if (!user) return []
  return sites
    .map((site) => ({ site, dist: distanceMeters(user.lat, user.lng, site.lat, site.lng) }))
    .filter(({ dist }) => dist <= radius)
    .sort((a, b) => a.dist - b.dist)
}

/** Nearest site regardless of radius (for "closest attraction" display). */
export function nearestSite(user, sites) {
  if (!user || !sites.length) return null
  let best = null
  let bestDist = Infinity
  for (const site of sites) {
    const d = distanceMeters(user.lat, user.lng, site.lat, site.lng)
    if (d < bestDist) {
      bestDist = d
      best = site
    }
  }
  return { site: best, dist: bestDist }
}

/** Format a distance for display. */
export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}