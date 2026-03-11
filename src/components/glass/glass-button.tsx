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
    'bg-surface-overlay hover:bg-surface-subtle border border-border text-text-primary',
  primary: [
    'bg-accent text-surface-base font-semibold',
    'hover:bg-accent-hover',
    'hover:shadow-[var(--shadow-accent)]',
    'border border-transparent',
  ].join(' '),
  ghost: 'bg-transparent hover:bg-surface-overlay text-text-secondary hover:text-text-primary',
  danger:
    'bg-status-danger/10 hover:bg-status-danger/20 border border-status-danger/20 text-status-danger',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-sm rounded-lg',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-lg',
  lg: 'min-h-[48px] px-6 py-3 text-base rounded-lg',
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
        'transition-all duration-200',
        'cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
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
