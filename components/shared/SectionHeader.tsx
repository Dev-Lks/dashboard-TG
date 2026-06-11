import { ReactNode } from 'react';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--olive-900)] sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
