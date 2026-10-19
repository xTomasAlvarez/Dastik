import React, { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  showPasswordToggle = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium tracking-wide text-secondary font-sans"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id}
          type={effectiveType}
          className={cn(
            'w-full bg-surface text-primary border border-subtle rounded-lg px-3.5 py-2 text-sm outline-none transition-fast font-sans placeholder:text-muted shadow-surface focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50',
            isPassword && showPasswordToggle && 'pr-10',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer focus:outline-none"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlash size={18} weight="regular" />
            ) : (
              <Eye size={18} weight="regular" />
            )}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 font-sans font-medium">
          {error}
        </span>
      )}
    </div>
  );
};
