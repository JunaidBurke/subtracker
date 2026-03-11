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
            className="text-sm text-white/60 font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-xl px-4 py-3 backdrop-blur-sm',
            'bg-white/5 border text-white placeholder:text-white/40',
            'transition-all duration-200 outline-none',
            error
              ? 'border-red-500/30 ring-2 ring-red-500/50'
              : 'border-white/10 focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/50',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    )
  },
)
