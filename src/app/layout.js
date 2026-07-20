import './globals.css';
import Link from 'next/link';
import { Fraunces, Archivo } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bme-travel-photos.vercel.app'),
  title: {
    default: 'Copy This Trip — Make a real trip yours',
    template: '%s',
  },
  description:
    'Choose a trip that really happened, keep what you love, and turn it into a personalized itinerary grounded in the original journey.',
  openGraph: {
    type: 'website',
    siteName: 'Copy This Trip',
    title: 'Copy This Trip — Make a real trip yours',
    description:
      'Choose a real trip, keep what you love, and make a grounded itinerary of your own.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Copy This Trip — Make a real trip yours',
    description:
      'Choose a real trip, keep what you love, and make a grounded itinerary of your own.',
  },
};

const NAV_LINKS = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/trips', label: 'Original Trips' },
  { href: '/map', label: 'Travel Map' },
  { href: '/photo-of-the-day', label: 'Photo of the Day' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-ink/10 print:hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-y-2 py-3 md:py-0 md:h-16">
              <Link href="/" className="group flex items-baseline gap-3 min-w-0">
                <span className="font-display text-xl sm:text-2xl tracking-tight whitespace-nowrap group-hover:text-accent transition-colors duration-300">
                  Copy This Trip
                </span>
                <span className="hidden lg:inline text-[10px] uppercase tracking-[0.3em] text-muted">
                  Real journeys, remade for you
                </span>
              </Link>

              <nav className="flex items-center gap-4 sm:gap-7 text-[11px] uppercase tracking-[0.18em]">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="relative text-ink/60 hover:text-ink transition-colors duration-200
                               after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent
                               after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
                  >
                    {label}
                  </Link>
                ))}
                {/* Local authoring tool — never rendered in the production build */}
                {process.env.NODE_ENV !== 'production' && (
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 text-accent
                               px-2.5 py-1 hover:bg-accent hover:text-paper transition-colors duration-200 whitespace-nowrap"
                  >
                    Studio
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t border-ink/10">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-muted">
            <span>© {new Date().getFullYear()} Copy This Trip</span>
            <span>Every itinerary starts with a trip that happened</span>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
