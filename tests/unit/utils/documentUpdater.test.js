const { applyDotNotationUpdates, filterAllowedFields } = require('../../../src/utils/documentUpdater');

describe('documentUpdater', () => {
  describe('applyDotNotationUpdates', () => {
    it('should set flat keys', () => {
      const target = { a: 1 };
      applyDotNotationUpdates(target, { a: 2 });
      expect(target.a).toBe(2);
    });

    it('should set nested keys using dot notation', () => {
      const target = {};
      applyDotNotationUpdates(target, { 'availability.immediate': true });
      expect(target.availability.immediate).toBe(true);
    });

    it('should create intermediate objects if missing', () => {
      const target = {};
      applyDotNotationUpdates(target, { 'a.b.c': 'deep' });
      expect(target.a.b.c).toBe('deep');
    });

    it('should overwrite existing values', () => {
      const target = { x: { y: 'old' } };
      applyDotNotationUpdates(target, { 'x.y': 'new' });
      expect(target.x.y).toBe('new');
    });

    it('should handle multiple updates', () => {
      const target = {};
      applyDotNotationUpdates(target, { a: 1, 'b.c': 2, 'b.d': 3 });
      expect(target).toEqual({ a: 1, b: { c: 2, d: 3 } });
    });

    it('should handle array values', () => {
      const target = {};
      applyDotNotationUpdates(target, { tags: ['a', 'b'] });
      expect(target.tags).toEqual(['a', 'b']);
    });

    it('should not mutate non-object intermediate paths', () => {
      const target = { a: 'string' };
      applyDotNotationUpdates(target, { 'a.b': 'value' });
      expect(target.a).toEqual({ b: 'value' });
    });
  });

  describe('filterAllowedFields', () => {
    it('should keep only allowed flat fields', () => {
      const updates = { name: 'test', role: 'admin', secret: 'hack' };
      const result = filterAllowedFields(updates, ['name', 'role']);
      expect(result).toEqual({ name: 'test', role: 'admin' });
    });

    it('should keep dot-notation keys when top-level is allowed', () => {
      const updates = { 'availability.immediate': true, 'secret.field': 'x' };
      const result = filterAllowedFields(updates, ['availability']);
      expect(result).toEqual({ 'availability.immediate': true });
    });

    it('should return empty object if nothing matches', () => {
      const updates = { a: 1, b: 2 };
      const result = filterAllowedFields(updates, ['c']);
      expect(result).toEqual({});
    });

    it('should handle empty updates', () => {
      expect(filterAllowedFields({}, ['a'])).toEqual({});
    });

    it('should handle empty allowedFields', () => {
      expect(filterAllowedFields({ a: 1 }, [])).toEqual({});
    });
  });
});
