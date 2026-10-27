'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  forceLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onForceConfirm?: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  forceLabel = 'Force Delete & Reassign',
  isDestructive = true,
  loading = false,
  onConfirm,
  onForceConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${isDestructive ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20'}`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-600 font-medium leading-relaxed">{message}</p>

          <div className="flex items-center justify-end space-x-2 pt-2 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {cancelLabel}
            </button>
            {onForceConfirm && (
              <button
                type="button"
                onClick={onForceConfirm}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Processing...' : forceLabel}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Processing...' : confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
