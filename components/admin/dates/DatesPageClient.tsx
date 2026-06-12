'use client';

import { useState, useMemo, useCallback } from 'react';
import { DonationDateCalendar } from './DonationDateCalendar';
import { MissionDateDetailPanel } from './MissionDateDetailPanel';
import { MissionBatchPanel } from './MissionBatchPanel';
import { ScheduleWindowCards } from './DonationSchedulePreview';
import type { RegisteredDateInfo } from '@/lib/dates/calendar-utils';

type DatesPageClientProps = {
  registeredDates: RegisteredDateInfo[];
};

export function DatesPageClient({ registeredDates }: DatesPageClientProps) {
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [focusDateStr, setFocusDateStr] = useState<string | null>(null);

  const registeredMap = useMemo(() => {
    const map = new Map<string, RegisteredDateInfo>();
    registeredDates.forEach((d) => map.set(d.date, d));
    return map;
  }, [registeredDates]);

  const registered = focusDateStr ? registeredMap.get(focusDateStr) : undefined;

  const handleDateClick = useCallback(
    (dateStr: string, isRegistered: boolean, isValidNew: boolean) => {
      if (isRegistered) {
        setFocusDateStr(dateStr);
        return;
      }

      if (isValidNew) {
        setFocusDateStr(null);
        setSelectedForBatch((prev) =>
          prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
        );
      }
    },
    []
  );

  const handleRemoveFromBatch = (dateStr: string) => {
    setSelectedForBatch((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleClearBatch = () => {
    setSelectedForBatch([]);
  };

  const batchSet = useMemo(() => new Set(selectedForBatch), [selectedForBatch]);

  return (
    <>
      <section className="mb-5 grid gap-4 lg:grid-cols-[1.25fr,0.85fr]">
        <DonationDateCalendar
          registeredDates={registeredDates}
          selectedDateStrs={batchSet}
          focusDateStr={focusDateStr}
          onDateClick={handleDateClick}
        />
        <div className="space-y-4">
          {selectedForBatch.length > 0 && (
            <MissionBatchPanel
              selectedDates={selectedForBatch}
              onRemoveDate={handleRemoveFromBatch}
              onClear={handleClearBatch}
            />
          )}
          <MissionDateDetailPanel
            key={focusDateStr || 'empty'}
            selectedDateStr={focusDateStr}
            registered={registered}
            initialNotes={registered?.notes ?? ''}
            initialCapacity={registered?.capacity ?? 15}
          />
        </div>
      </section>

      <section className="mb-5">
        <ScheduleWindowCards />
      </section>
    </>
  );
}
