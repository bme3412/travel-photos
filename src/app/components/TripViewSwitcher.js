'use client';

import Link from 'next/link';

// The persistent per-trip view control: Replay · Story · Photos. Rendered in
// the same top-right position on all three trip views so switching feels like
// staying in one place. `variant="light"` sits on paper (album masthead);
// the default sits on photography/dark heroes.
const VIEWS = [
  { key: 'replay', label: 'Replay', href: (id) => `/trips/${id}` },
  { key: 'story', label: 'Story', href: (id) => `/journal/${id}` },
  { key: 'photos', label: 'Photos', href: (id) => `/albums/${id}` },
];

export default function TripViewSwitcher({ tripId, active, variant = 'dark' }) {
  const light = variant === 'light';
  return (
    <nav
      aria-label="Trip views"
      className={`pointer-events-auto inline-flex items-center rounded-full p-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm ${
        light ? 'bg-ink/5 ring-1 ring-ink/10' : 'bg-paper/90 shadow-sm'
      }`}
    >
      {VIEWS.map((view) =>
        view.key === active ? (
          <span key={view.key} aria-current="page" className="rounded-full bg-ink px-3.5 py-1.5 text-paper">
            {view.label}
          </span>
        ) : (
          <Link
            key={view.key}
            href={view.href(tripId)}
            className="rounded-full px-3.5 py-1.5 text-ink/60 transition-colors hover:text-ink"
          >
            {view.label}
          </Link>
        )
      )}
    </nav>
  );
}
