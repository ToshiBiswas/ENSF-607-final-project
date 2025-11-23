import React from 'react';

type Variant = 'info' | 'error';

interface AlertProps {
  variant?: Variant;
  message: string;
  onRetry?: () => void;
}

const styles: Record<Variant, { bg: string; border: string; text: string; button: string; buttonHover: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    button: 'text-blue-700 hover:text-blue-900',
    buttonHover: 'hover:underline',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    button: 'text-red-700 hover:text-red-900',
    buttonHover: 'hover:underline',
  },
};

export const Alert: React.FC<AlertProps> = ({ variant = 'info', message, onRetry }) => {
  const tone = styles[variant];
  return (
    <div className={`rounded-lg border p-4 ${tone.bg} ${tone.border} ${tone.text}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`text-sm font-semibold ${tone.button} ${tone.buttonHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-current rounded`}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
