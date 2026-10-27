'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Layers,
  Building2,
  Package,
  Wrench,
  AlertTriangle,
  Car,
  ChevronRight,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  Compass,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DVLAStationMeta {
  id: string;
  name: string;
  code: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  isHq?: boolean;
  address: string;
  phone: string;
}

// 26 Authentic DVLA Operational Stations across all 16 Regions of Ghana
export const DVLA_STATIONS: DVLAStationMeta[] = [
  // Greater Accra
  {
    id: 'sta-hq',
    name: 'DVLA National Head Office',
    code: 'HQ-CAN',
    region: 'Greater Accra',
    city: 'Cantonments, Accra',
    lat: 5.5786,
    lng: -0.1748,
    isHq: true,
    address: 'Jawaharlal Nehru Road, Cantonments, Accra',
    phone: '+233 302 766 857',
  },
  {
    id: 'sta-37',
    name: 'Accra Main (37)',
    code: 'GAR-37',
    region: 'Greater Accra',
    city: 'Accra',
    lat: 5.5898,
    lng: -0.1834,
    address: 'Liberation Road, Opposite 37 Military Hospital, Accra',
    phone: '+233 302 774 233',
  },
  {
    id: 'sta-tema',
    name: 'Tema',
    code: 'GAR-TEM',
    region: 'Greater Accra',
    city: 'Tema',
    lat: 5.6698,
    lng: -0.0166,
    address: 'Community 1, Near Harbour Roundabout, Tema',
    phone: '+233 303 202 119',
  },
  {
    id: 'sta-weija',
    name: 'Weija',
    code: 'GAR-WEI',
    region: 'Greater Accra',
    city: 'Weija, Accra West',
    lat: 5.5732,
    lng: -0.3341,
    address: 'Mallam-Kasoa Highway, Weija Junction',
    phone: '+233 302 850 491',
  },
  {
    id: 'sta-amasaman',
    name: 'Amasaman',
    code: 'GAR-AMA',
    region: 'Greater Accra',
    city: 'Amasaman',
    lat: 5.7000,
    lng: -0.3000,
    address: 'Accra-Nsawam Road, Ga West District',
    phone: '+233 302 912 344',
  },
  {
    id: 'sta-madina',
    name: 'Madina',
    code: 'GAR-MAD',
    region: 'Greater Accra',
    city: 'Madina, Accra East',
    lat: 5.6700,
    lng: -0.1667,
    address: 'Atomic Junction, Madina District',
    phone: '+233 302 501 882',
  },

  // Ashanti Region
  {
    id: 'sta-kumasi',
    name: 'Kumasi Main',
    code: 'ASH-KMA',
    region: 'Ashanti',
    city: 'Kumasi',
    lat: 6.6713,
    lng: -1.6111,
    address: 'Asokwa Industrial Area, Kumasi',
    phone: '+233 322 023 456',
  },
  {
    id: 'sta-obuasi',
    name: 'Obuasi',
    code: 'ASH-OBU',
    region: 'Ashanti',
    city: 'Obuasi',
    lat: 6.2022,
    lng: -1.6756,
    address: 'Near AGA Central Sports Club, Obuasi',
    phone: '+233 322 440 120',
  },
  {
    id: 'sta-mampong',
    name: 'Mampong',
    code: 'ASH-MAM',
    region: 'Ashanti',
    city: 'Mampong',
    lat: 7.0627,
    lng: -1.4003,
    address: 'Mampong Scarp Road, Ashanti North',
    phone: '+233 322 222 105',
  },

  // Western Region
  {
    id: 'sta-takoradi',
    name: 'Takoradi',
    code: 'WES-TAK',
    region: 'Western',
    city: 'Sekondi-Takoradi',
    lat: 4.9016,
    lng: -1.7831,
    address: 'Harbour Road, Beach Road Area, Takoradi',
    phone: '+233 312 021 990',
  },
  {
    id: 'sta-tarkwa',
    name: 'Tarkwa',
    code: 'WES-TAR',
    region: 'Western',
    city: 'Tarkwa',
    lat: 5.3018,
    lng: -1.9842,
    address: 'UMaT Enclave, Tarkwa-Bogoso Road',
    phone: '+233 312 320 445',
  },

  // Central Region
  {
    id: 'sta-cape-coast',
    name: 'Cape Coast',
    code: 'CEN-CPC',
    region: 'Central',
    city: 'Cape Coast',
    lat: 5.1054,
    lng: -1.2466,
    address: 'Pedu Junction, Accra-Takoradi Highway',
    phone: '+233 332 132 890',
  },
  {
    id: 'sta-winneba',
    name: 'Winneba',
    code: 'CEN-WIN',
    region: 'Central',
    city: 'Winneba',
    lat: 5.3511,
    lng: -0.6231,
    address: 'Winneba Junction, Effutu Municipality',
    phone: '+233 332 321 004',
  },

  // Eastern Region
  {
    id: 'sta-koforidua',
    name: 'Koforidua',
    code: 'EAS-KOF',
    region: 'Eastern',
    city: 'Koforidua',
    lat: 6.0941,
    lng: -0.2591,
    address: 'Okodi Memorial Highway, Koforidua',
    phone: '+233 342 022 341',
  },
  {
    id: 'sta-nkawkaw',
    name: 'Nkawkaw',
    code: 'EAS-NKA',
    region: 'Eastern',
    city: 'Nkawkaw',
    lat: 6.5500,
    lng: -0.7667,
    address: 'Kumasi-Accra By-pass Road, Kwahu Area',
    phone: '+233 343 122 098',
  },

  // Volta Region
  {
    id: 'sta-ho',
    name: 'Ho',
    code: 'VOL-HO',
    region: 'Volta',
    city: 'Ho',
    lat: 6.6101,
    lng: 0.4786,
    address: 'Civic Centre Road, Ho Central',
    phone: '+233 362 026 512',
  },
  {
    id: 'sta-aflao',
    name: 'Aflao',
    code: 'VOL-AFL',
    region: 'Volta',
    city: 'Aflao',
    lat: 6.1189,
    lng: 1.1894,
    address: 'Togo Border Enclave, Aflao Commercial Sector',
    phone: '+233 362 530 112',
  },

  // Northern Region
  {
    id: 'sta-tamale',
    name: 'Tamale',
    code: 'NOR-TAM',
    region: 'Northern',
    city: 'Tamale',
    lat: 9.4008,
    lng: -0.8393,
    address: 'Bolgatanga Road, Education Ridge, Tamale',
    phone: '+233 372 022 713',
  },

  // Bono Region
  {
    id: 'sta-sunyani',
    name: 'Sunyani',
    code: 'BON-SUN',
    region: 'Bono',
    city: 'Sunyani',
    lat: 7.3399,
    lng: -2.3268,
    address: 'Fiapre Road, Sunyani Municipality',
    phone: '+233 352 027 182',
  },

  // Bono East Region
  {
    id: 'sta-techiman',
    name: 'Techiman',
    code: 'BOE-TEC',
    region: 'Bono East',
    city: 'Techiman',
    lat: 7.5833,
    lng: -1.9333,
    address: 'Commercial Market Highway, Techiman',
    phone: '+233 352 522 301',
  },

  // Ahafo Region
  {
    id: 'sta-goaso',
    name: 'Goaso',
    code: 'AHA-GOA',
    region: 'Ahafo',
    city: 'Goaso',
    lat: 6.8000,
    lng: -2.5167,
    address: 'Regional Coordinating Council Corridor, Goaso',
    phone: '+233 352 091 102',
  },

  // Western North Region
  {
    id: 'sta-wiawso',
    name: 'Sefwi Wiawso',
    code: 'WNR-SEF',
    region: 'Western North',
    city: 'Sefwi Wiawso',
    lat: 6.2000,
    lng: -2.4833,
    address: 'Dwenase Road, Sefwi Wiawso',
    phone: '+233 312 094 511',
  },

  // Oti Region
  {
    id: 'sta-dambai',
    name: 'Dambai',
    code: 'OTI-DAM',
    region: 'Oti',
    city: 'Dambai',
    lat: 8.0667,
    lng: 0.1833,
    address: 'Lakeside Administrative Enclave, Dambai',
    phone: '+233 362 195 201',
  },

  // Savannah Region
  {
    id: 'sta-damongo',
    name: 'Damongo',
    code: 'SAV-DAM',
    region: 'Savannah',
    city: 'Damongo',
    lat: 9.0833,
    lng: -1.8167,
    address: 'Mole National Park Road, Damongo',
    phone: '+233 372 098 710',
  },

  // North East Region
  {
    id: 'sta-nalerigu',
    name: 'Nalerigu',
    code: 'NER-NAL',
    region: 'North East',
    city: 'Nalerigu',
    lat: 10.5333,
    lng: -0.3667,
    address: 'Gambaga Escarpment Way, Nalerigu',
    phone: '+233 372 492 019',
  },

  // Upper East Region
  {
    id: 'sta-bolgatanga',
    name: 'Bolgatanga',
    code: 'UER-BOL',
    region: 'Upper East',
    city: 'Bolgatanga',
    lat: 10.7856,
    lng: -0.8514,
    address: 'Navrongo Road, Near Regional Hospital, Bolgatanga',
    phone: '+233 382 022 411',
  },

  // Upper West Region
  {
    id: 'sta-wa',
    name: 'Wa',
    code: 'UWR-WA',
    region: 'Upper West',
    city: 'Wa',
    lat: 10.0601,
    lng: -2.5099,
    address: 'Kambali Residential Area, Wa',
    phone: '+233 392 022 190',
  },
];

