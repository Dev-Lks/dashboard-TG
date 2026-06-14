'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, Users, ClipboardList, Flag } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/missoes', label: 'Missões', icon: Flag },
  { href: '/admin/datas', label: 'Datas', icon: Calendar },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: ClipboardList },
  { href: '/admin/voluntarios', label: 'Turmas', icon: Users },
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
            className={`command-nav-link flex min-h-10 shrink-0 items-center gap-2 rounded px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
              isActive ? 'command-nav-link--active' : ''
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
