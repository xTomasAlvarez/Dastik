import React, { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id}
          type={effectiveType}
          className={`w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] rounded-none px-3 py-2.5 ${
            isPassword && showPasswordToggle ? 'pr-10' : ''
          } text-sm outline-none transition-fast font-sans placeholder-[#555555] ${className}`}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1 cursor-pointer focus:outline-none"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlash size={18} weight="light" />
            ) : (
              <Eye size={18} weight="light" />
            )}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-400 font-sans">{error}</span>}
    </div>
  );
};
