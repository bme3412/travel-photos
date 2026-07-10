// Matches a replay day's narrative activity lines to blueprint experiences,
// so "+ Add to my trip" can sit next to the right activity. The narrative
// activities were the source material for the hand-authored experiences, so
// token overlap identifies most pairs; anything below the confidence
// threshold simply gets no button (better no action than the wrong one).
// Pure and deterministic — computed server-side when scenes are built.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'to', 'at', 'of', 'in', 'on', 'for', 'through',
  'by', 'with', 'de', 'la', 'le', 'les', 'du', 'des', 'l', 'd', 'my', 'own',
  'into', 'am', 'pm', 'past',
]);

// Crude suffix stemming, applied identically to both sides ("landed" ~ "land",
// "walks" ~ "walk") — enough for narrative-vs-name drift without a library.
function stem(t) {
  if (t.length > 4 && t.endsWith('ing')) return t.slice(0, -3);
  if (t.length > 3 && t.endsWith('ed')) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
  return t;
}

function tokens(text) {
  return new Set(
    (text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t))
      .map(stem)
  );
}

// Overlap coefficient: |A ∩ B| / min(|A|, |B|) — tolerant of the narrative
// line being wordier than the experience name (or vice versa).
function overlap(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const t of a) if (b.has(t)) hits += 1;
  return hits / Math.min(a.size, b.size);
}

const THRESHOLD = 0.5;

// activities: string[]; experiences: [{id, name, placeName?}]
// Returns (string|null)[] — the matched experience id per activity line.
// Greedy best-score-first with unique assignment on both sides.
export function matchActivitiesToExperiences(activities, experiences) {
  const activityTokens = activities.map(tokens);
  const experienceTokens = experiences.map((e) =>
    tokens([e.name, e.placeName].filter(Boolean).join(' '))
  );

  const pairs = [];
  activityTokens.forEach((at, ai) => {
    experienceTokens.forEach((et, ei) => {
      const score = overlap(at, et);
      if (score >= THRESHOLD) pairs.push({ ai, ei, score });
    });
  });
  pairs.sort((x, y) => y.score - x.score);

  const result = new Array(activities.length).fill(null);
  const usedExperiences = new Set();
  for (const { ai, ei } of pairs) {
    if (result[ai] !== null || usedExperiences.has(ei)) continue;
    result[ai] = experiences[ei].id;
    usedExperiences.add(ei);
  }
  return result;
}
