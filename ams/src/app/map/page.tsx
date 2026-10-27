'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, MapPin, Grid, BarChart } from 'lucide-react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

export default function AssetMapPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllAssets = async () => {
      try {
        // Fetch up to 2000 assets to build regional map
        const res = await api.getAssets({ limit: 2000 });
        setAssets(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load assets for map view.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllAssets();
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

  // Group assets for Treemap:
  // Format: { name: 'Region', children: [ { name: 'Station', value: count } ] }
  const regionalGroups: Record<string, Record<string, number>> = {};
  assets.forEach((asset) => {
    const reg = asset.regionName || 'Unknown Region';
    const sta = asset.stationName || 'Unknown Station';
    if (asset.status === 'Disposed') return; // Do not map disposed assets

    if (!regionalGroups[reg]) {
      regionalGroups[reg] = {};
    }
    regionalGroups[reg][sta] = (regionalGroups[reg][sta] || 0) + 1;
  });

  // Treemap data format
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

  // Selected region data for drill down
  const selectedRegionData = activeRegion
    ? regionalGroups[activeRegion]
      ? Object.keys(regionalGroups[activeRegion]).map((staName) => ({
          name: staName,
          value: regionalGroups[activeRegion][staName],
        }))
      : []
    : [];

  const COLORS = ['#00966c', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

  // Custom Treemap Content Renderer to make it look premium
  const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, colors, name } = props;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-2">
            <MapPin className="w-8 h-8 text-amber-500" />
            <span>Regional Asset Map</span>
          </h1>
          <p className="text-sm text-slate-400">
            Hierarchical density map of physical assets across all DVLA Regions and Stations
          </p>
        </div>
        {activeRegion && (
          <button
            onClick={() => setActiveRegion(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
          >
            Reset to All Regions
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treemap Visualization Box (2/3 width) */}
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 flex flex-col min-h-[500px]">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {activeRegion ? `${activeRegion} Station Distribution` : 'DVLA Ghana National Asset Density'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeRegion
                ? 'Displaying active stations within region, sized by total assets.'
                : 'Displaying regions. Click a region card on the side panel to drill down into station sub-blocks.'}
            </p>
          </div>

          <div className="flex-1 min-h-[350px] bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden p-4 relative">
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

        {/* Sidebar drilldown control (1/3 width) */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center space-x-2">
              <Grid className="w-4 h-4 text-amber-500" />
              <span>Filter Region Details</span>
            </h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {fullTreemapData.map((reg, idx) => (
                <button
                  key={reg.name}
                  onClick={() => setActiveRegion(activeRegion === reg.name ? null : reg.name)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all group ${
                    activeRegion === reg.name
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold shadow-md'
                      : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold uppercase block truncate">{reg.name}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5 block">
                      {reg.children?.length || 0} active stations
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                      activeRegion === reg.name
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {reg.value}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Helper stats card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center space-x-2">
              <BarChart className="w-4 h-4 text-emerald-500" />
              <span>Map Key & Insights</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
              <p>
                🏢 **Sizing**: Larger block sizes indicate a higher concentration of inventory assets in that region or station.
              </p>
              <p>
                🎨 **Colors**: Color variations distinguish different regions. In station drill down, they identify individual stations.
              </p>
              <p>
                📊 **Total Mapped Assets**: <span className="font-bold text-white">{assets.filter(a => a.status !== 'Disposed').length}</span> active assets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
