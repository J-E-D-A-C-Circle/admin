'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', title, message, duration: 6000 }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', title, message, duration: 5000 }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          let iconColor = 'text-blue-600';
          let borderAccent = 'border-l-4 border-l-blue-600';
          let Icon = Info;

          if (isSuccess) {
            iconColor = 'text-emerald-600';
            borderAccent = 'border-l-4 border-l-emerald-600';
            Icon = CheckCircle2;
          } else if (isError) {
            iconColor = 'text-rose-600';
            borderAccent = 'border-l-4 border-l-rose-600';
            Icon = AlertCircle;
          } else if (isWarning) {
            iconColor = 'text-amber-600';
            borderAccent = 'border-l-4 border-l-amber-600';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start p-3.5 rounded-2xl border border-zinc-200/90 ${borderAccent} bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in`}
            >
              <Icon className={`w-4.5 h-4.5 ${iconColor} flex-shrink-0 mt-0.5 mr-3`} />
              <div className="flex-1 min-w-0 pr-2">
                {toast.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs font-medium text-zinc-600 leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
