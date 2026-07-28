const { ROLES } = require('../../../src/config/roles');

describe('roles config', () => {
  it('should define all expected roles', () => {
    expect(ROLES.UNASSIGNED).toBe('unassigned');
    expect(ROLES.EMPLOYEE).toBe('employee');
    expect(ROLES.ORG_ADMIN).toBe('org_admin');
    expect(ROLES.PM).toBe('project_manager');
    expect(ROLES.ADMIN).toBe('admin');
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(ROLES)).toBe(true);
  });

  it('should not allow mutation of existing properties', () => {
    expect(Object.getOwnPropertyDescriptor(ROLES, 'EMPLOYEE').writable).toBe(false);
  });
});
