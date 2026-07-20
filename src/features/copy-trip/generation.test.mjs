// Unit tests for crossCheckPlan — the post-generation gate that catches what
// the JSON schema can't: silent drops, provenance-label/status disagreement,
// must-keep coverage, and the additions contract. Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossCheckPlan } from './generation.mjs';

// Minimal source blueprint: one day, three experiences.
const blueprint = {
  days: [
    {
      id: 'day-1',
      experiences: [
        { id: 'e1', name: 'Breakfast at Café de Flore', placeName: 'Café de Flore' },
        { id: 'e2', name: 'Walk the Champs-Élysées', placeName: 'Champs-Élysées' },
        { id: 'e3', name: 'Berthillon ice cream', placeName: 'Île Saint-Louis' },
      ],
    },
  ],
};

const selection = {
  selectedExperienceIds: ['e1', 'e2', 'e3'],
  mustKeepExperienceIds: ['e1'],
  removedExperienceIds: [],
  addOnOptionIds: [],
};

const preferences = { durationDays: 1 };

const item = (overrides) => ({
  id: overrides.sourceExperienceId ?? 'new-item',
  time: '09:00',
  title: 'Item',
  status: 'preserved',
  sourceDayId: 'day-1',
  provenanceLabel: 'Preserved from Day 1 of the original trip',
  ...overrides,
});

const planWith = (items, extra = {}) => ({
  durationDays: 1,
  startDate: '2027-06-19',
  endDate: '2027-06-19',
  days: [{ dayNumber: 1, startTime: '09:00', endTime: '21:00', items }],
  comparison: [],
  warnings: [],
  ...extra,
});

test('a plan that keeps everything passes clean', () => {
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({ sourceExperienceId: 'e2' }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  assert.deepEqual(crossCheckPlan(plan, blueprint, selection, preferences), []);
});

test('a kept experience dropped without a word is flagged', () => {
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  const problems = crossCheckPlan(plan, blueprint, selection, preferences);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /dropped silently/);
  assert.match(problems[0], /Champs-Élysées/);
});

test('a drop named in a warning is an owned cut, not a problem', () => {
  const plan = planWith(
    [item({ sourceExperienceId: 'e1' }), item({ sourceExperienceId: 'e3' })],
    { warnings: ['To fit one relaxed day, "Walk the Champs-Élysées" was cut.'] }
  );
  assert.deepEqual(crossCheckPlan(plan, blueprint, selection, preferences), []);
});

test('a drop acknowledged by place name in a comparison entry also counts', () => {
  const plan = planWith(
    [item({ sourceExperienceId: 'e1' }), item({ sourceExperienceId: 'e3' })],
    {
      comparison: [
        {
          category: 'pace',
          original: 'Three quarters in one day',
          personalized: 'Two quarters',
          reason: 'Dropped the Champs-Élysées leg to slow the day down.',
        },
      ],
    }
  );
  assert.deepEqual(crossCheckPlan(plan, blueprint, selection, preferences), []);
});

test('a missing must-keep is a hard error, not a silent-drop note', () => {
  const plan = planWith(
    [item({ sourceExperienceId: 'e2' }), item({ sourceExperienceId: 'e3' })]
  );
  const problems = crossCheckPlan(plan, blueprint, selection, preferences);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /must-keep experience "e1"/);
});

test('a provenanceLabel that contradicts its status is flagged', () => {
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({
      sourceExperienceId: 'e2',
      status: 'modified',
      provenanceLabel: 'Preserved from Day 1 of the original trip',
    }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  const problems = crossCheckPlan(plan, blueprint, selection, preferences);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /provenanceLabel/);
  assert.match(problems[0], /reads as "preserved"/);
});

test('a free-form label makes no status claim and passes', () => {
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({
      sourceExperienceId: 'e2',
      status: 'modified',
      provenanceLabel: 'The original Day 1 walk, now an evening stroll',
    }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  assert.deepEqual(crossCheckPlan(plan, blueprint, selection, preferences), []);
});

test('matched adapted/new labels pass', () => {
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({
      sourceExperienceId: 'e2',
      status: 'modified',
      provenanceLabel: 'Adapted from the original Day 1 morning',
    }),
    item({ sourceExperienceId: 'e3' }),
    item({
      id: 'picnic',
      sourceExperienceId: undefined,
      sourceDayId: undefined,
      status: 'new',
      provenanceLabel: 'New suggestion',
    }),
  ]);
  assert.deepEqual(crossCheckPlan(plan, blueprint, selection, preferences), []);
});

test('the additions contract still holds: option id must appear as a new item', () => {
  const withAddOn = { ...selection, addOnOptionIds: ['sgp-jardin-du-luxembourg'] };
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({ sourceExperienceId: 'e2' }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  const problems = crossCheckPlan(plan, blueprint, withAddOn, preferences);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /requested addition "sgp-jardin-du-luxembourg"/);
});

test('an experience the traveler deselected owes no acknowledgment', () => {
  const partial = { ...selection, selectedExperienceIds: ['e1', 'e3'], mustKeepExperienceIds: [] };
  const plan = planWith([
    item({ sourceExperienceId: 'e1' }),
    item({ sourceExperienceId: 'e3' }),
  ]);
  assert.deepEqual(crossCheckPlan(plan, blueprint, partial, preferences), []);
});
