import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] rounded-none px-3 py-2.5 text-sm outline-none transition-fast font-sans placeholder-[#555555] ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-sans">{error}</span>}
    </div>
  );
};
