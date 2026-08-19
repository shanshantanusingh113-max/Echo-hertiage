/**
 * tourService.js — pure functions for the Guided Walk simulation.
 * Moves a "walking" marker along a route of monument stops and detects
 * geofence entry / arrival. No React, no DOM — easy to test.
 */

import { distanceMeters, GEOFENCE_RADIUS_M } from './geoService.js'

export const WALK_SPEED_MPS = 1.3 // human walking pace
export const ARRIVE_RADIUS_M = 40 // "you made it" threshold

export const DELHI_TRAIL = [
  'red-fort',
  'jama-masjid',
  'feroz-shah-kotla',
  'jantar-mantar',
  'safdarjung-tomb',
  'lodhi-gardens',
  'hauz-khas',
  'qutub-minar',
]

/** Build ordered segments between stops. */
export function buildRoute(sites, stopIds) {
  const stops = stopIds.map((id) => sites.find((s) => s.id === id)).filter(Boolean)
  const segments = []
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i]
    const to = stops[i + 1]
    segments.push({
      from,
      to,
      dist: distanceMeters(from.lat, from.lng, to.lat, to.lng),
    })
  }
  return { stops, segments }
}

export function totalDistance(route) {
  return route.segments.reduce((sum, s) => sum + s.dist, 0)
}

/** Linear interpolation between two lat/lng points. */
export function lerp(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/**
 * Advance the walk by dt seconds.
 * state: { segIndex, segProgress }
 * returns { state, pos, arrived, currentStop, nextStop }
 */
export function stepWalk(route, state, dtSeconds, speedMps) {
  let segIndex = state.segIndex
  let segProgress = state.segProgress
  let remaining = dtSeconds * speedMps

  while (remaining > 0 && segIndex < route.segments.length) {
    const seg = route.segments[segIndex]
    const segRemaining = seg.dist * (1 - segProgress)
    if (remaining >= segRemaining) {
      remaining -= segRemaining
      segIndex += 1
      segProgress = 0
    } else {
      segProgress += remaining / seg.dist
      remaining = 0
    }
  }

  if (segIndex >= route.segments.length) {
    const last = route.stops[route.stops.length - 1]
    return { state: { segIndex, segProgress: 0 }, pos: { lat: last.lat, lng: last.lng }, arrived: true, currentStop: last, nextStop: null }
  }

  const seg = route.segments[segIndex]
  const pos = lerp(seg.from, seg.to, segProgress)
  return {
    state: { segIndex, segProgress },
    pos,
    arrived: segProgress >= 1 && segIndex === route.segments.length - 1,
    currentStop: seg.to,
    nextStop: route.segments[segIndex + 1]?.to ?? null,
  }
}

/** Distance from pos to a given stop. */
export function distTo(pos, stop) {
  return distanceMeters(pos.lat, pos.lng, stop.lat, stop.lng)
}

export function inGeofence(pos, stop, radius = GEOFENCE_RADIUS_M) {
  return distTo(pos, stop) <= radius
}