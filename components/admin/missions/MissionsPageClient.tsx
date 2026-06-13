'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Globe, GlobeLock, ClipboardCheck } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  createMissionAction,
  updateMissionAction,
  toggleMissionPublicAction,
  deleteMissionAction,
} from '@/app/admin/missoes/actions';
import { MISSION_TEMPLATES } from '@/lib/missions/types';
import { slugifyMissionName } from '@/lib/missions/slug';
import type { Mission } from '@/lib/missions/types';

type MissionsPageClientProps = {
  missions: Mission[];
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  location: string;
  phone: string;
  maps_url: string;
  default_capacity: number;
  default_schedule_mode: 'slots' | 'presence_only';
  is_public: boolean;
};

const emptyForm = (): FormState => ({
  name: '',
  slug: '',
  description: '',
  location: '',
  phone: '',
  maps_url: '',
  default_capacity: 15,
  default_schedule_mode: 'slots',
  is_public: false,
});

export function MissionsPageClient({ missions }: MissionsPageClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Mission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const openCreate = (templateId?: string) => {
    const tpl = templateId ? MISSION_TEMPLATES.find((t) => t.id === templateId) : null;
    setEditing(null);
    setForm({
      name: tpl?.name || '',
      slug: tpl ? slugifyMissionName(tpl.name) : '',
      description: tpl?.description || '',
      location: tpl?.location || '',
      phone: '',
      maps_url: '',
      default_capacity: tpl?.default_capacity || 15,
      default_schedule_mode: tpl?.default_schedule_mode || 'slots',
      is_public: false,
    });
    setShowForm(true);
  };

  const openEdit = (m: Mission) => {
    setEditing(m);
    setForm({
      name: m.name,
      slug: m.slug,
      description: m.description || '',
      location: m.location || '',
      phone: m.phone || '',
      maps_url: m.maps_url || '',
      default_capacity: m.default_capacity,
      default_schedule_mode: m.default_schedule_mode,
      is_public: m.is_public,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const fd = new FormData();
      if (editing) fd.set('id', editing.id);
      fd.set('name', form.name);
      fd.set('slug', form.slug);
      fd.set('description', form.description);
      fd.set('location', form.location);
      fd.set('phone', form.phone);
      fd.set('maps_url', form.maps_url);
      fd.set('default_capacity', String(form.default_capacity));
      fd.set('default_schedule_mode', form.default_schedule_mode);
      if (form.is_public) fd.set('is_public', 'on');

      const result = editing ? await updateMissionAction(fd) : await createMissionAction(fd);
      if (result.success) {
        toast.success(editing ? 'Missão atualizada' : 'Missão criada');
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Erro');
      }
    });
  };

  const handleTogglePublic = (m: Mission) => {
    startTransition(async () => {
      const result = await toggleMissionPublicAction(m.id, m.is_public);
      if (result.success) {
        toast.success(m.is_public ? 'Missão oculta do público' : 'Missão publicada');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteMissionAction(deleteId);
      if (result.success) {
        toast.success('Missão excluída');
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Erro');
        setDeleteId(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          Cadastre missões e marque como <strong>pública</strong> para aparecer no agendamento.
        </p>
        <button type="button" onClick={() => openCreate()} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Nova missão
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Templates:</span>
        {MISSION_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openCreate(t.id)}
            className="rounded border border-[var(--border)] px-2.5 py-1 text-xs font-bold hover:bg-[var(--surface-muted)]"
          >
            {t.name}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="text-lg font-extrabold">{editing ? 'Editar missão' : 'Nova missão'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Nome">
              <input
                className="input"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing ? f.slug : slugifyMissionName(name),
                  }));
                }}
              />
            </FormField>
            {!editing && (
              <FormField label="Slug (URL)">
                <input className="input font-mono text-sm" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </FormField>
            )}
            <div>
              <FormField label="Capacidade padrão">
                <input type="number" className="input" min={1} max={100} value={form.default_capacity} onChange={(e) => setForm((f) => ({ ...f, default_capacity: parseInt(e.target.value) || 15 }))} />
              </FormField>
            </div>
            <div>
              <FormField label="Modo padrão">
                <select className="input" value={form.default_schedule_mode} onChange={(e) => setForm((f) => ({ ...f, default_schedule_mode: e.target.value as 'slots' | 'presence_only' }))}>
                  <option value="slots">Com horários</option>
                  <option value="presence_only">Só presença</option>
                </select>
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Descrição">
                <textarea className="input min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Local">
              <input className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </FormField>
            <FormField label="Telefone">
              <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Link do mapa">
                <input className="input" value={form.maps_url} onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))} />
              </FormField>
            </div>
            {!editing && (
              <label className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" checked={form.is_public} onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))} />
                <span className="text-sm font-semibold">Publicar para agendamento imediatamente</span>
              </label>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleSubmit} disabled={pending} className="btn btn-primary">
              {editing ? 'Salvar' : 'Criar missão'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {missions.map((m) => (
          <div key={m.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold">{m.name}</h3>
                <span className={`badge ${m.is_public ? 'badge-open' : 'badge-closed'}`}>
                  {m.is_public ? 'Pública' : 'Oculta'}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">/agendar/{m.slug}</p>
              {m.description && <p className="mt-2 text-sm text-[var(--text-muted)]">{m.description}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href={`/admin/missoes/${m.slug}/controle`} className="btn btn-primary btn-sm">
                <ClipboardCheck className="h-4 w-4" />
                Controle
              </a>
              <button type="button" onClick={() => handleTogglePublic(m)} disabled={pending} className="btn btn-secondary btn-sm" title={m.is_public ? 'Ocultar' : 'Publicar'}>
                {m.is_public ? <GlobeLock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {m.is_public ? 'Ocultar' : 'Publicar'}
              </button>
              <button type="button" onClick={() => openEdit(m)} className="btn btn-secondary btn-sm">
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button type="button" onClick={() => setDeleteId(m.id)} className="btn btn-danger btn-sm">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir missão"
        description="Confirma a exclusão? Só é possível excluir missões sem datas cadastradas."
        confirmLabel="Excluir"
        variant="danger"
        loading={pending}
      />
    </div>
  );
}
