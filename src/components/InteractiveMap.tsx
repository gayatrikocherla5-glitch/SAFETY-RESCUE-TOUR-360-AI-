/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Hospital, 
  Shield, 
  Compass, 
  Layers, 
  Navigation, 
  RotateCcw,
  Footprints,
  Eye,
  Info,
  Globe2,
  Mountain,
  Moon,
  Satellite,
  Maximize2,
  Minimize2,
  Check,
  Radio,
  Target,
  Zap,
  ZoomIn,
  HardHat,
  Play,
  Pause,
  FastForward,
  Copy,
  Send,
  Activity,
  Navigation2,
  Share2
} from 'lucide-react';
import { LocationCoordinate, SafeZone, EmergencyPlace, SosSignalRangeKm, SosAlert, LiveMovementTelemetry } from '../types';
import { soundEngine } from '../utils/audio';

export type MapLayerId = 
  | 'google_standard'
  | 'google_satellite'
  | 'google_hybrid'
  | 'google_terrain'
  | 'esri_satellite'
  | 'carto_dark'
  | 'osm_standard';

export interface MapLayerConfig {
  id: MapLayerId;
  name: string;
  category: 'Google' | 'Satellite' | 'Topographic' | 'Tactical';
  badge: string;
  url: string;
  options: L.TileLayerOptions;
  description: string;
}

export const MAP_LAYERS: MapLayerConfig[] = [
  {
    id: 'google_standard',
    name: 'Google Maps (Standard)',
    category: 'Google',
    badge: 'Google Roads',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
    description: 'High-clarity road navigation with street names, traffic arteries, and civic infrastructure.',
  },
  {
    id: 'google_satellite',
    name: 'Google Satellite',
    category: 'Satellite',
    badge: 'Google Sat',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Earth Imagery',
    },
    description: 'Ultra high-resolution satellite imagery for inspecting coastlines, terrain, beaches, and natural landmarks.',
  },
  {
    id: 'google_hybrid',
    name: 'Google Satellite Hybrid',
    category: 'Satellite',
    badge: 'Google Hybrid',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps & Satellite',
    },
    description: 'Satellite photography combined with vector roads, borders, city labels, and landmark pins.',
  },
  {
    id: 'google_terrain',
    name: 'Google Terrain',
    category: 'Topographic',
    badge: 'Elevation & Relief',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
      attribution: '&copy; Google Terrain',
    },
    description: 'Topographic contour shading showing mountains, valleys, cliff drops, and elevation relief.',
  },
  {
    id: 'esri_satellite',
    name: 'Esri World Imagery',
    category: 'Satellite',
    badge: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    },
    description: 'High-definition global commercial satellite photography by Esri GIS.',
  },
  {
    id: 'carto_dark',
    name: 'Dark Tactical / Rescue',
    category: 'Tactical',
    badge: 'Night Ops',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
    },
    description: 'Ultra-high contrast AMOLED dark map optimized for low-light night rescue and battery saving.',
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap (OSM)',
    category: 'Tactical',
    badge: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
    description: 'Open collaborative vector street map with granular pedestrian paths and trail markers.',
  },
];

export const SOS_RANGE_CONFIGS: Record<SosSignalRangeKm, {
  label: string;
  scope: string;
  areaKm2: number;
  protocol: string;
  authorities: string;
  color: string;
}> = {
  10: {
    label: '10 km',
    scope: 'Local Tactical & Beach Ward',
    areaKm2: 314,
    protocol: 'Direct Cellular + Local UHF & BLE Mesh',
    authorities: 'Beach Lifeguards, Local Police Outposts, Primary Clinics',
    color: '#10b981',
  },
  20: {
    label: '20 km',
    scope: 'City & Coast Guard District',
    areaKm2: 1257,
    protocol: 'City TETRA Police Radio + GSM Cell Towers',
    authorities: 'Municipal Police HQ, General Trauma Hospital, Coastal Patrol',
    color: '#06b6d4',
  },
  50: {
    label: '50 km',
    scope: 'Regional State Distress Zone',
    areaKm2: 7854,
    protocol: 'State Emergency VHF Grid + Air Evac Dispatch',
    authorities: 'SDRF Disaster Force, Naval Station, Regional Trauma Centers',
    color: '#f59e0b',
  },
  100: {
    label: '100 km',
    scope: 'Wide-Area Multi-Jurisdiction SAR',
    areaKm2: 31416,
    protocol: 'Regional Satellite (NavIC / Cospas) + Coastal Radar',
    authorities: 'National NDRF, Maritime Rescue HQ, Interstate Police Network',
    color: '#ef4444',
  },
};

export interface MovingCorridorPlace {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  badge: string;
  icon: string;
  description: string;
}

