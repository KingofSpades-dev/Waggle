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
  themeColor: '#273869',
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
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,400..700&family=Playfair+Display:ital,wght@1,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet" />
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
