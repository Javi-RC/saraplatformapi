/**
 * Extract ID from object or return string directly
 * Handles both ObjectIds and populated objects
 * @param {Object|string} obj - Object with _id or string ID
 * @returns {string|null} ID as string
 */
function extractId(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj._id) return obj._id.toString();
  return obj.toString();
}

module.exports = { extractId };
