'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, Users, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/datas', label: 'Datas', icon: Calendar },
  { href: '/admin/voluntarios', label: 'Efetivo', icon: Users },
  { href: '/admin/agendamentos', label: 'Agenda', icon: ClipboardList },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t-2 border-[var(--olive)] bg-[rgba(31,41,37,0.97)] backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] md:hidden"
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
                ? 'bg-white/10 text-white'
                : 'text-[var(--sand)] hover:bg-white/5 hover:text-white'
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
