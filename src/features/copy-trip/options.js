// Display labels for the preference enums. Options are derived from the
// schema value lists so the form and the validation can never drift apart.

import {
  PACES,
  TRAVELER_TYPES,
  BUDGET_LEVELS,
  TRANSFORMATION_PREFS,
} from './schema.mjs';

const withLabels = (values, labels) => values.map((value) => ({ value, label: labels[value] }));

export const TRAVELER_TYPE_OPTIONS = withLabels(TRAVELER_TYPES, {
  solo: 'Solo',
  couple: 'Couple',
  friends: 'Friends',
  family: 'Family',
});

export const PACE_OPTIONS = withLabels(PACES, {
  relaxed: 'Relaxed',
  moderate: 'Moderate',
  fast: 'Fast',
});

export const BUDGET_OPTIONS = withLabels(BUDGET_LEVELS, {
  budget: 'Budget',
  'mid-range': 'Mid-range',
  premium: 'Premium',
});

export const TRANSFORMATION_LABELS = {
  'less-walking': 'Less walking',
  'more-food': 'More food',
  'more-museums': 'More museums',
  'more-nightlife': 'More nightlife',
  'more-local-neighborhoods': 'More local neighborhoods',
  'family-friendly': 'Family-friendly',
  'lower-budget': 'Lower budget',
  'accessible-route': 'Accessible route',
  'fewer-landmarks': 'Fewer landmarks',
  'keep-exact-route': 'Keep the exact route',
  'more-downtime': 'More downtime',
};

export const TRANSFORMATION_OPTIONS = withLabels(TRANSFORMATION_PREFS, TRANSFORMATION_LABELS);
