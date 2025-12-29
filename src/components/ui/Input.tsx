'use client';

import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-bold text-gray-300 ml-1">{label}</label>}
      <input
        className={clsx(
          "bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500 ml-1">{error}</span>}
    </div>
  );
}
