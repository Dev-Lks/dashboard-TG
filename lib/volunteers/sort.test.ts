import { describe, expect, it } from 'vitest';
import { compareByNr, sortByNr, sortByWarName } from './sort';

describe('compareByNr', () => {
  it('compares numerically', () => {
    expect(compareByNr('2', '10')).toBeLessThan(0);
    expect(compareByNr('10', '2')).toBeGreaterThan(0);
  });
});

describe('sortByNr', () => {
  it('sorts list by nr field', () => {
    const list = [{ nr: '100', name: 'a' }, { nr: '9', name: 'b' }, { nr: '42', name: 'c' }];
    expect(sortByNr(list).map((x) => x.nr)).toEqual(['9', '42', '100']);
  });
});

describe('sortByWarName', () => {
  it('sorts by war name in pt-BR locale', () => {
    const list = [
      { nr: '1', war_name: 'Zeca', full_name: 'Zeca' },
      { nr: '2', war_name: 'Ana', full_name: 'Ana' },
    ];
    expect(sortByWarName(list).map((x) => x.war_name)).toEqual(['Ana', 'Zeca']);
  });
});
