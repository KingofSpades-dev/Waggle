import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Waggle — where should this launch',
  description: 'Scouting chains and launchpads so creators can see where a token structurally fits.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#7b45d8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <nav>
          <div className="navin">
            <a href="/" className="logo">
              waggle<i></i>
            </a>
            <span className="navlinks">
              <a href="#hours">hours</a>
              <a href="#venues">launchpads</a>
              <a href="#method">method</a>
              <a href="/coverage">coverage</a>
            </span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
