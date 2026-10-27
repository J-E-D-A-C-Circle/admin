import * as React from 'react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'gold';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-slate-800 text-slate-100 hover:bg-slate-700',
    secondary: 'border-transparent bg-slate-800/60 text-slate-300 hover:bg-slate-800',
    destructive: 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20',
    outline: 'border-slate-700 text-slate-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
    gold: 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
