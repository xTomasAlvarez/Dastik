import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'rounded-none uppercase tracking-wider font-heading font-semibold transition-fast inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#FAFAFA] text-[#000000] hover:bg-[#E5E5E5] active:bg-[#CCCCCC]',
    secondary: 'bg-[#111111] text-[#FAFAFA] border border-[#333333] hover:bg-[#1A1A1A] active:bg-[#222222]',
    danger: 'bg-red-950 text-red-200 border border-red-800 hover:bg-red-900',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
