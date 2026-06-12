import { describe, expect, it } from 'vitest';
import { getRoleLabel, matchesRoleFilter, normalizeRole } from './roles';

describe('normalizeRole', () => {
  it('returns monitor when grad contains MONITOR', () => {
    expect(normalizeRole('MONITOR')).toBe('monitor');
    expect(normalizeRole('  monitor  ')).toBe('monitor');
  });

  it('returns atirador when grad contains ATIRADOR', () => {
    expect(normalizeRole('ATIRADOR')).toBe('atirador');
  });

  it('returns null for unsupported grades', () => {
    expect(normalizeRole('CABO')).toBeNull();
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
  });
});

describe('getRoleLabel', () => {
  it('returns Portuguese labels for known roles', () => {
    expect(getRoleLabel('monitor')).toBe('Monitor');
    expect(getRoleLabel('atirador')).toBe('Atirador');
    expect(getRoleLabel(null)).toBe('—');
  });
});

describe('matchesRoleFilter', () => {
  it('matches all when filter is empty', () => {
    expect(matchesRoleFilter('MONITOR', '')).toBe(true);
  });

  it('matches only the selected role', () => {
    expect(matchesRoleFilter('MONITOR', 'monitor')).toBe(true);
    expect(matchesRoleFilter('ATIRADOR', 'monitor')).toBe(false);
  });
});
