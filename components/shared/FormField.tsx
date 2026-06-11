import { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="info-label mb-1 block">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
