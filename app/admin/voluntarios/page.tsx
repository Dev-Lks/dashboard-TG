import { requireAdmin } from '@/lib/admin-auth';
import { createServerSupabase } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ExportPanel } from '@/components/admin/appointments/ExportPanel';
import { VolunteersByTurma } from '@/components/admin/volunteers/VolunteersByTurma';
import { UNIT_ID } from '@/lib/branding';

async function getVolunteers(search?: string) {
  const supabase = await createServerSupabase();
  let query = supabase.from('volunteers')
    .select('*')
    .order('seq', { ascending: true, nullsFirst: false });

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
        eyebrow={UNIT_ID}
        title="Efetivo por turma"
      />

      <div>
        <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-extrabold text-[var(--olive-900)]">
            {volunteers.length} cadastrado{volunteers.length !== 1 ? 's' : ''}
          </div>
          <form className="grid gap-2 sm:grid-cols-[280px,auto]">
            <input name="q" defaultValue={params.q} placeholder="Buscar NR / Guerra / Nome" className="input text-sm" />
            <button type="submit" className="btn btn-secondary text-sm">Filtrar</button>
          </form>
        </div>

        <div className="mb-5">
          <ExportPanel rosters={[]} showTurma />
        </div>

        <VolunteersByTurma volunteers={volunteers} />
      </div>
    </div>
  );
}
