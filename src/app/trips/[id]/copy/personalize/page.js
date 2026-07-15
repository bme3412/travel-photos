import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import PersonalizeClient from './PersonalizeClient';

// Screen 3 of the copy flow: dates, party, pace, budget, base, transformation
// preferences, and per-experience priorities. The form itself is client-side
// (PersonalizeClient) since everything lives in the persisted copy session.

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) return { title: 'Trip Not Found | Copy This Trip' };
  return { title: `Personalize your version: ${blueprint.destination} | Copy This Trip` };
}

export default async function CopyTripPersonalizePage({ params }) {
  const { id } = await params;
  const blueprint = getTripBlueprint(id);
  if (!blueprint) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-24">
        <div className="flex items-center justify-between">
          <Link
            href={`/trips/${id}/copy/select`}
            className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted
                       hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to selection
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            {blueprint.destination}
          </span>
        </div>

        <header className="mt-12 sm:mt-14">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-4">
            Copy this trip · Step 3 of 3
          </p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.05]">
            Personalize your version
          </h1>
        </header>

        <PersonalizeClient blueprint={blueprint} />
      </div>
    </main>
  );
}
