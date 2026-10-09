import type { ComponentProps } from 'react';

// Reserve space for an inset arrow on the correct side in both RTL and LTR.
export function FormSelect({ className = '', dir = 'rtl', ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        dir={dir}
        className={`w-full min-w-0 appearance-none py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed ${dir === 'ltr' ? 'pl-3 pr-9' : 'pr-3 pl-9'} ${className}`}
      />
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 ${dir === 'ltr' ? 'right-3' : 'left-3'}`}
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
