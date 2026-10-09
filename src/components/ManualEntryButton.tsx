interface Props {
  onClick: () => void;
  variant?: 'filled' | 'outline' | 'card';
  label?: string;
}

const styles = {
  filled: 'justify-center bg-primary-600 dark:bg-primary-600 text-white hover:bg-primary-700 dark:hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md',
  outline: 'justify-center border-2 border-primary-500 dark:border-primary-400 bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 active:bg-primary-100 dark:active:bg-primary-900/50',
  card: 'text-right border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:border-primary-400 dark:hover:border-primary-500 active:bg-primary-200 dark:active:bg-primary-900/70',
};

export function ManualEntryButton({ onClick, variant = 'filled', label = 'افزودن دستی' }: Props) {
  return (
    <button type="button" data-tour="manual-entry" aria-haspopup="dialog" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium ${variant === 'outline' ? 'rounded-full' : 'rounded-xl'} transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${styles[variant]}`}>
      <span className={variant === 'card' ? 'flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-white shadow-sm' : variant === 'outline' ? 'flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-primary-50 dark:bg-primary-900/40' : ''}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </span>
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {variant === 'card' && <span className="text-xs font-normal text-primary-700 dark:text-primary-300">درس، حل تمرین یا موارد دیگر</span>}
      </span>
      {variant === 'card' && <svg aria-hidden="true" className="mr-auto shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>}
    </button>
  );
}
