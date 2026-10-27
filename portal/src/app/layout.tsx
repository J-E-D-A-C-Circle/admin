import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVLA Central Enterprise Gateway | AMS, EMS & Fleet",
  description: "Official Driver and Vehicle Licensing Authority Central Enterprise Access Portal",
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
