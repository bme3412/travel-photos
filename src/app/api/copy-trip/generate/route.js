// POST /api/copy-trip/generate — turns a copy session (selection +
// preferences) into a CopiedTripPlan via a structured-output Claude call.
//
// This endpoint is public (the site has no auth), so it defends itself:
// per-IP and global rate limits, a request-size cap, strict Zod validation
// of the request, and a result cache keyed on the request content so
// identical builds don't re-bill. Limits and cache are in-memory — on
// serverless that means per-instance, which is acceptable for this traffic;
// a shared store can replace them if the feature grows.

import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { GenerateRequestSchema } from '@/features/copy-trip/schema.mjs';
import { getTripBlueprint } from '@/features/copy-trip/blueprint';
import { getCopyOptionsForTrip } from '@/features/neighborhoods/data';
import {
  GENERATION_MODEL,
  buildGenerationRequest,
  crossCheckPlan,
  parsePlanText,
} from '@/features/copy-trip/generation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A full build runs ~2 minutes (and up to twice that with the repair pass).
// 300s requires Vercel Fluid Compute — verify it's enabled on the project;
// on classic serverless this clamps to the plan limit and long builds 504.
export const maxDuration = 300;

const MAX_BODY_BYTES = 64 * 1024;
const MAX_OUTPUT_TOKENS = 12000;

// ——— Rate limiting (per instance) ———
const IP_LIMIT = 6; // generations per IP per hour
const IP_WINDOW_MS = 60 * 60 * 1000;
const DAILY_LIMIT = 60; // generations per instance per UTC day
const ipHits = new Map(); // ip -> timestamps[]
let dailyDay = '';
let dailyCount = 0;

function checkRateLimit(ip) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDay) {
    dailyDay = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_LIMIT) {
    return { ok: false, message: 'The trip builder is at capacity for today — try again tomorrow.' };
  }
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_LIMIT) {
    return { ok: false, message: 'Too many builds from this connection — try again in a bit.' };
  }
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear(); // bound memory under IP churn
  dailyCount += 1;
  return { ok: true };
}

// ——— Result cache (per instance) ———
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 100;
const planCache = new Map(); // hash -> { plan, at }

// Keyed on everything except the regenerate flag, so "Regenerate" bypasses
// the cache read but identical rebuilds still hit it.
function cacheKey(request) {
  const rest = { ...request };
  delete rest.regenerate;
  return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}

function json(body, status = 200) {
  return Response.json(body, { status });
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'Generation is not configured on this deployment.' }, 503);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: 'Invalid request.', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
      400
    );
  }
  const request = parsed.data;

  const blueprint = getTripBlueprint(request.tripId);
  if (!blueprint) return json({ error: 'No blueprint for this trip.' }, 404);

  const validIds = new Set(blueprint.days.flatMap((d) => d.experiences.map((e) => e.id)));
  const unknown = request.selectedExperienceIds.filter((id) => !validIds.has(id));
  if (unknown.length > 0) {
    return json({ error: `Unknown experience ids: ${unknown.join(', ')}` }, 400);
  }

  const optionsById = getCopyOptionsForTrip(request.tripId);
  const unknownOptions = request.addOnOptionIds.filter((id) => !optionsById.has(id));
  if (unknownOptions.length > 0) {
    return json({ error: `Unknown addition ids: ${unknownOptions.join(', ')}` }, 400);
  }

  const selection = {
    selectedExperienceIds: request.selectedExperienceIds,
    mustKeepExperienceIds: request.mustKeepExperienceIds.filter((id) => validIds.has(id)),
    removedExperienceIds: request.removedExperienceIds.filter((id) => validIds.has(id)),
    addOnOptionIds: request.addOnOptionIds,
  };
  const effectiveCount = request.selectedExperienceIds.filter(
    (id) => !selection.removedExperienceIds.includes(id)
  ).length;
  if (effectiveCount === 0) {
    return json({ error: 'No experiences left after removals — keep at least one.' }, 400);
  }

  const key = cacheKey(request);
  if (!request.regenerate) {
    const hit = planCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return json({ plan: hit.plan, cached: true });
    }
  }

  // Rate-limit actual generations only — cache hits above are cheap.
  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const limit = checkRateLimit(ip);
  if (!limit.ok) return json({ error: limit.message }, 429);

  const client = new Anthropic();
  const { system, messages } = buildGenerationRequest(blueprint, selection, request.preferences);

  const callModel = async (conversation) => {
    const response = await client.messages.create({
      model: GENERATION_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages: conversation,
    });
    const text = responseText(response);
    if (response.stop_reason === 'max_tokens') {
      return { text, plan: null, problems: ['the response was cut off — return a more concise itinerary'] };
    }
    const { plan, problems } = parsePlanText(text);
    return {
      text,
      plan,
      problems: plan
        ? crossCheckPlan(plan, blueprint, selection, request.preferences)
        : problems,
    };
  };

  try {
    let attempt = await callModel(messages);

    // One repair pass: hand back the draft and the exact problems.
    if (attempt.problems.length > 0) {
      attempt = await callModel([
        ...messages,
        { role: 'assistant', content: attempt.text || '(no output)' },
        {
          role: 'user',
          content:
            'That itinerary has problems that must be fixed. Return the corrected full itinerary as JSON only:\n- ' +
            attempt.problems.join('\n- '),
        },
      ]);
    }
    const { plan, problems } = attempt;

    if (!plan || problems.length > 0) {
      console.error('copy-trip generation failed cross-checks', {
        tripId: request.tripId,
        problems: problems.slice(0, 10),
      });
      return json(
        { error: 'The builder produced an inconsistent itinerary. Try again — or adjust your selections.' },
        502
      );
    }

    planCache.set(key, { plan, at: Date.now() });
    if (planCache.size > CACHE_MAX) {
      const oldest = [...planCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      planCache.delete(oldest[0]);
    }

    return json({ plan });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.OverloadedError) {
      return json({ error: 'The builder is busy right now — try again in a minute.' }, 503);
    }
    if (error instanceof Anthropic.APIError) {
      console.error('copy-trip generation API error', { tripId: request.tripId, status: error.status, type: error.type });
      return json({ error: 'The builder hit an upstream error. Try again shortly.' }, 502);
    }
    console.error('copy-trip generation error', { tripId: request.tripId, message: error?.message });
    return json({ error: 'Something went wrong building the itinerary.' }, 500);
  }
}

function responseText(response) {
  return (response?.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
