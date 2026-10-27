'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Printer, ArrowLeft, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintLabelsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 820) {
        // 794px represents 210mm at 96dpi
        setScale((window.innerWidth - 32) / 794);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadPrintAssets = async () => {
      setLoading(true);
      setError('');
      try {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const ids = urlParams.get('ids');
        const search = urlParams.get('search');
        const status = urlParams.get('status');
        const categoryId = urlParams.get('categoryId');
        const regionId = urlParams.get('regionId');
        const stationId = urlParams.get('stationId');
        const limit = urlParams.get('limit') || '1000';

        const fetchParams: any = { limit };
        if (ids) fetchParams.ids = ids;
        if (search) fetchParams.search = search;
        if (status) fetchParams.status = status;
        if (categoryId) fetchParams.categoryId = categoryId;
        if (regionId) fetchParams.regionId = regionId;
        if (stationId) fetchParams.stationId = stationId;

        const res = await api.getAssets(fetchParams);
        setAssets(res.data);
      } catch (err: any) {
        console.error('Error loading assets for bulk printing:', err);
        setError(err.message || 'Failed to load assets for printing.');
      } finally {
        setLoading(false);
      }
    };

    loadPrintAssets();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Generating bulk print layouts...</p>
        </div>
      </div>
    );
  }

  if (error || assets.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white p-4 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold">No Labels to Print</h2>
        <p className="text-slate-400 max-w-md text-sm">
          {error || 'No assets were found matching the selection or active filters.'}
        </p>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-white rounded-lg transition-colors font-semibold text-sm shadow-md"
        >
          Close Page
        </button>
      </div>
    );
  }

  // Group assets into pages of 21 labels (3 columns x 7 rows)
  const labelsPerPage = 21;
  const pages: any[][] = [];
  for (let i = 0; i < assets.length; i += labelsPerPage) {
    pages.push(assets.slice(i, i + labelsPerPage));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4">
      {/* Control Panel (Hidden during printing) */}
      <div className="w-full max-w-5xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg print:hidden text-center sm:text-left">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">Bulk Label Printer</span>
          <span className="text-xs text-slate-400 mt-0.5">
            Loaded {assets.length} labels across {pages.length} sheet{pages.length > 1 ? 's' : ''} (A4 format, 21 per sheet)
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.close()}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-350 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Close Tab</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors text-sm shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheets</span>
          </button>
        </div>
      </div>

      {/* Pages Container with scaling for mobile */}
      <div className="w-full pb-6 print:pb-0 flex justify-center overflow-hidden">
        <div 
          className="flex flex-col items-center gap-8 print:gap-0 print:p-0"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `-${(1 - scale) * (pages.length * 297)}mm` : '0'
          }}
        >
        {pages.map((pageAssets, pageIdx) => (
          <div
            key={pageIdx}
            className="a4-sheet bg-white text-slate-900 p-[10mm] shadow-2xl rounded-lg border border-slate-300 grid grid-cols-3 gap-x-[3mm] gap-y-[2mm] relative box-border print:shadow-none print:border-none print:m-0 print:rounded-none"
            style={{
              width: '210mm',
              height: '297mm',
              gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            {pageAssets.map((asset) => {
              const detailsUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/assets/${asset.assetId}`
                : asset.assetId;

              return (
                <div
                  key={asset.assetId}
                  className="label-card border border-gray-300 p-2.5 rounded-lg flex flex-col justify-between overflow-hidden box-border bg-white text-black"
                  style={{
                    height: '38mm',
                    width: '63mm',
                  }}
                >
                  {/* Label Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <img src="/logo.png" alt="DVLA Logo" className="w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black tracking-wide text-black leading-none">DVLA DAMS</span>
                        <span className="text-[5px] text-gray-500 font-bold tracking-wider leading-none uppercase mt-0.5">Asset Label</span>
                      </div>
                    </div>
                    <span className="text-[6px] font-mono font-bold px-1 bg-gray-100 text-gray-600 rounded border border-gray-200 uppercase max-w-[20mm] truncate">
                      {asset.categoryName}
                    </span>
                  </div>

                  {/* Label Body */}
                  <div className="flex-1 flex items-center justify-between py-1.5 space-x-2 overflow-hidden">
                    {/* QR Code */}
                    <div className="bg-white p-1.5 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <QRCodeSVG
                        value={detailsUrl}
                        size={62}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 min-w-0 space-y-1 self-center">
                      <div>
                        <p className="text-[9px] font-mono font-black text-black leading-none tracking-tight">{asset.assetId}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-gray-900 truncate leading-none" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-[7px] text-gray-600 truncate leading-none">
                          {asset.brand} {asset.model}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-0.5 border-t border-gray-100">
                        <div className="min-w-0">
                          <p className="text-[5px] font-black text-gray-500 uppercase tracking-wider leading-none">Serial No</p>
                          <p className="text-[7px] font-mono text-gray-800 truncate mt-0.5 leading-none">{asset.serialNumber}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[5px] font-black text-gray-500 uppercase tracking-wider leading-none">Station</p>
                          <p className="text-[7px] font-bold text-gray-800 truncate mt-0.5 leading-none">{asset.stationName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Label Footer */}
                  <div className="border-t border-gray-200 pt-1 flex items-center justify-between text-[6px] text-gray-500 flex-shrink-0">
                    <span>Property of DVLA Ghana</span>
                    <span className="font-mono">{new Date(asset.acquisitionDate).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>

      {/* CSS overrides for print layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          margin: 0;
        }
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
          .a4-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
        }
      ` }} />
    </div>
  );
}
