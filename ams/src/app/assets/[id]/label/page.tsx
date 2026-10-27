'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AssetLabelPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.getAsset(id)
        .then((res) => {
          setAsset(res);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Failed to fetch asset.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <p className="text-red-400 font-semibold">{error || 'Asset not found'}</p>
        <button
          onClick={() => router.push('/assets')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Control Panel (Hidden during printing) */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => window.close()}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Close Tab</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors shadow-lg"
        >
          <Printer className="w-4 h-4" />
          <span>Print Label</span>
        </button>
      </div>

      {/* Label Container */}
      <div className="w-[400px] h-[240px] bg-white text-slate-900 border border-slate-300 rounded-lg p-5 shadow-2xl flex flex-col justify-between font-sans relative print:shadow-none print:border-none print:m-0 print:w-[4in] print:h-[2.4in]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-300 pb-2">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="DVLA Logo" className="w-7 h-7 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider text-slate-800 leading-none">DVLA DAMS</span>
              <span className="text-[7px] text-slate-500 font-bold tracking-widest leading-none uppercase mt-0.5">Asset Control Label</span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase">
            {asset.categoryName}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex items-center justify-between py-3 space-x-4">
          {/* QR Code Container */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200/60 flex items-center justify-center flex-shrink-0 shadow-sm">
            <QRCodeSVG
              value={typeof window !== 'undefined' ? `${window.location.origin}/assets/${asset.assetId}` : asset.assetId}
              size={85}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5 self-center">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Asset ID</p>
              <p className="text-xs font-mono font-black text-slate-900 leading-tight tracking-tight mt-0.5">{asset.assetId}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Description</p>
              <p className="text-[10px] font-bold text-slate-800 truncate leading-none mt-0.5">{asset.name}</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">{asset.brand} {asset.model}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">Serial No</p>
                <p className="text-[9px] font-mono text-slate-800 truncate mt-0.5">{asset.serialNumber}</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">Location</p>
                <p className="text-[9px] font-bold text-slate-800 truncate mt-0.5">{asset.stationName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[8px] text-slate-500">
          <span>Property of DVLA Ghana</span>
          <span className="font-mono">{new Date(asset.acquisitionDate).toLocaleDateString('en-GB')}</span>
        </div>
      </div>

      {/* CSS overrides for print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: none !important;
            padding: 0 !important;
          }
        }
      ` }} />
    </div>
  );
}
