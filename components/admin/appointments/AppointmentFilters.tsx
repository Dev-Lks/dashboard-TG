'use client';

import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

type DateOption = { id: string; date: string };

type AppointmentFiltersProps = {
  params: {
    date?: string;
    status?: string;
    q?: string;
    role?: string;
    capacity?: string;
  };
  dateOptions: DateOption[];
};

export function AppointmentFilters({ params, dateOptions }: AppointmentFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left lg:hidden"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--olive-dark)]">
          <Filter className="h-4 w-4" />
          Filtros da operação
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <form
        className={`grid gap-3 p-4 ${open ? 'grid' : 'hidden'} lg:grid lg:grid-cols-[1fr,140px,140px,120px,120px,auto,auto]`}
        method="GET"
      >
        <input
          name="q"
          placeholder="NR, nome de guerra ou nome completo"
          defaultValue={params.q}
          className="input text-sm"
        />
        <select name="date" defaultValue={params.date} className="input text-sm">
          <option value="">Todas as datas</option>
          {dateOptions.map((d) => (
            <option key={d.id} value={d.date}>
              {d.date}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status} className="input text-sm">
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmados</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <select name="role" defaultValue={params.role} className="input text-sm">
          <option value="">Todos os tipos</option>
          <option value="atirador">Atirador</option>
          <option value="monitor">Monitor</option>
        </select>
        <select name="capacity" defaultValue={params.capacity} className="input text-sm">
          <option value="">Capacidade</option>
          <option value="available">Com vagas</option>
          <option value="full">Datas cheias</option>
        </select>
        <button type="submit" className="btn btn-primary text-sm">
          Filtrar
        </button>
        <a href="/admin/agendamentos" className="btn btn-secondary text-sm">
          Limpar
        </a>
      </form>
    </div>
  );
}
