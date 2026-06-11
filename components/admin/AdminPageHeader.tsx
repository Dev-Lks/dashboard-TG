import { ReactNode } from 'react';

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--olive-900)] sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{action}</div>}
    </div>
  );
}
