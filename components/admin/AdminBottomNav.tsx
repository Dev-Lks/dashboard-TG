'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, Users, ClipboardList, Flag } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Início', icon: BarChart3, exact: true },
  { href: '/admin/missoes', label: 'Missões', icon: Flag },
  { href: '/admin/datas', label: 'Datas', icon: Calendar },
  { href: '/admin/agendamentos', label: 'Agenda', icon: ClipboardList },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="admin-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      aria-label="Navegação administrativa"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isActive
                ? 'bg-[var(--surface-muted)] text-[var(--olive-900)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
