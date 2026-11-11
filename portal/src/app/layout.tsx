import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVLA Central Enterprise Gateway | Republic of Ghana",
  description: "Official Driver and Vehicle Licensing Authority Central Administration Gateway & Enterprise Microservices Hub.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
        {children}
      </body>
    </html>
  );
}
