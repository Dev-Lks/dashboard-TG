'use client';

import { useState, useMemo, useCallback } from 'react';
import { DonationDateCalendar } from './DonationDateCalendar';
import { MissionDateDetailPanel } from './MissionDateDetailPanel';
import { MissionBatchPanel } from './MissionBatchPanel';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';
import type { Mission } from '@/lib/missions/types';

type DatesPageClientProps = {
  missions: Mission[];
  registeredDates: RegisteredDateInfo[];
  initialMissionId?: string;
};

export function DatesPageClient({ missions, registeredDates, initialMissionId }: DatesPageClientProps) {
  const [selectedMissionId, setSelectedMissionId] = useState(
    initialMissionId || missions[0]?.id || '',
  );
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [focusDateStr, setFocusDateStr] = useState<string | null>(null);

  const selectedMission = missions.find((m) => m.id === selectedMissionId) || missions[0];

  const missionDates = useMemo(
    () => registeredDates.filter((d) => d.mission_id === selectedMission?.id),
    [registeredDates, selectedMission?.id],
  );

  const registeredMap = useMemo(() => {
    const map = new Map<string, RegisteredDateInfo>();
    missionDates.forEach((d) => map.set(d.date, d));
    return map;
  }, [missionDates]);

  const registered = focusDateStr ? registeredMap.get(focusDateStr) : undefined;

  const handleDateClick = useCallback(
    (dateStr: string, isRegistered: boolean) => {
      if (isRegistered) {
        setFocusDateStr(dateStr);
        return;
      }

      setFocusDateStr(dateStr);
      setSelectedForBatch((prev) =>
        prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
      );
    },
    [],
  );

  const handleRemoveFromBatch = (dateStr: string) => {
    setSelectedForBatch((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleClearBatch = () => {
    setSelectedForBatch([]);
  };

  const batchSet = useMemo(() => new Set(selectedForBatch), [selectedForBatch]);

  if (!selectedMission) {
    return (
      <div className="card p-5">
        <p className="text-sm text-[var(--text-muted)]">
          Nenhuma missão cadastrada. Crie uma missão em Admin → Missões antes de cadastrar datas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <label className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--olive-dark)]">
          Missão
        </label>
        <select
          className="input max-w-md"
          value={selectedMissionId}
          onChange={(e) => {
            setSelectedMissionId(e.target.value);
            setFocusDateStr(null);
            setSelectedForBatch([]);
          }}
        >
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <section className="mb-5 grid gap-4 lg:grid-cols-[1.25fr,0.85fr]">
        <DonationDateCalendar
          registeredDates={missionDates}
          selectedDateStrs={batchSet}
          focusDateStr={focusDateStr}
          onDateClick={handleDateClick}
        />
        <div className="space-y-4">
          {selectedForBatch.length > 0 && (
            <MissionBatchPanel
              mission={selectedMission}
              selectedDates={selectedForBatch}
              onRemoveDate={handleRemoveFromBatch}
              onClear={handleClearBatch}
            />
          )}
          <MissionDateDetailPanel
            key={`${selectedMission.id}-${focusDateStr || 'empty'}`}
            mission={selectedMission}
            selectedDateStr={focusDateStr}
            registered={registered}
            initialNotes={registered?.notes ?? ''}
            initialCapacity={registered?.capacity ?? selectedMission.default_capacity}
          />
        </div>
      </section>
    </>
  );
}
