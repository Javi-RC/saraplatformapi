const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeKey(key) {
  return typeof key === 'string' && !DANGEROUS_KEYS.has(key) && !key.startsWith('__');
}

/**
 * Apply dot-notation updates to a plain object
 * @param {Object} target - The object to update
 * @param {Object} updates - Key-value pairs where keys can use dot notation (e.g., 'availability.immediate')
 */
function applyDotNotationUpdates(target, updates) {
  for (const [key, value] of Object.entries(updates)) {
    const keys = key.split('.');
    if (keys.some(k => !isSafeKey(k))) {
      continue;
    }
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
}

/**
 * Filter an updates object to only include whitelisted top-level fields
 * @param {Object} updates - The updates to filter
 * @param {Array<string>} allowedFields - Allowed top-level field names
 * @returns {Object} Filtered updates
 */
function filterAllowedFields(updates, allowedFields) {
  const filtered = {};
  for (const [key, value] of Object.entries(updates)) {
    const topLevelKey = key.split('.')[0];
    if (allowedFields.includes(topLevelKey)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

module.exports = { applyDotNotationUpdates, filterAllowedFields };
