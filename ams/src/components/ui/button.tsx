import * as React from 'react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gold' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-800 border border-slate-700/60 shadow-sm',
      gold: 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 active:bg-amber-600 shadow-md shadow-amber-500/10',
      destructive: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-sm',
      outline: 'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60 hover:text-white',
      secondary: 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 border border-slate-700/40',
      ghost: 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
      link: 'text-amber-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-base',
      icon: 'h-9 w-9 p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
