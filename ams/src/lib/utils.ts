import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function calcDepreciation(
  purchaseValueStr: string | null | undefined,
  acquisitionDate: string | Date,
  categoryName: string
) {
  if (!purchaseValueStr) return null;
  const purchaseValue = parseFloat(purchaseValueStr);
  if (isNaN(purchaseValue) || purchaseValue <= 0) return null;

  let ratePercent = 15; // General default
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('vehicle')) {
    ratePercent = 20;
  } else if (cat.includes('it') || cat.includes('computer') || cat.includes('technology') || cat.includes('equipment')) {
    ratePercent = 25;
  } else if (cat.includes('furniture')) {
    ratePercent = 10;
  }

  const yearsInService = Math.max(
    0,
    (new Date().getTime() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const depreciationAmount = purchaseValue * (ratePercent / 100) * yearsInService;
  const bookValue = Math.max(0, purchaseValue - depreciationAmount);

  return {
    purchaseValue,
    yearsInService: parseFloat(yearsInService.toFixed(2)),
    ratePercent,
    depreciationAmount: parseFloat(depreciationAmount.toFixed(2)),
    bookValue: parseFloat(bookValue.toFixed(2)),
  };
}
