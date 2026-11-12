import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import EmsAuthGuard from '@/components/ems/EmsAuthGuard';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DVLA & Ghana Post EMS Tracking & Expenditure Control System',
  description: 'Centralized Postal Dispatch Monitoring, Voucher Verification, and Monthly Return Management for DVLA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className="font-sans bg-zinc-50/80 text-zinc-900 antialiased min-h-screen selection:bg-emerald-500 selection:text-white">
        <ToastProvider>
          <EmsAuthGuard>{children}</EmsAuthGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
