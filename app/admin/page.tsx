import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminLogin } from './_components/AdminLogin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { EmptyState } from '@/components/shared/EmptyState';

export default async function AdminDashboard() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm pt-8">
        <div className="mb-5">
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--olive-dark)]">Área restrita</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--olive-900)]">Acesso ao Painel de Comando</h1>
        </div>
        <AdminLogin />
      </div>
    );
  }

  const supabase = createServiceRoleClient();

  const { count: volunteerCount } = await supabase.from('volunteers').select('id', { count: 'exact', head: true });
  const { count: confirmedCount } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed');
  const { data: dates } = await supabase.from('donation_dates').select('id, date, capacity, is_active');

  const { data: allConfirmed } = await supabase.from('appointments').select('donation_date_id').eq('status', 'confirmed');
  const bookedMap = new Map<string, number>();
  allConfirmed?.forEach((a: any) => bookedMap.set(a.donation_date_id, (bookedMap.get(a.donation_date_id) || 0) + 1));

  const dateStats = (dates || []).map((d: any) => {
    const booked = bookedMap.get(d.id) || 0;
    return {
      ...d,
      booked,
      remaining: Math.max(0, d.capacity - booked),
      isFull: booked >= d.capacity,
    };
  });

  const open = dateStats.filter(d => d.is_active && !d.isFull).length;
  const fullOrClosed = dateStats.filter(d => !d.is_active || d.isFull).length;

  const { data: recent } = await supabase
    .from('appointments')
    .select(`id, created_at, status, volunteers(nr, war_name), donation_dates(date)`)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Painel de comando"
        title="Visão Geral da Operação"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Efetivo cadastrado" value={volunteerCount || 0} />
        <MetricCard label="Efetivo agendado" value={confirmedCount || 0} tone="success" />
        <MetricCard label="Datas abertas" value={open} tone="success" />
        <MetricCard label="Cheias / inativas" value={fullOrClosed} tone="danger" />
      </div>

      <div className="mb-6">
        <div className="mb-2 px-1 font-extrabold uppercase tracking-[0.12em] text-[var(--olive-900)]">Ocupação por data</div>
        <div className="card overflow-hidden">
          <table className="table hidden text-sm md:table">
            <thead>
              <tr>
                <th>DATA</th>
                <th>EFETIVO</th>
                <th>CAPACIDADE</th>
                <th>RESTANTES</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dateStats.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.date}</td>
                  <td>{d.booked}</td>
                  <td>{d.capacity}</td>
                  <td className={d.remaining === 0 ? 'font-medium text-[var(--danger)]' : ''}>{d.remaining}</td>
                  <td>
                    {d.isFull ? <span className="badge badge-closed">CHEIA</span> : 
                     d.is_active ? <span className="badge badge-open">ABERTA</span> : 
                     <span className="badge badge-command">INATIVA</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dateStats.length === 0 ? (
            <div className="p-4"><EmptyState title="Nenhuma data cadastrada" description="Cadastre datas em Datas." /></div>
          ) : (
            <div className="grid gap-3 p-3 md:hidden">
              {dateStats.map((d: any) => {
                const percent = Math.min(100, Math.round((d.booked / d.capacity) * 100));
                return (
                  <div key={d.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-[var(--olive-900)]">{d.date}</div>
                        <div className="text-sm text-[var(--text-muted)]">{d.booked}/{d.capacity} confirmados</div>
                      </div>
                      {d.isFull ? <span className="badge badge-closed">Cheia</span> : d.is_active ? <span className="badge badge-open">Aberta</span> : <span className="badge badge-command">Inativa</span>}
                    </div>
                    <div className="progress-track mt-3"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
                    <div className="mt-2 text-sm font-bold text-[var(--text-muted)]">{d.remaining} vagas restantes</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 px-1 font-extrabold uppercase tracking-[0.12em] text-[var(--olive-900)]">Últimas confirmações</div>
        <div className="card overflow-hidden">
          <table className="table hidden text-sm md:table">
            <thead>
              <tr>
                <th>DATA</th>
                <th>VOLUNTÁRIO</th>
                <th>NR</th>
                <th>REGISTRADO</th>
              </tr>
            </thead>
            <tbody>
              {recent?.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.donation_dates?.date}</td>
                  <td>{a.volunteers?.war_name}</td>
                  <td className="font-mono text-xs font-semibold">{a.volunteers?.nr}</td>
                  <td className="text-xs text-[var(--text-muted)]">{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recent?.length ? (
            <div className="p-4"><EmptyState title="Nenhum agendamento confirmado" description="Nenhum agendamento ainda." /></div>
          ) : (
            <div className="grid gap-3 p-3 md:hidden">
              {recent.map((a: any) => (
                <div key={a.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-[var(--olive-900)]">{a.volunteers?.war_name || 'Voluntário'}</div>
                      <div className="font-mono text-sm font-bold text-[var(--text-muted)]">NR {a.volunteers?.nr}</div>
                    </div>
                    <span className="badge badge-confirmed">Confirmado</span>
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-muted)]">Data: <span className="font-bold text-[var(--text)]">{a.donation_dates?.date}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
