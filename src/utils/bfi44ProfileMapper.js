function normalizeNumber(value) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Converts stored BFI-44 results into a stable API shape.
 *
 * Supported inputs:
 * - A raw results object: { Extraversion, Agreeableness, ... }
 * - A profile object: { results: { ... } }
 * - Already-stable shape: { traits: { extraversion, ... } }
 *
 * Output (stable):
 *   { traits: { extraversion, agreeableness, conscientiousness, neuroticism, openness } }
 * or null when no usable data is provided.
 */
function toStableBfi44Profile(input) {
  if (!input) return null;

  if (input.traits && typeof input.traits === 'object') {
    const t = input.traits;
    return {
      traits: {
        extraversion: normalizeNumber(t.extraversion ?? t.Extraversion),
        agreeableness: normalizeNumber(t.agreeableness ?? t.Agreeableness),
        conscientiousness: normalizeNumber(t.conscientiousness ?? t.Conscientiousness),
        neuroticism: normalizeNumber(t.neuroticism ?? t.Neuroticism),
        openness: normalizeNumber(t.openness ?? t.Openness)
      }
    };
  }

  const results = input.results && typeof input.results === 'object' ? input.results : input;

  if (!results || typeof results !== 'object') return null;

  return {
    traits: {
      extraversion: normalizeNumber(results.Extraversion ?? results.extraversion),
      agreeableness: normalizeNumber(results.Agreeableness ?? results.agreeableness),
      conscientiousness: normalizeNumber(results.Conscientiousness ?? results.conscientiousness),
      neuroticism: normalizeNumber(results.Neuroticism ?? results.neuroticism),
      openness: normalizeNumber(results.Openness ?? results.openness)
    }
  };
}

module.exports = {
  toStableBfi44Profile
};
