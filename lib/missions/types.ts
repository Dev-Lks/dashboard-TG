export type ScheduleMode = 'slots' | 'presence_only';

export type Mission = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  maps_url: string | null;
  default_capacity: number;
  default_schedule_mode: ScheduleMode;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type MissionTemplate = {
  id: string;
  name: string;
  description: string;
  default_capacity: number;
  default_schedule_mode: ScheduleMode;
  location?: string;
};

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'doacao-sangue',
    name: 'Doação de Sangue',
    description: 'Missão de doação de sangue do efetivo.',
    default_capacity: 15,
    default_schedule_mode: 'slots',
    location: 'Av. Quarenta e Nove, 125 — Elândia, Ituiutaba/MG',
  },
  {
    id: 'formacao',
    name: 'Formação / Instrução',
    description: 'Atividade de formação ou instrução do efetivo.',
    default_capacity: 30,
    default_schedule_mode: 'slots',
  },
  {
    id: 'evento',
    name: 'Apoio a Evento',
    description: 'Missão de apoio a evento cívico ou comunitário.',
    default_capacity: 40,
    default_schedule_mode: 'presence_only',
  },
];
