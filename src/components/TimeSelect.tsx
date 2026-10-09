import { FormSelect } from './FormSelect';
import { toPersianDigits } from '@/utils/persian';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimeSelect({ id, label, value, onChange, optional = false }: Props) {
  const [hour = '', minute = '00'] = value.split(':');
  // Preserve an imported or saved time such as 08:10 while offering quarter hours.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();

  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{label}</legend>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5" dir="ltr">
        <FormSelect
          id={`${id}-hour`}
          dir="ltr"
          value={hour}
          aria-label={`${label} (ساعت)`}
          required={!optional}
          onChange={(event) => onChange(event.target.value ? `${event.target.value}:${minute}` : '')}
        >
          {optional && <option value="">—</option>}
          {HOURS.map((option) => <option key={option} value={option}>{toPersianDigits(option)}</option>)}
        </FormSelect>
        <span aria-hidden="true" className="text-gray-500 dark:text-gray-400">:</span>
        <FormSelect
          id={`${id}-minute`}
          dir="ltr"
          value={minute}
          aria-label={`${label} (دقیقه)`}
          disabled={optional && !hour}
          onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        >
          {minutes.map((option) => <option key={option} value={option}>{toPersianDigits(option)}</option>)}
        </FormSelect>
      </div>
    </fieldset>
  );
}
