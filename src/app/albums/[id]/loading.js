import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Masthead skeleton */}
      <div className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200 mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            The collection
          </Link>
          <div className="h-11 w-72 max-w-full bg-ink/5 animate-pulse" />
          <div className="h-3 w-44 bg-ink/5 animate-pulse mt-4" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 pt-10">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="relative aspect-[3/2] overflow-hidden bg-ink/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
