'use client';

import { useState } from 'react';
import { Search, User, BadgeCheck } from 'lucide-react';
import type { Volunteer } from '@/lib/types';

interface Props {
  onSelect: (volunteer: Volunteer) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export function VolunteerSearch({ onSelect, isLoading, setIsLoading }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Volunteer[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (query.trim().length < 2) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/volunteers/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.volunteers || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="grid items-center gap-3 sm:grid-cols-[1fr,auto]">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite NR, nome de guerra ou nome completo"
            className="input input-has-icon"
            disabled={isLoading}
            autoComplete="name"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || query.trim().length < 2}
          className="btn btn-auto btn-primary px-8 disabled:opacity-60"
        >
          Buscar
        </button>
      </form>

      {searched && (
        <div className="mt-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className="card flex w-full gap-3 p-4 text-left transition-all hover:border-[var(--olive)] active:bg-[var(--surface-muted)]"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--olive)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-extrabold leading-tight tracking-tight text-[var(--olive-900)]">{v.war_name || v.full_name}</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-[var(--text-muted)]">NR {v.nr} • {v.grad || 'Efetivo'}</div>
                    <div className="mt-1 truncate text-sm text-[var(--text)]">{v.full_name}</div>
                  </div>
                  <div className="hidden self-center text-[var(--olive)] sm:block">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] p-8 text-center text-sm text-[var(--text-muted)]">
              Nenhum voluntário encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
