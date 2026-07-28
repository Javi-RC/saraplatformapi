const { extractId } = require('../../../src/utils/idHelper');

describe('idHelper', () => {
  describe('extractId', () => {
    it('should return string directly', () => {
      expect(extractId('abc123')).toBe('abc123');
    });

    it('should extract _id from object', () => {
      expect(extractId({ _id: 'abc123' })).toBe('abc123');
    });

    it('should use toString for objects without _id', () => {
      const obj = { toString: () => 'from-toString' };
      expect(extractId(obj)).toBe('from-toString');
    });

    it('should return null for null/undefined', () => {
      expect(extractId(null)).toBeNull();
      expect(extractId(undefined)).toBeNull();
    });

    it('should handle falsy string', () => {
      expect(extractId('')).toBeNull();
    });
  });
});
