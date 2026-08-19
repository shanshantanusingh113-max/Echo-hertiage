import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GEOFENCE_RADIUS_M } from '../services/geoService.js'

const SITE_ICON = L.divIcon({
  className: 'site-marker',
  html: '<div class="site-marker-pin"><span>🏛️</span></div>',
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

const DEFAULT_CENTER = [28.6129, 77.2295] // central Delhi
const DEFAULT_ZOOM = 12

export default function MapView({ sites, userLocation, activeSite, onSelectSite }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({ markers: [], circle: null, user: null })

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    const markerLayer = L.layerGroup().addTo(map)
    const overlayLayer = L.layerGroup().addTo(map)
    layersRef.current = { markers: [], circle: null, user: null, markerLayer, overlayLayer }

    const cleanup = () => {
      map.remove()
      mapRef.current = null
      layersRef.current = { markers: [], circle: null, user: null }
    }
    return cleanup
  }, [])

  // site markers
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map) return

    layers.markerLayer.clearLayers()
    layers.markers = sites.map((site) => {
      const marker = L.marker([site.lat, site.lng], {
        icon: site.id === activeSite?.id ? ACTIVE_ICON : SITE_ICON,
      })
      marker.bindPopup(
        `<div class="map-popup">
           <strong>${site.name}</strong>
           <div class="muted">${site.area}</div>
           <button class="popup-btn" data-id="${site.id}">Show me details →</button>
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
  }, [sites, activeSite, onSelectSite])

  // geofence circle around active site
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map) return

    if (layers.circle) {
      layers.circle.remove()
      layers.circle = null
    }
    if (activeSite) {
      layers.circle = L.circle([activeSite.lat, activeSite.lng], {
        radius: GEOFENCE_RADIUS_M,
        color: '#f5b301',
        weight: 2,
        opacity: 0.8,
        fillColor: '#f5b301',
        fillOpacity: 0.15,
        dashArray: '6 6',
      }).addTo(layers.overlayLayer)
    }
  }, [activeSite])

  // user location marker
  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map) return

    if (layers.user) {
      layers.user.remove()
      layers.user = null
    }
    if (userLocation) {
      layers.user = L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON })
        .addTo(layers.overlayLayer)
        .bindPopup('<strong>You are here</strong>')
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 14))
    }
  }, [userLocation])

  // fit bounds to sites on first mount
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (sites.length && !userLocation) {
      const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng]))
      map.fitBounds(bounds.pad(0.15))
    }
  }, [sites, userLocation])

  return <div ref={containerRef} className="map-container" />
}