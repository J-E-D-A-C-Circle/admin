import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Breadcrumb({ className, ...props }: React.ComponentPropsWithoutRef<'nav'>) {
  return <nav aria-label="breadcrumb" className={cn('flex items-center text-xs', className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.ComponentPropsWithoutRef<'ol'>) {
  return (
    <ol
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-slate-400',
        className
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: React.ComponentPropsWithoutRef<'li'>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

export function BreadcrumbLink({
  href,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'a'> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn('transition-colors hover:text-amber-400 font-medium', className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function BreadcrumbPage({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-semibold text-slate-200', className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('text-slate-600 [&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight className="w-3.5 h-3.5" />}
    </li>
  );
}
