import { requireAdmin } from '@/lib/admin-auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

async function getVolunteers(search?: string) {
  const supabase = await createServerSupabase();
  let query = supabase.from('volunteers')
    .select('*')
    .order('nr', { ascending: true });

  if (search && search.length > 1) {
    const s = search.trim();
    query = query.or(`nr.ilike.%${s}%,war_name.ilike.%${s}%,full_name.ilike.%${s}%`);
  }
  const { data } = await query;
  return data || [];
}

export default async function AdminVolunteersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const volunteers = await getVolunteers(params.q);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Efetivo"
        title="Voluntários / Atiradores"
        description="Consulta em modo somente leitura. A lista é versionada no projeto e atualizada via seed."
        action={<div className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[10px] font-bold text-[var(--text-muted)]">data/volunteers.csv</div>}
      />

      <div className="mb-4 rounded-md border border-[var(--sand)] bg-[var(--sand-light)] px-4 py-3 text-xs font-semibold leading-5 text-[var(--olive-900)]">
        Para atualizar a lista, altere o CSV versionado e execute <span className="font-mono">pnpm seed:volunteers</span>. Não há importação manual pelo painel.
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-extrabold text-[var(--olive-900)]">Efetivo cadastrado ({volunteers.length} mostrados)</div>
          <form className="grid gap-2 sm:grid-cols-[280px,auto]">
            <input name="q" defaultValue={params.q} placeholder="Buscar NR / Guerra / Nome" className="input text-sm" />
            <button type="submit" className="btn btn-secondary text-sm">Filtrar</button>
          </form>
        </div>

        <div className="card overflow-hidden">
          <table className="table hidden min-w-[920px] text-sm md:table">
            <thead>
              <tr>
                <th>SEQ</th>
                <th>NR</th>
                <th>Função</th>
                <th>Nome de Guerra</th>
                <th>Nome Completo</th>
                <th>Nasc.</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v: any) => (
                <tr key={v.id}>
                  <td>{v.seq ?? '—'}</td>
                  <td className="font-mono font-semibold">{v.nr}</td>
                  <td>{v.grad}</td>
                  <td className="font-medium">{v.war_name}</td>
                  <td>{v.full_name}</td>
                  <td className="text-xs">{v.birth_date}</td>
                  <td className="text-xs font-mono">{v.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {volunteers.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhum voluntário encontrado" description="Ajuste a busca por NR, nome de guerra ou nome completo." />
            </div>
          ) : (
            <div className="grid gap-3 p-3 md:hidden">
              {volunteers.map((v: any) => (
                <div key={v.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-extrabold text-[var(--olive-900)]">{v.war_name || v.full_name}</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-muted)]">NR {v.nr}</div>
                    </div>
                    <span className="badge badge-command">{v.grad || 'Efetivo'}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div>
                      <div className="info-label">Nome completo</div>
                      <div className="truncate font-medium">{v.full_name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="info-label">Nascimento</div>
                        <div className="text-xs font-semibold">{v.birth_date || '—'}</div>
                      </div>
                      <div>
                        <div className="info-label">Telefone</div>
                        <div className="font-mono text-xs">{v.phone || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 px-1 text-[11px] font-medium text-[var(--text-muted)]">Exibindo efetivo. Use a busca para filtrar.</p>
      </div>
    </div>
  );
}
