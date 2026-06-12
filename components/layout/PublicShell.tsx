import Link from 'next/link';
import { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type PublicShellProps = {
  children: ReactNode;
  compact?: boolean;
};

export function PublicShell({ children, compact = false }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="safe-top sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--olive)] sm:h-10 sm:w-10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-[0.12em] text-[var(--olive-900)]">TG 11</div>
              <div className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] sm:block">Ituiutaba/MG</div>
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-2" aria-label="Navegação principal">
            <ThemeToggle />
            <Link href="/agendar" className="rounded border border-[var(--olive)] bg-[var(--olive)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-inverse)] hover:bg-[var(--olive-dark)] sm:px-3 sm:py-2 sm:text-xs">
              Agendar
            </Link>
            <Link href="/admin" className="hidden rounded border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--olive-dark)] hover:bg-[var(--surface-muted)] sm:inline-block sm:px-3 sm:py-2 sm:text-xs">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className={`mx-auto w-full max-w-5xl px-4 ${compact ? 'py-5 sm:py-8' : 'py-6 sm:py-10'}`}>
        {children}
      </main>

      <footer className="safe-bottom border-t border-[var(--border)] px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        TG 11 — Ituiutaba/MG
      </footer>
    </div>
  );
}