// Helper to normalize region names between GeoJSON shapeName and DVLA database names
export function normalizeRegionName(raw: string): string {
  if (!raw) return 'Greater Accra';
  const clean = raw.replace(/\s+Region$/i, '').trim();
  // Map abbreviations if any
  const map: Record<string, string> = {
    'GAR': 'Greater Accra',
    'ASH': 'Ashanti',
    'EAS': 'Eastern',
    'WES': 'Western',
    'NOR': 'Northern',
    'VOL': 'Volta',
    'CEN': 'Central',
    'AHA': 'Ahafo',
    'BON': 'Bono',
    'BOE': 'Bono East',
    'OTI': 'Oti',
    'SAV': 'Savannah',
    'NER': 'North East',
    'UER': 'Upper East',
    'UWR': 'Upper West',
    'WNR': 'Western North',
  };
  return map[clean] || clean;
}

export interface GhanaInteractiveMapProps {
  assets: any[];
  dbStations?: any[];
  dbRegions?: any[];
  onSelectRegion?: (regionName: string | null) => void;
  onSelectStation?: (stationName: string | null) => void;
}

export function GhanaInteractiveMap({
  assets,
  dbStations,
  dbRegions,
  onSelectRegion,
  onSelectStation,
}: GhanaInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<DVLAStationMeta | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [baseLayerType, setBaseLayerType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [filterMode, setFilterMode] = useState<'all' | 'high_density' | 'fleet'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ghana bounding box coordinates
  const GHANA_BOUNDS: [[number, number], [number, number]] = [
    [4.65, -3.35], // Southwest
    [11.25, 1.25],  // Northeast
  ];

  // Clean, 100% Free Watermark-Free Tile Layer Configurations (No API Key Required)
  const TILE_LAYERS = {
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      maxZoom: 16,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      refUrl: undefined,
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
    },
    streets: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      refUrl: undefined,
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
  };

  // Group assets by station name
  const stationAssetStats = useMemo(() => {
    const stats: Record<
      string,
      {
        total: number;
        inService: number;
        maintenance: number;
        missing: number;
        fleet: number;
      }
    > = {};

    assets.forEach((a) => {
      const sta = a.stationName || 'DVLA National Head Office';
      if (!stats[sta]) {
        stats[sta] = { total: 0, inService: 0, maintenance: 0, missing: 0, fleet: 0 };
      }
      if (a.status !== 'Disposed') {
        stats[sta].total++;
        if (a.status === 'In Service') stats[sta].inService++;
        if (a.status === 'In Maintenance') stats[sta].maintenance++;
        if (a.status === 'Missing') stats[sta].missing++;
        if (a.categoryName === 'Vehicles') stats[sta].fleet++;
      }
    });

    return stats;
  }, [assets]);

  // Merge live database stations with fallback defaults
  const allStationsList: DVLAStationMeta[] = useMemo(() => {
    if (dbStations && dbStations.length > 0) {
      return dbStations.map((s: any) => {
        const lat = s.latitude ? parseFloat(s.latitude) : 5.6037;
        const lng = s.longitude ? parseFloat(s.longitude) : -0.1870;
        const isHq = s.name.toLowerCase().includes('head office') || s.code === 'HQ-CAN';

        return {
          id: `sta-${s.id}`,
          name: s.name,
          code: s.code || `STA-${s.id}`,
          region: normalizeRegionName(s.regionName || ''),
          city: s.city || (s.regionName ? `${s.regionName} District` : 'Ghana'),
          lat,
          lng,
          isHq,
          address: s.address || `${s.name}, ${s.regionName || ''}`,
          phone: s.phone || '+233 302 766 857',
        };
      });
    }
    return DVLA_STATIONS;
  }, [dbStations]);

  // Group assets by region
  const regionalAssetStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; stations: number; fleet: number; maintenance: number }
    > = {};

    allStationsList.forEach((sta) => {
      const reg = sta.region;
      if (!stats[reg]) {
        stats[reg] = { total: 0, stations: 0, fleet: 0, maintenance: 0 };
      }
      stats[reg].stations++;
      const sStats = stationAssetStats[sta.name];
      if (sStats) {
        stats[reg].total += sStats.total;
        stats[reg].fleet += sStats.fleet;
        stats[reg].maintenance += sStats.maintenance;
      }
    });

    return stats;
  }, [allStationsList, stationAssetStats]);

  // Filter stations according to search & filter mode
  const displayedStations = useMemo(() => {
    return allStationsList.filter((s) => {
      const stats = stationAssetStats[s.name] || { total: 0, fleet: 0 };

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Region filter
      if (selectedRegion && s.region !== selectedRegion) {
        return false;
      }

      // Mode filter
      if (filterMode === 'high_density' && stats.total < 10) return false;
      if (filterMode === 'fleet' && stats.fleet < 1) return false;

      return true;
    });
  }, [allStationsList, searchQuery, selectedRegion, filterMode, stationAssetStats]);

  // Initialize Leaflet Map (Safe on client)
  useEffect(() => {
    let isCancelled = false;
    let activeTileLayer: any = null;

    async function setupMap() {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return; // Already initialized

      const L = (await import('leaflet')).default;
      if (isCancelled || !mapContainerRef.current) return;
      LRef.current = L;

      // Create Leaflet instance bounded to Ghana
      const map = L.map(mapContainerRef.current, {
        center: [7.9465, -1.0232],
        zoom: 7,
        minZoom: 6,
        maxZoom: 16,
        maxBounds: [
          [4.0, -4.5], // Expanded bounding pan limits
          [12.0, 2.0],
        ],
        maxBoundsViscosity: 0.8,
        zoomControl: false, // Custom controls
      });
      mapRef.current = map;

      // Add Clean Base Tile Layer (Watermark-Free)
      const cfg = TILE_LAYERS[baseLayerType];
      activeTileLayer = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      }).addTo(map);

      if (cfg.refUrl) {
        L.tileLayer(cfg.refUrl, {
          maxZoom: cfg.maxZoom,
        }).addTo(map);
      }

      // Create Marker Cluster / Feature Group
      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      // Load Official Ghana 16 Regions GeoJSON
      try {
        const response = await fetch('/data/ghana-regions.json');
        if (response.ok) {
          const geoData = await response.json();
          if (isCancelled || !mapRef.current) return;

          const geoLayer = L.geoJSON(geoData, {
            style: (feature) => {
              const regName = normalizeRegionName(feature?.properties?.shapeName || '');
              const isSelected = selectedRegion === regName;
              return {
                color: isSelected ? '#f59e0b' : '#38bdf8',
                weight: isSelected ? 3 : 1.5,
                opacity: isSelected ? 1 : 0.65,
                fillColor: isSelected ? '#f59e0b' : '#0369a1',
                fillOpacity: isSelected ? 0.35 : 0.12,
                dashArray: isSelected ? undefined : '4, 4',
              };
            },
            onEachFeature: (feature, layer) => {
              const rawName = feature?.properties?.shapeName || '';
              const regName = normalizeRegionName(rawName);

              // Tooltip on hover
              const stats = regionalAssetStats[regName] || { total: 0, stations: 0 };
              layer.bindTooltip(
                `<div class="text-xs font-sans px-1 py-0.5">
                  <div class="font-bold text-amber-300">${regName} Region</div>
                  <div class="text-[10px] text-slate-300 font-mono mt-0.5">
                    ${stats.total} Assets &bull; ${stats.stations} DVLA Stations
                  </div>
                </div>`,
                {
                  sticky: true,
                  className: 'bg-slate-900/95 border border-slate-700 text-slate-100 shadow-xl rounded-md px-2 py-1',
                }
              );

              layer.on({
                mouseover: (e: any) => {
                  setHoveredRegion(regName);
                  const l = e.target;
                  l.setStyle({
                    weight: 2.5,
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.25,
                  });
                },
                mouseout: (e: any) => {
                  setHoveredRegion(null);
                  if (geoJsonLayerRef.current) {
                    geoJsonLayerRef.current.resetStyle(e.target);
                  }
                },
                click: (e: any) => {
                  L.DomEvent.stopPropagation(e);
                  handleSelectRegion(regName, (layer as any).getBounds());
                },
              });
            },
          }).addTo(map);

          geoJsonLayerRef.current = geoLayer;
        }
      } catch (err) {
        console.error('Failed to load Ghana GeoJSON:', err);
      }

      setMapReady(true);
    }

    setupMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when user switches baseLayerType
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    // Remove existing tile layer
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new selected layer(s) without watermarks
    const cfg = TILE_LAYERS[baseLayerType];
    const newBase = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    newBase.addTo(map);
    newBase.bringToBack();

    if (cfg.refUrl) {
      const newRef = L.tileLayer(cfg.refUrl, {
        maxZoom: cfg.maxZoom,
      });
      newRef.addTo(map);
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.bringToFront();
      }
    }
  }, [baseLayerType]);

  // Re-style GeoJSON when selection changes
  useEffect(() => {
    if (!geoJsonLayerRef.current) return;
    geoJsonLayerRef.current.setStyle((feature: any) => {
      const regName = normalizeRegionName(feature?.properties?.shapeName || '');
      const isSelected = selectedRegion === regName;
      return {
        color: isSelected ? '#f59e0b' : '#38bdf8',
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.65,
        fillColor: isSelected ? '#f59e0b' : '#0369a1',
        fillOpacity: isSelected ? 0.35 : 0.12,
        dashArray: isSelected ? undefined : '4, 4',
      };
    });
  }, [selectedRegion]);

  // Update Station Markers when displayedStations or selectedStation changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !LRef.current || !mapReady) return;
    const L = LRef.current;
    const markersGroup = markersLayerRef.current;

    // Clear existing station markers
    markersGroup.clearLayers();

    displayedStations.forEach((station) => {
      // Custom Authentic Teardrop Map Pinpoint Icon
      const isHq = station.isHq;
      const isSelected = selectedStation?.id === station.id;
      const stats = stationAssetStats[station.name] || { total: 0, fleet: 0 };

      const pinWidth = isHq ? 38 : isSelected ? 36 : 28;
      const pinHeight = Math.round(pinWidth * 1.3);

      const pinFill = isHq
        ? '#f59e0b'
        : isSelected
        ? '#0284c7'
        : '#0f172a';

      const pinStroke = isHq
        ? '#fbbf24'
        : isSelected
        ? '#38bdf8'
        : '#10b981';

      const radarColor = isHq ? '#f59e0b' : isSelected ? '#38bdf8' : '#10b981';

      const htmlContent = `
        <div class="relative flex flex-col items-center justify-end w-full h-full cursor-pointer group transition-transform duration-300 hover:scale-125 ${
          isSelected ? 'scale-125 z-50' : 'z-20'
        }" style="width: ${pinWidth}px; height: ${pinHeight + 8}px;">
          
          <!-- Ground Radar Pulse under pinpoint tip -->
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none" style="width: 22px; height: 10px;">
            <span class="absolute inline-flex w-full h-full rounded-full opacity-70 animate-ping" style="background-color: ${radarColor};"></span>
            <span class="relative inline-flex w-2.5 h-1.5 rounded-full bg-slate-950/80"></span>
          </div>

          <!-- Teardrop Pin Point Body -->
          <div class="relative flex items-center justify-center drop-shadow-[0_8px_14px_rgba(0,0,0,0.8)]" style="width: ${pinWidth}px; height: ${pinHeight}px; margin-bottom: 4px;">
            <svg viewBox="0 0 32 42" class="w-full h-full overflow-visible">
              <path 
                d="M16 0C7.16 0 0 7.16 0 16c0 11.2 14.1 24.6 15.2 25.6a1.2 1.2 0 0 0 1.6 0C17.9 40.6 32 27.2 32 16 32 7.16 24.84 0 16 0z" 
                fill="${pinFill}" 
                stroke="${pinStroke}" 
                stroke-width="${isSelected || isHq ? '2' : '1.5'}"
              />
              <circle cx="16" cy="15" r="10.5" fill="#020617" stroke="${pinStroke}" stroke-width="1.2" />
            </svg>

            <!-- Pin Point Head Content -->
            <div class="absolute top-[3px] left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full overflow-hidden bg-slate-950" style="width: ${pinWidth * 0.65}px; height: ${pinWidth * 0.65}px;">
              ${
                isHq
                  ? `<img src="/logo.png" alt="DVLA Crest" class="w-full h-full object-contain p-0.5" />`
                  : `<span class="text-[10px] font-black leading-none ${
                      isSelected ? 'text-sky-300' : 'text-emerald-400'
                    } font-mono tracking-tighter">${stats.total > 99 ? '99+' : stats.total}</span>`
              }
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'dvla-pinpoint-marker',
        html: htmlContent,
        iconSize: [pinWidth, pinHeight + 8],
        iconAnchor: [pinWidth / 2, pinHeight + 4],
        popupAnchor: [0, -(pinHeight + 6)],
        tooltipAnchor: [0, -(pinHeight + 6)],
      });

      const marker = L.marker([station.lat, station.lng], { icon: customIcon });

      // Click Marker -> fly camera and open inspector
      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        handleSelectStation(station);
      });

      // Marker Tooltip
      marker.bindTooltip(
        `<div class="text-xs font-sans px-1 py-0.5">
          <div class="font-bold text-white flex items-center space-x-1">
            <span>${station.name}</span>
            ${isHq ? '<span class="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded">HQ</span>' : ''}
          </div>
          <div class="text-[10px] text-emerald-400 font-mono mt-0.5">
            ${stats.total} Total Assets &bull; ${stats.fleet} Vehicles
          </div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -(pinHeight + 6)],
          className: 'bg-slate-900 border border-slate-700 text-slate-100 shadow-xl rounded-md px-2 py-1',
        }
      );

      markersGroup.addLayer(marker);
    });
  }, [displayedStations, selectedStation, stationAssetStats, mapReady]);

  // Handler: Select Region
  const handleSelectRegion = (regionName: string | null, bounds?: any) => {
    setSelectedRegion(regionName);
    setSelectedStation(null);
    if (onSelectRegion) onSelectRegion(regionName);

    if (mapRef.current && regionName) {
      if (bounds) {
        mapRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          duration: 1.2,
          maxZoom: 10,
        });
      } else if (geoJsonLayerRef.current) {
        // Find bounds from geoJsonLayer
        geoJsonLayerRef.current.eachLayer((layer: any) => {
          const raw = layer.feature?.properties?.shapeName || '';
          if (normalizeRegionName(raw) === regionName) {
            mapRef.current.flyToBounds(layer.getBounds(), {
              padding: [60, 60],
              duration: 1.2,
              maxZoom: 10,
            });
          }
        });
      }
    }
  };

  // Handler: Select Station
  const handleSelectStation = (station: DVLAStationMeta) => {
    setSelectedStation(station);
    setSelectedRegion(station.region);
    if (onSelectStation) onSelectStation(station.name);
    if (onSelectRegion) onSelectRegion(station.region);

    if (mapRef.current) {
      mapRef.current.flyTo([station.lat, station.lng], 13, {
        duration: 1.2,
      });
    }
  };

  // Reset to full view of Ghana
  const handleResetView = () => {
    setSelectedRegion(null);
    setSelectedStation(null);
    if (onSelectRegion) onSelectRegion(null);
    if (onSelectStation) onSelectStation(null);

    if (mapRef.current) {
      mapRef.current.flyToBounds(GHANA_BOUNDS, {
        padding: [30, 30],
        duration: 1.2,
      });
    }
  };

  // Manual Zoom Controls
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const activeStationStats = selectedStation
    ? stationAssetStats[selectedStation.name] || { total: 0, inService: 0, maintenance: 0, missing: 0, fleet: 0 }
    : null;

  const activeRegionStats = selectedRegion
    ? regionalAssetStats[selectedRegion] || { total: 0, stations: 0, fleet: 0, maintenance: 0 }
    : null;

  return (
    <div className="space-y-4">
      {/* Top Filter & Frame Control Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
        {/* Left: Quick Region Zoom Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search station, city, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <Select
            value={selectedRegion || 'all'}
            onValueChange={(val) => {
              if (val === 'all') handleResetView();
              else handleSelectRegion(val);
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs bg-slate-950 border-slate-700 text-white">
              <SelectValue placeholder="Fly to Region" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs max-h-64">
              <SelectItem value="all">National (All 16 Regions)</SelectItem>
              <SelectItem value="Greater Accra">Greater Accra (GAR)</SelectItem>
              <SelectItem value="Ashanti">Ashanti (ASH)</SelectItem>
              <SelectItem value="Western">Western (WES)</SelectItem>
              <SelectItem value="Eastern">Eastern (EAS)</SelectItem>
              <SelectItem value="Central">Central (CEN)</SelectItem>
              <SelectItem value="Northern">Northern (NOR)</SelectItem>
              <SelectItem value="Volta">Volta (VOL)</SelectItem>
              <SelectItem value="Bono">Bono (BON)</SelectItem>
              <SelectItem value="Bono East">Bono East (BOE)</SelectItem>
              <SelectItem value="Ahafo">Ahafo (AHA)</SelectItem>
              <SelectItem value="Western North">Western North (WNR)</SelectItem>
              <SelectItem value="Oti">Oti (OTI)</SelectItem>
              <SelectItem value="Savannah">Savannah (SAV)</SelectItem>
              <SelectItem value="North East">North East (NER)</SelectItem>
              <SelectItem value="Upper East">Upper East (UER)</SelectItem>
              <SelectItem value="Upper West">Upper West (UWR)</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter density pills */}
          <div className="flex items-center space-x-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Hubs ({allStationsList.length})
            </button>
            <button
              onClick={() => setFilterMode('high_density')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterMode === 'high_density'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              High Density
            </button>
            <button
              onClick={() => setFilterMode('fleet')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterMode === 'fleet'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fleet Hubs
            </button>
          </div>
        </div>

        {/* Right: Base Layer Switcher & Reset Camera */}
        <div className="flex items-center space-x-2">
          {/* Base Layer Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setBaseLayerType('dark')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                baseLayerType === 'dark'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark GIS
            </button>
            <button
              onClick={() => setBaseLayerType('satellite')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                baseLayerType === 'satellite'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseLayerType('streets')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                baseLayerType === 'streets'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetView}
            className="text-xs h-7.5 border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-400" />
            <span>Full Ghana</span>
          </Button>
        </div>
      </div>

      {/* Main Map Frame + Right Inspector HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Viewport Area (Col span 3) */}
        <div className="lg:col-span-3 relative h-[650px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Leaflet Mount Container */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Float HUD: Zoom Controls */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg shadow-xl backdrop-blur-md">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-[1px] bg-slate-800 my-0.5" />
            <button
              onClick={handleResetView}
              title="Reset Frame"
              className="p-1.5 rounded hover:bg-slate-800 text-amber-400 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Float HUD: Active Region Pill / Radar Status */}
          <div className="absolute top-4 left-4 z-[400] flex items-center space-x-2.5 bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md">
            <img src="/logo.png" alt="DVLA Logo" className="w-5 h-5 object-contain shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 font-mono text-[10px] block leading-none">DVLA RADAR:</span>
              <span className="font-semibold text-white">
                {selectedStation
                  ? selectedStation.name
                  : selectedRegion
                  ? `${selectedRegion} Region`
                  : 'National Ghana Overview'}
              </span>
            </div>
            {hoveredRegion && hoveredRegion !== selectedRegion && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                Hovering: {hoveredRegion}
              </Badge>
            )}
          </div>

          {/* Float HUD: Legend (Bottom-Left) */}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] text-slate-300 space-y-1.5 hidden sm:block">
            <div className="font-bold text-white text-[10px] tracking-wider uppercase flex items-center space-x-1.5">
              <img src="/logo.png" alt="DVLA Logo" className="w-3.5 h-3.5 object-contain" />
              <span>Real GIS Radar Overlay</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <img src="/logo.png" alt="DVLA Logo" className="w-3.5 h-3.5 object-contain" />
              </div>
              <span>DVLA Headquarters (Cantonments Pin)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center text-emerald-400">
                <svg viewBox="0 0 32 42" className="w-3.5 h-4">
                  <path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 14.1 24.6 15.2 25.6a1.2 1.2 0 0 0 1.6 0C17.9 40.6 32 27.2 32 16 32 7.16 24.84 0 16 0z" fill="#0f172a" stroke="#10b981" strokeWidth="2.5"/>
                  <circle cx="16" cy="15" r="7" fill="#10b981"/>
                </svg>
              </div>
              <span>Regional & District Station Pins</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-0.5 bg-sky-400 border-dashed border-t border-sky-400"></span>
              <span>16 Official Regional Boundaries</span>
            </div>
          </div>
        </div>

        {/* Right Inspector Drawer (Col span 1) */}
        <div className="lg:col-span-1 space-y-3">
          {/* Station or Region Inspector Card */}
          <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src="/logo.png" alt="DVLA Logo" className="w-5 h-5 object-contain shrink-0" />
                  <Badge variant={selectedStation?.isHq ? 'gold' : 'success'} className="text-[10px]">
                    {selectedStation ? (selectedStation.isHq ? 'National HQ' : 'Station Radar') : 'Region Radar'}
                  </Badge>
                </div>
                {selectedStation && (
                  <span className="text-[10px] font-mono text-slate-400">{selectedStation.code}</span>
                )}
              </div>
              <CardTitle className="text-base text-white font-bold mt-1.5">
                {selectedStation ? selectedStation.name : selectedRegion ? `${selectedRegion} Region` : 'DVLA Ghana National'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {selectedStation
                  ? selectedStation.city
                  : selectedRegion
                  ? 'Regional Directorate Inventory Overview'
                  : 'Total National Authority Distribution'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 pb-4 space-y-3.5">
              {/* Asset Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Active Assets</span>
                  <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                    {selectedStation
                      ? activeStationStats?.total || 0
                      : selectedRegion
                      ? activeRegionStats?.total || 0
                      : assets.filter((a) => a.status !== 'Disposed').length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">In Service</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                    {selectedStation
                      ? activeStationStats?.inService || 0
                      : assets.filter((a) => a.status === 'In Service').length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Maintenance</span>
                  <span className="text-lg font-bold font-mono text-amber-500 mt-0.5 block">
                    {selectedStation
                      ? activeStationStats?.maintenance || 0
                      : selectedRegion
                      ? activeRegionStats?.maintenance || 0
                      : assets.filter((a) => a.status === 'In Maintenance').length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Fleet Vehicles</span>
                  <span className="text-lg font-bold font-mono text-teal-400 mt-0.5 block">
                    {selectedStation
                      ? activeStationStats?.fleet || 0
                      : selectedRegion
                      ? activeRegionStats?.fleet || 0
                      : assets.filter((a) => a.categoryName === 'Vehicles').length}
                  </span>
                </div>
              </div>

              {/* Station Specific Details */}
              {selectedStation && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Address</span>
                    <p className="text-slate-300 mt-0.5 leading-snug">{selectedStation.address}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Contact Phone</span>
                    <p className="text-slate-300 font-mono mt-0.5">{selectedStation.phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Coordinates</span>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {selectedStation.lat.toFixed(4)}° N, {selectedStation.lng.toFixed(4)}° W
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/assets?search=${encodeURIComponent(selectedStation.name)}`}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg"
                    >
                      <span>View Station Assets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Station Jump List for Selected Region */}
              {selectedRegion && !selectedStation && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Stations in {selectedRegion}
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {allStationsList.filter((s) => s.region === selectedRegion).map((s) => {
                      const count = stationAssetStats[s.name]?.total || 0;
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectStation(s)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-left text-xs transition-colors group"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-white group-hover:text-amber-400 truncate block">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{s.city}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                            {count} assets
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* When no station and no region selected */}
              {!selectedRegion && !selectedStation && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-start space-x-2">
                    <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      Click on any region polygon to smoothly zoom into its territorial boundaries.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      Click any radar station node to inspect its active inventory and jump into registry records.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Region Selector Pills */}
          <Card className="bg-slate-900/90 border-slate-800 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
              National Directorate Quick Jump
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { name: 'Greater Accra', code: 'GAR' },
                { name: 'Ashanti', code: 'ASH' },
                { name: 'Western', code: 'WES' },
                { name: 'Eastern', code: 'EAS' },
                { name: 'Central', code: 'CEN' },
                { name: 'Northern', code: 'NOR' },
                { name: 'Volta', code: 'VOL' },
                { name: 'Bono', code: 'BON' },
              ].map((r) => (
                <button
                  key={r.code}
                  onClick={() => handleSelectRegion(r.name)}
                  className={`px-2 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all flex items-center justify-between ${
                    selectedRegion === r.name
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{r.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">{r.code}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
