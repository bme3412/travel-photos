// src/app/not-found.js
import Link from 'next/link';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-3">404</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Off the map</h1>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-6">
        This page isn&apos;t in the journal
      </p>
      <Link
        href="/"
        className="text-[11px] uppercase tracking-[0.2em] text-ink/70 border-b border-ink/20 pb-1
                   hover:border-accent hover:text-ink transition-colors duration-300"
      >
        Back to the collection
      </Link>
    </div>
  );
}
