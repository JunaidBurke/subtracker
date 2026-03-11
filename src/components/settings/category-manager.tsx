'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { GlassInput } from '@/components/glass/glass-input'

interface CategoryManagerProps {
  categories: string[]
  onUpdate: (categories: string[]) => void
}

export function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    const trimmed = newCategory.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed.length > 50) {
      setError('Category name must be 50 characters or less')
      return
    }

    if (categories.includes(trimmed)) {
      setError('Category already exists')
      return
    }

    setError('')
    setNewCategory('')
    onUpdate([...categories, trimmed])
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  function handleRemove(category: string) {
    onUpdate(categories.filter((c) => c !== category))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
              'text-xs font-medium bg-white/10 text-white/70',
            ].join(' ')}
          >
            {category}
            <button
              type="button"
              onClick={() => handleRemove(category)}
              className="min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              aria-label={`Remove ${category}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-white/40">No categories yet. Add one below.</p>
        )}
      </div>
      <GlassInput
        placeholder="Add category and press Enter"
        value={newCategory}
        onChange={(e) => {
          setNewCategory(e.target.value)
          if (error) setError('')
        }}
        onKeyDown={handleKeyDown}
        error={error}
      />
    </div>
  )
}
