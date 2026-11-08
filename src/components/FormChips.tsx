import type { FormResult } from '../types';

const LABEL: Record<FormResult, string> = { W: '勝', D: '分', L: '負' };

export function FormChips({ form }: { form: FormResult[] }) {
  if (form.length === 0) return <span className="muted">-</span>;
  return (
    <span className="form" aria-label={`直近: ${form.map((f) => LABEL[f]).join(' ')}`}>
      {form.map((f, i) => (
        <span key={i} className={`chip chip-${f}`}>{LABEL[f]}</span>
      ))}
    </span>
  );
}