export const POPULAR_MOVING_PLACES: MovingCorridorPlace[] = [
  {
    id: 'panaji_promenade',
    name: 'Panaji Riverfront Promenade',
    shortName: 'Panaji Riverfront',
    lat: 15.50020,
    lng: 73.82820,
    badge: 'City Center',
    icon: '🏙️',
    description: 'Mandovi riverfront tourist pedestrian promenade',
  },
  {
    id: 'baga_beach',
    name: 'Baga & Calangute Beach Strip',
    shortName: 'Baga Beach',
    lat: 15.55200,
    lng: 73.75160,
    badge: 'North Coast',
    icon: '🏖️',
    description: 'Popular beach coastline with lifesaver towers',
  },
  {
    id: 'fort_aguada',
    name: 'Fort Aguada & Lighthouse Cliff',
    shortName: 'Fort Aguada',
    lat: 15.49200,
    lng: 73.77350,
    badge: 'Coastal Cliff',
    icon: '🏰',
    description: 'Historic fortress & rocky ocean cliff walkway',
  },
  {
    id: 'old_goa_basilica',
    name: 'Old Goa Heritage Basilica',
    shortName: 'Old Goa Heritage',
    lat: 15.50080,
    lng: 73.91160,
    badge: 'UNESCO Site',
    icon: '🏛️',
    description: 'Colonial churches & heritage tourist avenues',
  },
  {
    id: 'anjuna_cliff',
    name: 'Anjuna & Vagator Cliff Viewpoint',
    shortName: 'Anjuna Cliff',
    lat: 15.59800,
    lng: 73.74380,
    badge: 'Cliff Overlook',
    icon: '🌅',
    description: 'Elevated cliff path above the Arabian Sea',
  },
  {
    id: 'colva_beach',
    name: 'Colva South White Sand Beach',
    shortName: 'Colva Beach',
    lat: 15.27800,
    lng: 73.91500,
    badge: 'South Coast',
    icon: '🌴',
    description: 'Tranquil white sand beach & resort corridor',
  },
];

interface InteractiveMapProps {
  currentCoords: LocationCoordinate;
  onCoordsChange: (coords: LocationCoordinate) => void;
  safeZones: SafeZone[];
  emergencyPlaces: EmergencyPlace[];
  isOffline: boolean;
  onZoneEnter?: (zone: SafeZone) => void;
  sosSignalRange?: SosSignalRangeKm | null;
  onSosSignalRangeChange?: (range: SosSignalRangeKm) => void;
  activeSos?: SosAlert | null;
  isLiveLocationMoving?: boolean;
  onToggleLiveLocationMoving?: (moving: boolean) => void;
  liveMovingTrail?: LocationCoordinate[];
  liveTelemetry?: LiveMovementTelemetry;
  onChangeMovementMode?: (mode: 'walk' | 'run' | 'vehicle') => void;
  savedContactsCount?: number;
  onSendUpdatedSms?: () => void;
  onOpenDirectSmsModal?: () => void;
  onRelocateToPlace?: (location: { lat: number; lng: number; name?: string }) => void;
  activePlaceName?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  currentCoords,
  onCoordsChange,
  safeZones,
  emergencyPlaces,
  isOffline,
  onZoneEnter,
  sosSignalRange: externalSosRange,
  onSosSignalRangeChange,
  activeSos,
  isLiveLocationMoving = false,
  onToggleLiveLocationMoving,
  liveMovingTrail = [],
  liveTelemetry,
  onChangeMovementMode,
  savedContactsCount = 0,
  onSendUpdatedSms,
  onOpenDirectSmsModal,
  onRelocateToPlace,
  activePlaceName = 'Panaji Riverfront',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const placesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sosRadarLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trailLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Auto-follow moving marker
  const [autoFollowUser, setAutoFollowUser] = useState<boolean>(true);
  const [copiedLiveMapsUrl, setCopiedLiveMapsUrl] = useState<boolean>(false);

