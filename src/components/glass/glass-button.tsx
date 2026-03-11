'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    'bg-white/10 hover:bg-white/15 border border-white/10 text-white',
  primary: [
    'bg-gradient-to-r from-blue-500/80 to-purple-500/80',
    'hover:from-blue-500 hover:to-purple-500',
    'hover:shadow-[var(--shadow-glow)]',
    'border border-white/10 text-white font-medium',
  ].join(' '),
  ghost: 'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
  danger:
    'bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-400',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-sm rounded-lg',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-[48px] px-6 py-3 text-base rounded-xl',
}

export function GlassButton({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center',
        'backdrop-blur-sm transition-all duration-200',
        'cursor-pointer',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
