'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function EmsAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ems_token') || localStorage.getItem('dams_token');
    if (!token && !isLoginPage) {
      setAuthed(false);
      router.replace('/login');
    } else {
      setAuthed(!!token);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authed) {
    return null;
  }

  return <>{children}</>;
}
