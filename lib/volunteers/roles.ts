export type VolunteerRole = 'monitor' | 'atirador';

export function normalizeRole(grad: string | null | undefined): VolunteerRole | null {
  if (!grad) return null;
  const upper = grad.trim().toUpperCase();
  if (upper.includes('MONITOR')) return 'monitor';
  if (upper.includes('ATIRADOR')) return 'atirador';
  return null;
}

export function getRoleLabel(role: VolunteerRole | null): string {
  if (role === 'monitor') return 'Monitor';
  if (role === 'atirador') return 'Atirador';
  return '—';
}

export function matchesRoleFilter(grad: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  const role = normalizeRole(grad);
  return role === filter;
}
