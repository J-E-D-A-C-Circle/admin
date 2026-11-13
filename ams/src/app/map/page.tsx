'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Loader2, MapPin, Grid, BarChart, Compass, Layers, ShieldCheck, Car } from 'lucide-react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const GhanaInteractiveMap = dynamic(
  () => import('@/components/ghana-interactive-map').then((mod) => mod.GhanaInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[650px] w-full bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-slate-400 font-mono">Initializing Real Ghana GIS Radar...</span>
      </div>
    ),
  }
);

export default function AssetMapPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [dbStations, setDbStations] = useState<any[]>([]);
  const [dbRegions, setDbRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'interactive' | 'treemap'>('interactive');

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [assetRes, lookupsRes] = await Promise.all([
          api.getAssets({ limit: 2000 }),
          api.getLookups(),
        ]);
        setAssets(assetRes.data || []);
        if (lookupsRes?.stations) setDbStations(lookupsRes.stations);
        if (lookupsRes?.regions) setDbRegions(lookupsRes.regions);
      } catch (err: any) {
        setError(err.message || 'Failed to load assets for map view.');
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  // Active (non-obsolete) asset stats
  const activeAssets = assets.filter((a) => a.status !== 'Obsolete');
  const fleetCount = activeAssets.filter((a) => a.categoryName === 'Vehicles').length;
  const uniqueStations = new Set(activeAssets.map((a) => a.stationName).filter(Boolean)).size;

  // Group assets for Treemap:
  const regionalGroups: Record<string, Record<string, number>> = {};
  assets.forEach((asset) => {
    const reg = asset.regionName || 'Unknown Region';
    const sta = asset.stationName || 'Unknown Station';
    if (asset.status === 'Obsolete') return;

    if (!regionalGroups[reg]) {
      regionalGroups[reg] = {};
    }
    regionalGroups[reg][sta] = (regionalGroups[reg][sta] || 0) + 1;
  });

  const fullTreemapData = Object.keys(regionalGroups).map((regName) => {
    const stations = Object.keys(regionalGroups[regName]).map((staName) => ({
      name: staName,
      value: regionalGroups[regName][staName],
    }));
    const totalValue = stations.reduce((sum, item) => sum + item.value, 0);
    return {
      name: regName,
      value: totalValue,
      children: stations,
    };
  });

  const selectedRegionData = activeRegion
    ? regionalGroups[activeRegion]
      ? Object.keys(regionalGroups[activeRegion]).map((staName) => ({
          name: staName,
          value: regionalGroups[activeRegion][staName],
        }))
      : []
    : [];

  const COLORS = ['#00966c', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

  const CustomizedContent = (props: any) => {
    const { depth, x, y, width, height, index, colors, name } = props;
    if (width < 30 || height < 20) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 ? colors[index % colors.length] : 'none',
            stroke: '#0f172a',
            strokeWidth: depth < 2 ? 3 : 1,
            strokeOpacity: 1,
          }}
        />
        {width > 60 && height > 25 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 3}
            textAnchor="middle"
            fill="#fff"
            fontSize={depth < 2 ? 12 : 9}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center space-x-2">
              <MapPin className="w-7 h-7 text-amber-500" />
              <span>National Regional Asset Map</span>
            </h1>
            <Badge variant="gold" className="text-xs font-semibold px-2.5 py-0.5">
              16 Regions
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Interactive geographical radar, zoom frame inspector, and asset density across all DVLA operational directorates
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'interactive' ? 'gold' : 'outline'}
            size="sm"
            onClick={() => setViewMode('interactive')}
            className="flex items-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Interactive Ghana Map</span>
          </Button>
          <Button
            variant={viewMode === 'treemap' ? 'gold' : 'outline'}
            size="sm"
            onClick={() => setViewMode('treemap')}
            className="flex items-center space-x-1.5"
          >
            <Grid className="w-4 h-4" />
            <span>Treemap Matrix</span>
          </Button>
        </div>
      </div>

      {/* High-Level Regional Overview KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Mapped Assets</span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block">{activeAssets.length.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400">Live inventory in field</span>
        </Card>
        <Card className="p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Operational Stations</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">{uniqueStations} Hubs</span>
          <span className="text-[10px] text-slate-500">Across 16 regions</span>
        </Card>
        <Card className="p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Fleet Transport</span>
          <span className="text-xl font-bold font-mono text-teal-400 mt-0.5 block">{fleetCount} Units</span>
          <span className="text-[10px] text-teal-500/80">Government vehicles</span>
        </Card>
        <Card className="p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">GIS Mapping Engine</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-0.5 block">Leaflet Radar</span>
          <span className="text-[10px] text-slate-500">Real Ghana GeoJSON</span>
        </Card>
      </div>

      {/* Main View Area */}
      {viewMode === 'interactive' ? (
        <GhanaInteractiveMap
          assets={assets}
          dbStations={dbStations}
          dbRegions={dbRegions}
          onSelectRegion={(reg) => setActiveRegion(reg)}
        />
      ) : (
        /* Hierarchical Treemap Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col min-h-[520px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {activeRegion ? `${activeRegion} Station Matrix` : 'DVLA Ghana National Asset Density'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeRegion
                    ? 'Displaying active stations within region, sized by inventory volume.'
                    : 'Click a regional card to drill down into station proportions.'}
                </p>
              </div>
              {activeRegion && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveRegion(null)}
                  className="text-xs h-7.5"
                >
                  Reset to All Regions
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-[380px] bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden p-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                {activeRegion ? (
                  <Treemap
                    data={selectedRegionData}
                    dataKey="value"
                    stroke="#0f172a"
                    fill="#00966c"
                    content={<CustomizedContent colors={COLORS} />}
                  >
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    />
                  </Treemap>
                ) : (
                  <Treemap
                    data={fullTreemapData}
                    dataKey="value"
                    stroke="#0f172a"
                    fill="#3b82f6"
                    content={<CustomizedContent colors={COLORS} />}
                  >
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    />
                  </Treemap>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-4 bg-slate-900 border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                <Grid className="w-4 h-4 text-amber-500" />
                <span>Regional Directorate Density</span>
              </h3>
              <div className="space-y-2 max-h-[380px] overflow-y-auto mt-3 pr-1">
                {fullTreemapData.map((reg) => (
                  <button
                    key={reg.name}
                    onClick={() => setActiveRegion(activeRegion === reg.name ? null : reg.name)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      activeRegion === reg.name
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase block truncate">{reg.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {reg.children?.length || 0} active stations
                      </span>
                    </div>
                    <Badge variant={activeRegion === reg.name ? 'gold' : 'secondary'} className="text-[10px] font-mono">
                      {reg.value}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
