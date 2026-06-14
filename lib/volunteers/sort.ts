export function compareByNr(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

export function sortByWarName<T extends { war_name?: string | null; full_name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) =>
    (a.war_name || a.full_name).localeCompare(b.war_name || b.full_name, 'pt-BR'),
  );
}

export function sortByNr<T extends { nr: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => compareByNr(a.nr, b.nr));
}
