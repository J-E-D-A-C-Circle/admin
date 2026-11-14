'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, AlertCircle, ArrowRight } from 'lucide-react';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

function extractAssetId(decodedText: string): string | null {
  const trimmed = decodedText.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/assets\/([^/?#]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  } catch {
    // Fallback to path/raw ID parsing
  }

  const pathMatch = trimmed.match(/\/assets\/([^/?#]+)/i);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);

  return trimmed;
}

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const regionId = 'ams-qr-reader-region';

    const stopScanner = async () => {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (!instance) return;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch {
        // Ignore cleanup errors if scanner already stopped
      }
    };

    const startScanner = async () => {
      setCameraError('');
      // Wait a tick for the modal DOM container to mount
      await new Promise((r) => setTimeout(r, 80));
      if (cancelled) return;

      try {
        const html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async (decodedText) => {
            const assetId = extractAssetId(decodedText);
            if (!assetId) return;
            await stopScanner();
            onClose();
            router.push(`/assets/${encodeURIComponent(assetId)}`);
          },
          () => {
            // Ignore per-frame decode misses
          }
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to access camera. Check browser permissions or enter the Asset ID below.';
        setCameraError(message);
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, onClose, router]);

  if (!open || typeof document === 'undefined') return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetId = extractAssetId(manualId);
    if (!assetId) return;
    onClose();
    router.push(`/assets/${encodeURIComponent(assetId)}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Scan Asset QR Sticker</h3>
              <p className="text-[11px] text-slate-400">
                Point your camera at a DVLA asset label to open it immediately
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close QR scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center">
            <div id="ams-qr-reader-region" className="w-full" />
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-xs font-medium text-slate-200">Camera Unavailable</p>
                <p className="text-[11px] text-slate-400 max-w-xs">{cameraError}</p>
              </div>
            )}
            {!cameraError && (
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[10px] text-slate-300">
                <Camera className="w-3 h-3 text-amber-400" />
                <span>Align QR code inside frame</span>
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-slate-800">
            <label className="block text-[11px] font-medium text-slate-400">
              Or enter / paste Asset ID directly
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. DVLA-IT-000001"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors"
              >
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