  // Map layer state
  const [selectedLayer, setSelectedLayer] = useState<MapLayerId>(() => {
    return (localStorage.getItem('srt_preferred_map_layer') as MapLayerId) || 'google_standard';
  });
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeZoneWarning, setActiveZoneWarning] = useState<SafeZone | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'caution' | 'danger' | 'construction'>('all');
  const [showPlaces, setShowPlaces] = useState<boolean>(true);

  // Automatic SOS Signal Range State
  const [internalSosRange, setInternalSosRange] = useState<SosSignalRangeKm>(() => {
    return activeSos?.signalRangeKm || 20;
  });
  const [showSosRadarRings, setShowSosRadarRings] = useState<boolean>(true);
  const [autoEscalateMode, setAutoEscalateMode] = useState<boolean>(true);
  const lastNotifiedZoneRef = useRef<string | null>(null);

  const activeSignalRange: SosSignalRangeKm = externalSosRange || internalSosRange;
  const onRelocateToPlaceRef = useRef(onRelocateToPlace);
  onRelocateToPlaceRef.current = onRelocateToPlace;

  // Initialize Leaflet map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Reset container if it previously had a leaflet instance attached
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(container, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Click on map to relocate live moving location directly
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onRelocateToPlaceRef.current) {
          onRelocateToPlaceRef.current({
            lat: Number(e.latlng.lat.toFixed(5)),
            lng: Number(e.latlng.lng.toFixed(5)),
            name: `Custom Point (${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°)`,
          });
        }
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attach initial tile layer
      const initialLayerConfig = MAP_LAYERS.find(l => l.id === selectedLayer) || MAP_LAYERS[0];
      const initialTile = L.tileLayer(initialLayerConfig.url, initialLayerConfig.options).addTo(map);
      tileLayerRef.current = initialTile;

      // Layer groups
      sosRadarLayerGroupRef.current = L.layerGroup().addTo(map);
      zonesLayerGroupRef.current = L.layerGroup().addTo(map);
      placesLayerGroupRef.current = L.layerGroup().addTo(map);
      trailLayerGroupRef.current = L.layerGroup().addTo(map);

      // Custom User Marker Icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-9 h-9 rounded-full bg-cyan-500/40 animate-ping"></span>
            <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-xl shadow-cyan-500 flex items-center justify-center">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([currentCoords.lat, currentCoords.lng], { icon: userIcon }).addTo(map);
      marker.bindPopup(`
        <div class="text-slate-900 p-1">
          <p class="font-extrabold text-xs">YOUR CURRENT POSITION</p>
          <p class="text-[10px] font-mono">${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}</p>
          <p class="text-[10px] text-emerald-600 font-bold mt-0.5">GPS Accuracy: ±${currentCoords.accuracy || 8}m</p>
        </div>
      `);
      userMarkerRef.current = marker;

      const circle = L.circle([currentCoords.lat, currentCoords.lng], {
        radius: currentCoords.accuracy || 25,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.14,
        weight: 1.5,
      }).addTo(map);
      accuracyCircleRef.current = circle;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
      tileLayerRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      sosRadarLayerGroupRef.current = null;
      zonesLayerGroupRef.current = null;
      placesLayerGroupRef.current = null;
      trailLayerGroupRef.current = null;
    };
  }, []);

  // Switch map tile layer when selectedLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerConfig = MAP_LAYERS.find(l => l.id === selectedLayer) || MAP_LAYERS[0];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(layerConfig.url, layerConfig.options);
    newTile.addTo(map);
    newTile.bringToBack();
    tileLayerRef.current = newTile;

    try {
      localStorage.setItem('srt_preferred_map_layer', selectedLayer);
    } catch {
      // ignore localstorage errors
    }
  }, [selectedLayer]);

  // Render SOS Signal Range concentric radar rings (10 km, 20 km, 50 km, 100 km)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const radarGroup = sosRadarLayerGroupRef.current;
    if (!map || !radarGroup) return;

    radarGroup.clearLayers();

    if (!showSosRadarRings) return;

    const ranges: SosSignalRangeKm[] = [10, 20, 50, 100];

    ranges.forEach(r => {
      const config = SOS_RANGE_CONFIGS[r];
      const isSelected = r === activeSignalRange;
      const isEnclosed = r <= activeSignalRange;
      const radiusMeters = r * 1000;

      // Circle styling based on active or tiers
      const circle = L.circle([currentCoords.lat, currentCoords.lng], {
        radius: radiusMeters,
        color: isSelected ? (activeSos ? '#ef4444' : config.color) : (isEnclosed ? config.color : '#64748b'),
        fillColor: isSelected ? (activeSos ? '#ef4444' : config.color) : config.color,
        fillOpacity: isSelected ? (activeSos ? 0.18 : 0.10) : (isEnclosed ? 0.04 : 0.015),
        weight: isSelected ? 2.8 : 1.2,
        dashArray: isSelected ? undefined : '6, 6',
      });

      circle.bindPopup(`
        <div class="text-slate-900 p-2 max-w-xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${
              isSelected ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-800'
            }">
              📡 SOS Signal Range: ${config.label}
            </span>
            <span class="text-[10px] font-mono text-slate-500 font-bold">r=${r}km</span>
          </div>
          <h4 class="font-extrabold text-xs text-slate-900 mt-1">${config.scope}</h4>
          <p class="text-[11px] text-slate-600">Coverage Area: ~${config.areaKm2.toLocaleString()} km²</p>
          <p class="text-[10px] text-cyan-700 font-semibold">Protocol: ${config.protocol}</p>
          <p class="text-[10px] text-emerald-700 font-semibold">Responders: ${config.authorities}</p>
        </div>
      `);

      circle.addTo(radarGroup);
    });

  }, [currentCoords, activeSignalRange, showSosRadarRings, activeSos]);

  // Update map zones and emergency places
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !zonesLayerGroupRef.current || !placesLayerGroupRef.current) return;

    zonesLayerGroupRef.current.clearLayers();
    placesLayerGroupRef.current.clearLayers();

    // Render Safe, Caution, and Danger Geo-Fences
    safeZones.forEach(zone => {
      if (filterType !== 'all' && zone.type !== filterType) return;

      const colors = {
        safe: { stroke: '#10b981', fill: '#10b981', label: '🟢 SAFETY ZONE' },
        construction: { stroke: '#f97316', fill: '#f97316', label: '🚧 CONSTRUCTION ZONE' },
        caution: { stroke: '#f59e0b', fill: '#f59e0b', label: '🟡 CAUTION ZONE' },
        danger: { stroke: '#ef4444', fill: '#ef4444', label: '🔴 DANGER ZONE' },
      }[zone.type] || { stroke: '#3b82f6', fill: '#3b82f6', label: 'ZONE' };

      const circle = L.circle(zone.center, {
        radius: zone.radiusMeters,
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: zone.type === 'danger' ? 0.28 : zone.type === 'construction' ? 0.24 : 0.18,
        weight: 2.5,
        dashArray: zone.type === 'construction' || zone.type === 'caution' ? '6, 6' : undefined,
      });

      circle.bindPopup(`
        <div class="text-slate-900 p-1.5 max-w-xs">
          <span class="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
            zone.type === 'safe' ? 'bg-emerald-100 text-emerald-800' :
            zone.type === 'construction' ? 'bg-orange-100 text-orange-900 border border-orange-300 font-bold' :
            zone.type === 'caution' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          }">
            ${colors.label}
          </span>
          <h4 class="font-bold text-xs mt-1">${zone.name}</h4>
          <p class="text-[11px] text-slate-600 mt-0.5">${zone.description}</p>
          ${zone.warningReason ? `<p class="text-[10px] text-red-700 font-bold mt-1">Hazard: ${zone.warningReason}</p>` : ''}
          ${zone.saferAlternative ? `<p class="text-[10px] text-emerald-700 font-semibold mt-0.5">Alternative: ${zone.saferAlternative}</p>` : ''}
        </div>
      `);

      circle.addTo(zonesLayerGroupRef.current!);
    });

    // Render Emergency Places (Hospitals, Police, Tourist booths)
    if (showPlaces) {
      emergencyPlaces.forEach(place => {
        const placeIcon = L.divIcon({
          className: 'custom-place-marker',
          html: `
            <div class="w-8 h-8 rounded-xl border-2 border-white shadow-lg flex items-center justify-center ${
              place.type === 'hospital' ? 'bg-rose-600 text-white' :
              place.type === 'police' ? 'bg-blue-600 text-white' :
              place.type === 'fire' ? 'bg-amber-600 text-white' :
              place.type === 'hotel' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
            }">
              <span class="text-xs font-bold">
                ${place.type === 'hospital' ? '🏥' :
                  place.type === 'police' ? '👮' :
                  place.type === 'fire' ? '🚒' :
                  place.type === 'hotel' ? '🏨' : 'ℹ️'}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const pMarker = L.marker([place.lat, place.lng], { icon: placeIcon });
        pMarker.bindPopup(`
          <div class="text-slate-900 p-1.5 max-w-xs">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                place.type === 'hospital' ? 'bg-rose-100 text-rose-800' :
                place.type === 'police' ? 'bg-blue-100 text-blue-800' :
                place.type === 'hotel' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }">
                ${place.type}
              </span>
              ${place.isOpen24x7 ? '<span class="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded">24/7 OPEN</span>' : ''}
            </div>
            <p class="font-bold text-xs text-slate-900">${place.name}</p>
            <p class="text-[11px] text-slate-600">${place.address}</p>
            <p class="text-[11px] font-mono text-blue-700 font-semibold mt-1">📞 ${place.phone}</p>
          </div>
        `);
        pMarker.addTo(placesLayerGroupRef.current!);
      });
    }
  }, [safeZones, emergencyPlaces, filterType, showPlaces]);

  // Helper to generate custom user marker HTML with live moving telemetry, compass heading, and speed
  const getUserMarkerHtml = (moving: boolean, telemetry?: LiveMovementTelemetry) => {
    if (moving) {
      const heading = telemetry?.headingDeg ?? 45;
      const speed = telemetry?.speedKmh ?? 5.2;
      const cardinal = telemetry?.headingCardinal ?? 'NE';
      return `
        <div class="relative flex items-center justify-center cursor-pointer pointer-events-auto">
          <!-- Floating live moving badge -->
          <div class="absolute -top-9 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-black text-[10px] shadow-2xl border border-white/70 flex items-center gap-1.5 animate-pulse z-30">
            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>LIVE MOVING</span>
            <span class="font-mono text-cyan-200">${speed} km/h ${cardinal}</span>
          </div>
          <!-- Pulsing rescue radar waves -->
          <span class="absolute w-14 h-14 rounded-full bg-red-500/35 animate-ping"></span>
          <span class="absolute w-10 h-10 rounded-full bg-cyan-400/40 animate-pulse"></span>
          <!-- Moving avatar shield with heading direction -->
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-cyan-500 border-2 border-white shadow-2xl flex items-center justify-center z-20">
            <div style="transform: rotate(${heading}deg); transition: transform 0.35s ease;" class="flex items-center justify-center">
              <svg class="w-4 h-4 text-white fill-white" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-9 h-9 rounded-full bg-cyan-500/40 animate-ping"></span>
        <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-xl shadow-cyan-500 flex items-center justify-center">
          <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
        </div>
      </div>
    `;
  };

  // Sync user marker icon style when moving state or heading changes
  useEffect(() => {
    if (!userMarkerRef.current) return;
    const html = getUserMarkerHtml(isLiveLocationMoving, liveTelemetry);
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html,
      iconSize: isLiveLocationMoving ? [48, 48] : [36, 36],
      iconAnchor: isLiveLocationMoving ? [24, 24] : [18, 18],
    });
    userMarkerRef.current.setIcon(userIcon);
  }, [isLiveLocationMoving, liveTelemetry?.headingDeg, liveTelemetry?.speedKmh, liveTelemetry?.headingCardinal]);

  // Render glowing breadcrumb trail when location moves
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trailGroup = trailLayerGroupRef.current;
    if (!map || !trailGroup) return;

    trailGroup.clearLayers();

    if (!liveMovingTrail || liveMovingTrail.length < 2) return;

    const latLngs: L.LatLngExpression[] = liveMovingTrail.map(pt => [pt.lat, pt.lng]);

    // Outer ambient glowing aura line
    const glowLine = L.polyline(latLngs, {
      color: '#06b6d4',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    });

    // Core neon dashed animated path
    const coreLine = L.polyline(latLngs, {
      color: '#10b981',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '6, 8',
      lineCap: 'round',
      lineJoin: 'round',
    });

    glowLine.addTo(trailGroup);
    coreLine.addTo(trailGroup);

    // Add marker at start origin point (where SMS was first dispatched)
    const origin = liveMovingTrail[0];
    const originIcon = L.divIcon({
      className: 'origin-trail-marker',
      html: `
        <div class="px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-[9px] font-bold text-slate-300 font-mono shadow-md flex items-center gap-1 whitespace-nowrap">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>SMS Dispatched Origin</span>
        </div>
      `,
      iconSize: [120, 20],
      iconAnchor: [60, 10],
    });
    L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(trailGroup);
  }, [liveMovingTrail]);

  // Update user marker when coordinates change & check geo-fences
  useEffect(() => {
    if (userMarkerRef.current && accuracyCircleRef.current) {
      userMarkerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
      accuracyCircleRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);

      // Auto-follow moving marker if enabled
      if (isLiveLocationMoving && autoFollowUser && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([currentCoords.lat, currentCoords.lng], { animate: true });
      }

      // Update popup with live speed and moving Google Maps link
      const safeLat = currentCoords.lat.toFixed(5);
      const safeLng = currentCoords.lng.toFixed(5);
      const mapsUrl = `https://maps.google.com/?q=${safeLat},${safeLng}`;
      userMarkerRef.current.bindPopup(`
        <div class="text-slate-900 p-1.5 max-w-xs space-y-1">
          <div class="flex items-center justify-between gap-2">
            <p class="font-extrabold text-xs text-slate-900">${isLiveLocationMoving ? '🔴 LIVE MOVING LOCATION' : 'YOUR CURRENT POSITION'}</p>
            ${isLiveLocationMoving ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">MOVING</span>` : ''}
          </div>
          <p class="text-[10px] font-mono">${safeLat}, ${safeLng}</p>
          ${isLiveLocationMoving ? `
            <div class="text-[10px] font-bold text-cyan-800 flex items-center justify-between pt-0.5">
              <span>Speed: ${liveTelemetry?.speedKmh || 5.2} km/h</span>
              <span>Heading: ${liveTelemetry?.headingCardinal || 'NE'}</span>
            </div>
          ` : ''}
          <p class="text-[10px] text-emerald-600 font-bold">Accuracy: ±${currentCoords.accuracy || 8}m</p>
          <a href="${mapsUrl}" target="_blank" rel="noreferrer" class="text-[10px] text-blue-600 hover:underline block pt-0.5 font-bold">Open Live Google Maps ↗</a>
        </div>
      `);
    }

    // Geo-Fence Check: calculate distance to each zone center
    let enteredZone: SafeZone | null = null;
    safeZones.forEach(zone => {
      const distMeters = getDistanceMeters(
        currentCoords.lat,
        currentCoords.lng,
        zone.center[0],
        zone.center[1]
      );
      if (distMeters <= zone.radiusMeters) {
        enteredZone = zone;
      }
    });

    if (enteredZone) {
      const currentZone: SafeZone = enteredZone;
      setActiveZoneWarning(currentZone);
      if (lastNotifiedZoneRef.current !== currentZone.id) {
        lastNotifiedZoneRef.current = currentZone.id;
        if (currentZone.type === 'safe') {
          soundEngine.playSuccessChime();
        } else {
          soundEngine.playWarningTone();
        }
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        } catch {}
        if (onZoneEnter) onZoneEnter(currentZone);
      }
    } else {
      setActiveZoneWarning(null);
      lastNotifiedZoneRef.current = null;
    }
  }, [currentCoords, safeZones, onZoneEnter, isLiveLocationMoving, autoFollowUser, liveTelemetry]);

  // Helper distance function (Haversine formula in meters)
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCenterOnUser = () => {
    soundEngine.playClickSound();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentCoords.lat, currentCoords.lng], 15, { animate: true });
    }
  };

  // Fit map view to exactly encompass the selected SOS Signal Radius
  const handleFitSosRadius = () => {
    soundEngine.playClickSound();
    if (!mapInstanceRef.current) return;
    const radiusMeters = activeSignalRange * 1000;
    const tempCircle = L.circle([currentCoords.lat, currentCoords.lng], { radius: radiusMeters });
    mapInstanceRef.current.fitBounds(tempCircle.getBounds(), {
      padding: [40, 40],
      maxZoom: 16,
      animate: true,
    });
  };

  const handleSelectLayer = (layerId: MapLayerId) => {
    soundEngine.playClickSound();
    setSelectedLayer(layerId);
    setIsLayerMenuOpen(false);
  };

  const handleRangeChange = (r: SosSignalRangeKm) => {
    soundEngine.playClickSound();
    setInternalSosRange(r);
    if (onSosSignalRangeChange) {
      onSosSignalRangeChange(r);
    }
  };

  // Simulation buttons for browser testing
  const simulateMoveTo = (lat: number, lng: number) => {
    soundEngine.playClickSound();
    onCoordsChange({
      ...currentCoords,
      lat,
      lng,
      timestamp: Date.now(),
    });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
  };

  const activeLayerConfig = MAP_LAYERS.find(l => l.id === selectedLayer) || MAP_LAYERS[0];
  const activeRangeConfig = SOS_RANGE_CONFIGS[activeSignalRange];

  return (
    <div className="space-y-4">
      
      {/* Top Map Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Quick Map Layer Picker Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Style:</span>
          </span>

          {[
            { id: 'google_standard', label: 'Google Maps', icon: '🗺️' },
            { id: 'google_satellite', label: 'Google Satellite', icon: '🛰️' },
            { id: 'google_hybrid', label: 'Hybrid', icon: '🌐' },
            { id: 'google_terrain', label: 'Terrain', icon: '⛰️' },
            { id: 'esri_satellite', label: 'Esri Aerial', icon: '🛰️' },
            { id: 'carto_dark', label: 'Dark Rescue', icon: '🌙' },
          ].map(layerItem => (
            <button
              key={layerItem.id}
              onClick={() => handleSelectLayer(layerItem.id as MapLayerId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedLayer === layerItem.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{layerItem.icon}</span>
              <span>{layerItem.label}</span>
            </button>
          ))}

          {/* Open Layer Selector Modal / Menu */}
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setIsLayerMenuOpen(!isLayerMenuOpen);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isLayerMenuOpen
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-slate-950/70 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60'
            }`}
            title="View All Map Providers & Modes"
          >
            All Maps...
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Geo-fence filter */}
          <select
            value={filterType}
            onChange={e => {
              soundEngine.playClickSound();
              setFilterType(e.target.value as typeof filterType);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Geo-Fences</option>
            <option value="safe">🟢 Safety Zones</option>
            <option value="construction">🚧 Construction Zones</option>
            <option value="caution">🟡 Caution Zones</option>
            <option value="danger">🔴 Danger Zones</option>
          </select>

          {/* POI Toggle */}
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setShowPlaces(!showPlaces);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
              showPlaces
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950/60 text-slate-400 border-slate-800'
            }`}
            title="Toggle Hospitals, Police, and Tourist Points"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emergency POIs</span>
          </button>

          {/* GPS Recenter */}
          <button
            onClick={handleCenterOnUser}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5"
            title="Recenter on My Location"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* AUTOMATIC SOS SIGNAL RANGE BAR (10 km, 20 km, 50 km, 100 km) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${activeSos ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Automatic SOS Signal Broadcast Range
                </h4>
                {activeSos && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
                    LIVE TRANSMISSION
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Tiered radar wave perimeter for mobilizing local outposts, city command, or regional air rescue.
              </p>
            </div>
          </div>

          {/* Radar On/Off Toggle & Auto-Escalate Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playClickSound();
                setAutoEscalateMode(!autoEscalateMode);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                autoEscalateMode
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800'
              }`}
              title="Automatically expand signal radius from 10km to 100km if response is unassigned"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Escalate (10→100km)</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClickSound();
                setShowSosRadarRings(!showSosRadarRings);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showSosRadarRings
                  ? 'bg-red-600/20 text-red-300 border-red-500/40'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800'
              }`}
            >
              {showSosRadarRings ? 'Hide Radar Rings' : 'Show Radar Rings'}
            </button>

            <button
              onClick={handleFitSosRadius}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5"
              title="Zoom map to fit chosen signal radius perimeter"
            >
              <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fit Range</span>
            </button>
          </div>
        </div>

        {/* 10 km, 20 km, 50 km, 100 km Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {([10, 20, 50, 100] as const).map(range => {
            const config = SOS_RANGE_CONFIGS[range];
            const isSelected = activeSignalRange === range;
            return (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-950/50 to-slate-900 border-red-500 text-white shadow-lg shadow-red-950/50 ring-1 ring-red-400/40'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black font-mono text-white flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                    <span>{config.label}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    ~{config.areaKm2.toLocaleString()} km²
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-200 mt-1 truncate">{config.scope}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{config.protocol}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Range Status Telemetry Strip */}
        <div className="p-3 rounded-2xl bg-black/40 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Scope:</span>
            <span className="text-xs font-extrabold text-cyan-300">{activeRangeConfig.scope}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono text-[11px]">Radius: {activeSignalRange} km</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-mono text-[11px]">Coverage: ~{activeRangeConfig.areaKm2.toLocaleString()} km²</span>
          </div>

          <div className="text-[11px] text-slate-400 truncate">
            <span className="text-slate-300 font-bold">Network Reach:</span> {activeRangeConfig.authorities}
          </div>
        </div>
      </div>

      {/* Dynamic Geo-Fence Alert Warning Banner */}
      {activeZoneWarning && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-lg animate-in slide-in-from-top-2 ${
          activeZoneWarning.type === 'danger'
            ? 'bg-red-950/50 border-red-500/70 text-red-100 ring-1 ring-red-500/30'
            : activeZoneWarning.type === 'construction'
            ? 'bg-amber-950/50 border-amber-500/70 text-amber-100 ring-1 ring-amber-500/30'
            : activeZoneWarning.type === 'safe'
            ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-100 ring-1 ring-emerald-500/30'
            : 'bg-amber-950/40 border-amber-500/60 text-amber-100'
        }`}>
          {activeZoneWarning.type === 'safe' ? (
            <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5 text-emerald-400" />
          ) : activeZoneWarning.type === 'construction' ? (
            <HardHat className="w-6 h-6 shrink-0 mt-0.5 text-amber-400" />
          ) : (
            <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${
              activeZoneWarning.type === 'danger' ? 'text-red-400 animate-bounce' : 'text-amber-400'
            }`} />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm tracking-wide">
                {activeZoneWarning.type === 'danger' ? '🔴 RESTRICTED DANGER ZONE ENTERED' :
                 activeZoneWarning.type === 'construction' ? '🚧 CONSTRUCTION ZONE ENTERED' :
                 activeZoneWarning.type === 'safe' ? '🟢 SAFETY ZONE ENTERED' : '🟡 CAUTION ZONE ENTERED'}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                Geo-Fence Active
              </span>
            </div>
            <p className="text-xs font-semibold text-white">{activeZoneWarning.name}</p>
            <p className="text-xs opacity-90">{activeZoneWarning.description}</p>
            {activeZoneWarning.warningReason && (
              <p className="text-xs font-bold text-yellow-300">
                Hazard: {activeZoneWarning.warningReason}
              </p>
            )}
            {activeZoneWarning.saferAlternative && (
              <p className="text-xs font-semibold text-emerald-300">
                Recommended alternative: {activeZoneWarning.saferAlternative}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Map Box */}
      <div className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'h-[440px] sm:h-[520px]'
      }`}>
        
        {/* Leaflet map container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Current Active Map Badge & SOS Range Pill (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>{activeLayerConfig.name}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {activeLayerConfig.category}
            </span>
          </div>

          {showSosRadarRings && (
            <div className="px-3 py-1.5 rounded-xl bg-red-950/90 border border-red-500/40 text-red-200 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>SOS Radar: {activeSignalRange} km</span>
            </div>
          )}

          {isOffline && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Offline Vectors Cached</span>
            </div>
          )}

          {isLiveLocationMoving && (
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-xs font-black shadow-lg flex items-center gap-1.5 backdrop-blur-md border border-white/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>LIVE MOVING</span>
              <span className="font-mono text-cyan-100 text-[10px] hidden sm:inline">
                {liveTelemetry?.speedKmh || 5.2} km/h {liveTelemetry?.headingCardinal || 'NE'}
              </span>
            </div>
          )}
        </div>

        {/* Quick Map Switcher Drawer on Top-Right */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playClickSound();
              setIsLayerMenuOpen(!isLayerMenuOpen);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md transition-all"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Map Layers</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClickSound();
              setIsFullscreen(!isFullscreen);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 200);
            }}
            className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white shadow-xl backdrop-blur-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Floating Layer Menu Popup */}
        {isLayerMenuOpen && (
          <div className="absolute top-16 right-4 z-30 w-72 sm:w-80 bg-slate-900/95 border border-slate-700 rounded-3xl p-4 shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Select Map Engine</h4>
              </div>
              <button
                onClick={() => setIsLayerMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {MAP_LAYERS.map(layer => {
                const isSelected = selectedLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => handleSelectLayer(layer.id)}
                    className={`w-full p-2.5 rounded-2xl text-left border transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500/80 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{layer.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-black/40 text-cyan-300 border border-white/10">
                          {layer.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{layer.description}</p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live GPS Telemetry Floating Card (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md text-[11px] space-y-1 max-w-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
            <MapPin className="w-3.5 h-3.5" />
            <span>GNSS Live Coordinates</span>
          </div>
          <div className="font-mono text-white text-xs">
            {currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E
          </div>
          <div className="text-slate-400 flex items-center justify-between gap-4 text-[10px]">
            <span>Accuracy: ±{currentCoords.accuracy || 10}m</span>
            <span className="text-emerald-400 font-bold">● Active Tracking</span>
          </div>
        </div>
      </div>

      {/* DEDICATED LIVE GPS MOVEMENT & DIRECT BROADCAST STATION (BELOW MAP - NOT OBSCURING MAP CANVAS) */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isLiveLocationMoving
          ? 'bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-950 border-red-500/60 shadow-xl ring-1 ring-red-500/30'
          : 'bg-slate-900/80 border-slate-800 shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header & Broadcast Status */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isLiveLocationMoving
                ? 'bg-red-600/30 border-red-500 text-red-400 shadow-lg shadow-red-600/20'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Activity className={`w-5 h-5 ${isLiveLocationMoving ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isLiveLocationMoving ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  {isLiveLocationMoving ? 'Live Location Moving & Shared' : 'Live Movement Simulation'}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isLiveLocationMoving
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isLiveLocationMoving ? `${savedContactsCount} Contacts Receiving Updates` : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLiveLocationMoving
                  ? 'Real-time GPS coordinates are streaming along the route corridor and auto-shared to your saved contacts.'
                  : 'Start live movement simulation to track route corridor motion and stream coordinates to saved contacts.'}
              </p>
            </div>
          </div>

          {/* Real-time Telemetry Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono bg-black/60 px-3.5 py-2.5 rounded-2xl border border-slate-800/80">
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Position</div>
              <div className="text-cyan-300 font-bold">{currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°</div>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Speed</div>
              <div className="text-emerald-400 font-bold">{isLiveLocationMoving ? (liveTelemetry?.speedKmh || 5.2) : 0} km/h</div>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Heading</div>
              <div className="text-amber-400 font-bold">{liveTelemetry?.headingCardinal || 'NE'} ({liveTelemetry?.headingDeg || 45}°)</div>
            </div>
            <div className="border-l border-slate-800 pl-3 hidden sm:block">
              <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Traveled</div>
              <div className="text-white font-bold">+{liveTelemetry?.distanceTraveledMeters || 0} m</div>
            </div>
          </div>

          {/* Action & Sharing Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Follow Toggle */}
            <button
              onClick={() => setAutoFollowUser(!autoFollowUser)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                autoFollowUser
                  ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Keep map view centered on moving marker"
            >
              <Navigation2 className={`w-3.5 h-3.5 ${autoFollowUser ? 'text-cyan-400' : ''}`} />
              <span>Follow: {autoFollowUser ? 'ON' : 'OFF'}</span>
            </button>

            {/* Mode Selector */}
            {onChangeMovementMode && (
              <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
                {(['walk', 'run', 'vehicle'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onChangeMovementMode(m)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      liveTelemetry?.mode === m
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'walk' ? '🚶 Walk (5k)' : m === 'run' ? '🏃 Jog (12k)' : '🚗 Car (35k)'}
                  </button>
                ))}
              </div>
            )}

            {/* Copy / Share Google Maps Link */}
            <button
              onClick={() => {
                soundEngine.playClickSound();
                const safeLat = currentCoords.lat.toFixed(5);
                const safeLng = currentCoords.lng.toFixed(5);
                const url = `https://maps.google.com/?q=${safeLat},${safeLng}`;
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(url);
                  setCopiedLiveMapsUrl(true);
                  setTimeout(() => setCopiedLiveMapsUrl(false), 2000);
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Copy current live moving Google Maps URL"
            >
              {copiedLiveMapsUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLiveMapsUrl ? 'Copied' : 'Share Google Maps'}</span>
            </button>

            {/* Direct SMS to Saved Contacts */}
            {(onSendUpdatedSms || onOpenDirectSmsModal) && (
              <button
                onClick={() => {
                  soundEngine.playClickSound();
                  if (onSendUpdatedSms) onSendUpdatedSms();
                  if (onOpenDirectSmsModal) onOpenDirectSmsModal();
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 active:scale-95"
                title="Directly transmit updated moving coordinates to saved contacts via Cellular Gateway without touching phone"
              >
                <Send className="w-3.5 h-3.5 text-cyan-300" />
                <span>Direct SMS to Saved</span>
              </button>
            )}

            {/* Start / Pause Movement Simulation */}
            {onToggleLiveLocationMoving && (
              <button
                onClick={() => onToggleLiveLocationMoving(!isLiveLocationMoving)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isLiveLocationMoving
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isLiveLocationMoving ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isLiveLocationMoving ? 'Pause Moving' : 'Start Live Moving'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Geo-Fence & Teleport Simulator Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span>Interactive Geo-Fence &amp; Location Simulator:</span>
          </span>
          <span className="text-[10px] text-slate-400">Click to teleport user location on Google / Satellite maps</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => simulateMoveTo(15.5005, 73.8290)}
            className="p-3 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-left transition-all group"
          >
            <p className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span>🟢 Walk into Safety Zone</span>
              <span className="text-[9px] font-mono text-emerald-400 opacity-80 group-hover:opacity-100">Safe Hub</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">Central Promenade (Lifeguards &amp; 24/7 Police)</p>
          </button>

          <button
            onClick={() => simulateMoveTo(15.4940, 73.8240)}
            className="p-3 rounded-2xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 text-left transition-all group"
          >
            <p className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>🚧 Walk into Construction Zone</span>
              <span className="text-[9px] font-mono text-amber-400 opacity-80 group-hover:opacity-100">Hazard</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">Harbor Metro &amp; Bridge (Heavy machinery)</p>
          </button>

          <button
            onClick={() => simulateMoveTo(15.5120, 73.8210)}
            className="p-3 rounded-2xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/40 text-left transition-all group"
          >
            <p className="text-xs font-bold text-red-300 flex items-center justify-between">
              <span>🔴 Walk into Danger Zone</span>
              <span className="text-[9px] font-mono text-red-400 opacity-80 group-hover:opacity-100">Critical</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">North Cliff Edge (Flash flood &amp; cliff drop)</p>
          </button>
        </div>
      </div>

    </div>
  );
};
