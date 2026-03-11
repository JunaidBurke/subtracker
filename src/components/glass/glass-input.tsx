'use client'

import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput({ label, error, className = '', id, ...props }, ref) {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-text-secondary font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg px-4 py-3',
            'bg-surface-overlay border text-text-primary placeholder:text-text-tertiary',
            'transition-all duration-200 outline-none',
            error
              ? 'border-status-danger/40 ring-1 ring-status-danger/30'
              : 'border-border focus:border-accent/40 focus:ring-1 focus:ring-accent/30',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-status-danger mt-0.5">{error}</p>
        )}
      </div>
    )
  },
)
