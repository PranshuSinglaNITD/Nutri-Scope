import React from 'react';
import { CheckCircle } from 'lucide-react';

type Props = {
  message: string;
  variant?: 'success' | 'info';
};

export default function HealthBadge({ message, variant = 'success' }: Props) {
  const isSuccess = variant === 'success';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 mb-4 border shadow-sm
        ${isSuccess
          ? 'bg-linear-to-r from-green-50 to-white border-green-200'
          : 'bg-linear-to-r from-blue-50 to-white border-blue-200'}
      `}
    >
      {/* subtle glow */}
      <div
        className={`absolute inset-0 pointer-events-none
          ${isSuccess
            ? 'bg-green-200/10'
            : 'bg-blue-200/10'}
        `}
      />

      {/* icon */}
      <div
        className={`relative flex items-center justify-center p-2.5 rounded-full
          ${isSuccess
            ? 'bg-green-100 text-green-600'
            : 'bg-blue-100 text-blue-600'}
        `}
      >
        <CheckCircle className="w-6 h-6" />
      </div>

      {/* text */}
      <p
        className={`relative text-sm font-semibold leading-snug
          ${isSuccess ? 'text-green-800' : 'text-blue-800'}
        `}
      >
        {message}
      </p>
    </div>
  );
}
