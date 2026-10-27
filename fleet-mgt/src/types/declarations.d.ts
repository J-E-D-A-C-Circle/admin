declare module 'next/navigation' {
  export function usePathname(): string;
  export function useSearchParams(): {
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    forEach(
      callbackfn: (value: string, key: string, parent: any) => void,
      thisArg?: any
    ): void;
  };
  export function useRouter(): {
    push(href: string, options?: { scroll?: boolean }): void;
    replace(href: string, options?: { scroll?: boolean }): void;
    forward(): void;
    back(): void;
    prefetch(href: string, options?: { intent?: 'light' | 'full' }): void;
    refresh(): void;
  };
}

declare module 'next/link' {
  import React from 'react';
  
  export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string | { pathname?: string; query?: any };
    as?: string | { pathname?: string; query?: any };
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
  }
  
  const Link: React.ComponentType<LinkProps>;
  export default Link;
}
