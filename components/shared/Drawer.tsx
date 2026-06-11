'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'right' | 'bottom';
};

export function Drawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isBottom = side === 'bottom';

  return (
    <div className="fixed inset-0 z-50 flex" role="presentation">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={
          isBottom
            ? 'relative mt-auto flex max-h-[90vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom,0px)] shadow-xl'
            : 'relative ml-auto flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-xl sm:max-w-lg'
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.1em] text-[var(--olive-900)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
