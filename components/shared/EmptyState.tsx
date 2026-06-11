import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--olive)]">
        <Inbox className="h-5 w-5" />
      </div>
      <div className="font-bold text-[var(--olive-900)]">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
