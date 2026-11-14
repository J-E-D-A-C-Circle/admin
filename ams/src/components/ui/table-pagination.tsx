'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRESET_COUNTS = [20, 50, 70, 100] as const;

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function TablePagination({
  page,
  limit,
  total,
  itemLabel = 'items',
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const isPreset = PRESET_COUNTS.includes(limit as (typeof PRESET_COUNTS)[number]);
  const [customMode, setCustomMode] = useState(!isPreset);
  const [customInput, setCustomInput] = useState(String(limit));
  const showCustom = customMode || !isPreset;

  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);

  const handleSelectChange = (val: string) => {
    if (val === 'custom') {
      setCustomMode(true);
      setCustomInput(String(limit));
      return;
    }
    setCustomMode(false);
    const parsed = Number.parseInt(val, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setCustomInput(String(parsed));
      onLimitChange(parsed);
    }
  };

  const applyCustomLimit = () => {
    const parsed = Number.parseInt(customInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    const clamped = Math.min(1000, parsed);
    setCustomInput(String(clamped));
    onLimitChange(clamped);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/50">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>
          Showing <span className="font-semibold text-slate-200">{startItem}–{endItem}</span> of{' '}
          <span className="font-semibold text-slate-200">{total}</span> {itemLabel}
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span>
          Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalPages}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Rows:</span>
          <Select
            value={showCustom ? 'custom' : String(limit)}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="h-8 w-[105px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_COUNTS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} rows
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>

          {showCustom && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCustomLimit();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="number"
                min={1}
                max={1000}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                aria-label="Custom row count"
                className="h-8 w-20 px-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
              >
                Apply
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="h-8 px-2.5"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="h-8 px-2.5"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
