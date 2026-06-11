import { normalizeRole, getRoleLabel } from '@/lib/volunteers/roles';

type RoleBadgeProps = {
  grad: string | null | undefined;
};

export function RoleBadge({ grad }: RoleBadgeProps) {
  const role = normalizeRole(grad);
  const label = getRoleLabel(role);

  if (!role) {
    return <span className="badge badge-command">{label}</span>;
  }

  if (role === 'monitor') {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--sand)] bg-[var(--sand-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--olive-900)]">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[var(--tactical-light)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--tactical)]">
      {label}
    </span>
  );
}
