import { ReactNode } from 'react';
import Link from 'next/link';
import { logoutAdmin } from '@/lib/admin-auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UNIT_ID } from '@/lib/branding';
import { Target, LogOut as LogoutIcon } from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="command-header sticky top-0 z-40 border-b border-[var(--olive)] safe-top">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:py-0">
          <div className="flex min-h-12 items-center justify-between gap-3 md:min-h-14">
            <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--sand)] bg-[var(--olive)] text-[var(--text-inverse)]">
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="command-header-title truncate font-extrabold tracking-tight">Comando Administrativo</div>
              <div className="command-header-subtitle hidden text-[10px] font-mono uppercase tracking-[0.18em] md:block">{UNIT_ID} • Posto de comando</div>
            </div>
            </Link>

            <div className="flex items-center gap-2">
            <ThemeToggle variant="command" />
            <form action={async () => { 'use server'; await logoutAdmin(); }}>
              <button type="submit" className="command-header-action btn-auto flex h-10 w-10 items-center justify-center rounded sm:w-auto sm:px-3">
                <LogoutIcon className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-xs sm:font-bold sm:uppercase sm:tracking-[0.12em]">Sair</span>
              </button>
            </form>
            </div>
          </div>

          <AdminNav />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 pb-safe-nav md:py-7 md:pb-7">
        {children}
      </div>

      <footer className="border-t border-[var(--border)] px-4 py-4 pb-safe-nav text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] md:pb-4">
        Sistema desenvolvido por Monitor 69 Antonio
      </footer>

      <AdminBottomNav />
    </div>
  );
}
