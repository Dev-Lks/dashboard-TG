'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, Users, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/datas', label: 'Datas', icon: Calendar },
  { href: '/admin/voluntarios', label: 'Efetivo', icon: Users },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: ClipboardList },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 hidden gap-1 overflow-x-auto pb-1 md:flex sm:pb-3" aria-label="Navegação administrativa">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
              isActive
                ? 'bg-[var(--surface-muted)] text-[var(--olive-900)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
