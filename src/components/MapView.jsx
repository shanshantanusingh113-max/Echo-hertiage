import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GEOFENCE_RADIUS_M } from '../services/geoService.js'

const SITE_ICON = (img) => L.divIcon({
  className: 'site-marker',
  html: `<div class="site-marker-pin"><span>🏛️</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -26],
})

const ACTIVE_ICON = L.divIcon({
  className: 'site-marker',
  html: '<div class="site-marker-pin active"><span>🏛️</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -30],
})

const USER_ICON = L.divIcon({
  className: 'user-marker',
  html: '<div class="user-marker-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const WALK_ICON = L.divIcon({
  className: 'user-marker',
  html: '<div class="walk-marker-dot"><span>🚶</span></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const DEFAULT_CENTER = [28.6129, 77.2295]
const DEFAULT_ZOOM = 12

export default function MapView({
  sites,
  userLocation,
  activeSite,
  onSelectSite,
  route,
  walkPos,
  t,
  lang,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    const markerLayer = L.layerGroup().addTo(map)
    const overlayLayer = L.layerGroup().addTo(map)
    layersRef.current = { markers: [], circle: null, user: null, walk: null, polyline: null, markerLayer, overlayLayer }
    return () => { map.remove(); mapRef.current = null; layersRef.current = null }
  }, [])

  // site markers + popups with photos
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    layers.markerLayer.clearLayers()
    layers.markers = sites.map((site) => {
      const isActive = site.id === activeSite?.id
      const marker = L.marker([site.lat, site.lng], { icon: isActive ? ACTIVE_ICON : SITE_ICON() })
      const img = site.image
        ? `<img class="popup-img" src="${site.image}" alt="${site.name}" loading="lazy" onerror="this.style.display='none'"/>`
        : `<div class="popup-img fallback">${site.name.charAt(0)}</div>`
      const summary = lang === 'hi' ? (site.summaryHi || site.summary) : site.summary
      marker.bindPopup(
        `<div class="map-popup">
          ${img}
          <strong>${site.name}</strong>
          <div class="muted">${site.era} · ${site.area}</div>
          <div class="popup-summary">${summary}</div>
          <button class="popup-btn" data-id="${site.id}">${t('viewOnMap')} →</button>
        </div>`
      )
      marker.on('click', () => marker.openPopup())
      marker.on('popupopen', () => {
        const btn = document.querySelector(`.popup-btn[data-id="${site.id}"]`)
        btn?.addEventListener('click', () => onSelectSite(site))
      })
      marker.addTo(layers.markerLayer)
      return marker
    })
  }, [sites, activeSite, onSelectSite, t, lang])

  // geofence circle
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (layers.circle) { layers.circle.remove(); layers.circle = null }
    if (activeSite) {
      layers.circle = L.circle([activeSite.lat, activeSite.lng], {
        radius: GEOFENCE_RADIUS_M,
        color: '#6366f1', weight: 2, opacity: 0.7,
        fillColor: '#6366f1', fillOpacity: 0.12, dashArray: '6 6',
      }).addTo(layers.overlayLayer)
    }
  }, [activeSite])

  // user marker
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (layers.user) { layers.user.remove(); layers.user = null }
    if (userLocation && !walkPos) {
      layers.user = L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON })
        .addTo(layers.overlayLayer)
        .bindPopup(`<strong>${t('youAreHere')}</strong>`)
    }
  }, [userLocation, walkPos, t])

  // walking marker
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (layers.walk) { layers.walk.remove(); layers.walk = null }
    if (walkPos) {
      layers.walk = L.marker([walkPos.lat, walkPos.lng], { icon: WALK_ICON })
        .addTo(layers.overlayLayer)
        .bindPopup(`<strong>🚶 ${t('currentLoc')}</strong>`)
    }
  }, [walkPos, t])

  // route polyline
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return
    if (layers.polyline) { layers.polyline.remove(); layers.polyline = null }
    if (route?.segments?.length) {
      const points = [route.segments[0].from, ...route.segments.map((s) => s.to)].map((s) => [s.lat, s.lng])
      layers.polyline = L.polyline(points, {
        color: '#6366f1', weight: 3, opacity: 0.65, dashArray: '4 10', lineCap: 'round',
      }).addTo(layers.overlayLayer)
    }
  }, [route])

  // follow the walk
  useEffect(() => {
    const map = mapRef.current
    if (map && walkPos) {
      map.panTo([walkPos.lat, walkPos.lng], { animate: true, duration: 0.4 })
      if (map.getZoom() < 14) map.setZoom(14)
    }
  }, [walkPos])

  // fit bounds once
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (sites.length && !userLocation && !walkPos) {
      map.fitBounds(L.latLngBounds(sites.map((s) => [s.lat, s.lng])).pad(0.12))
    }
  }, [sites, userLocation, walkPos])

  return <div ref={containerRef} className="map-container" />
}