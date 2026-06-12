'use client';

import { donationProfiles, type DonationProfileKey } from '@/lib/dates/profiles';
import { FormField } from '@/components/shared/FormField';

type ProfileSelectProps = {
  value: DonationProfileKey;
  onChange: (key: DonationProfileKey) => void;
  label?: string;
};

export function ProfileSelect({ value, onChange, label = 'Perfil de horário' }: ProfileSelectProps) {
  return (
    <FormField label={label} hint="Define os horários gerados automaticamente">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DonationProfileKey)}
        className="input"
      >
        {(['monday', 'thursday', 'generic'] as const).map((key) => (
          <option key={key} value={key}>
            {donationProfiles[key].profileLabel}
          </option>
        ))}
      </select>
    </FormField>
  );
}
