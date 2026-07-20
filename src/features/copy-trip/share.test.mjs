import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSharePayload, decodeSharePayload } from './share.mjs';
import { CopiedTripPlanSchema } from './schema.mjs';

const samplePlan = {
  title: 'Trois jours à Paris',
  destination: 'Paris, France',
  durationDays: 1,
  summary: 'A relaxed pass through the left bank — cafés, quays, one museum.',
  transformationSummary: 'Slower pace, two days trimmed.',
  comparison: [
    {
      category: 'Pace',
      original: 'Fast, six stops a day',
      personalized: 'Relaxed, three stops a day',
      reason: 'You asked for a relaxed pace.',
    },
  ],
  warnings: ['Museums close on Tuesdays — check the Musée d’Orsay.'],
  days: [
    {
      dayNumber: 1,
      title: 'Saint-Germain on foot',
      theme: 'Arrival',
      neighborhoods: ['Saint-Germain-des-Prés'],
      items: [
        {
          id: 'exp-cafe-flore',
          title: 'Café de Flore',
          description: 'Coffee where the original trip started — unhurried.',
          category: 'food',
          status: 'preserved',
          sourceExperienceId: 'exp-cafe-flore',
          provenanceLabel: 'Kept from the original day 1',
          time: '09:30',
          durationMinutes: 60,
          neighborhood: 'Saint-Germain-des-Prés',
          travelModeFromPrevious: 'walk',
        },
      ],
    },
  ],
};

test('a payload survives the encode/decode round trip byte-for-byte', async () => {
  const payload = { v: 1, tripId: 'paris-2026', prefs: { pace: 'relaxed' }, plan: samplePlan };
  const blob = await encodeSharePayload(payload);
  assert.match(blob, /^[cp]\.[A-Za-z0-9_-]+$/, 'blob is scheme-prefixed base64url');
  const decoded = await decodeSharePayload(blob);
  assert.deepEqual(decoded, payload);
});

test('a round-tripped plan still satisfies CopiedTripPlanSchema', async () => {
  const blob = await encodeSharePayload({ v: 1, tripId: 'paris-2026', plan: samplePlan });
  const decoded = await decodeSharePayload(blob);
  const parsed = CopiedTripPlanSchema.safeParse(decoded.plan);
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues, null, 2));
});

test('unicode content is preserved', async () => {
  const payload = { note: 'Fête de la Musique — Kraków → Menton · 🇫🇷' };
  assert.deepEqual(await decodeSharePayload(await encodeSharePayload(payload)), payload);
});

test('tampered, truncated, and junk input decode to null, never throw', async () => {
  const blob = await encodeSharePayload({ v: 1 });
  assert.equal(await decodeSharePayload(blob.slice(0, blob.length - 5)), null);
  assert.equal(await decodeSharePayload(`x.${blob.slice(2)}`), null);
  assert.equal(await decodeSharePayload('not a share blob'), null);
  assert.equal(await decodeSharePayload(''), null);
  assert.equal(await decodeSharePayload(null), null);
});
