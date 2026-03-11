'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, Image as ImageIcon, FileText, Loader2, AlertCircle } from 'lucide-react'
import { GlassButton } from '@/components/glass/glass-button'
import type { BillingCycle } from '@/types'

interface ParsedReceipt {
  name: string | null
  amount: number | null
  currency: string | null
  billing_cycle: BillingCycle | null
  category: string | null
  next_renewal: string | null
}

interface SmartEntryProps {
  onParsed: (data: ParsedReceipt) => void
}

export function SmartEntry({ onParsed }: SmartEntryProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [receiptText, setReceiptText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WebP image.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleParse() {
    if (!imageBase64 && !receiptText.trim()) {
      setError('Upload an image or paste receipt text first.')
      return
    }

    setParsing(true)
    setError(null)

    try {
      const body: Record<string, string> = {}
      if (imageBase64) body.image = imageBase64
      else body.text = receiptText.trim()

      const res = await fetch('/api/ai/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to parse receipt')
      }

      const data = await res.json() as ParsedReceipt
      onParsed(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse receipt'
      setError(message)
    } finally {
      setParsing(false)
    }
  }

  function clearImage() {
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Image upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !imagePreview && fileInputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center rounded-2xl',
          'border-2 border-dashed p-8 text-center cursor-pointer',
          'backdrop-blur-sm transition-all duration-200',
          dragOver
            ? 'border-blue-400/50 bg-blue-500/10'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {imagePreview ? (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <ImageIcon className="h-4 w-4" />
              <span>Image uploaded</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Receipt preview"
              className="max-h-48 rounded-xl mx-auto object-contain"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearImage() }}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Remove image
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-white/30 mb-3" />
            <p className="text-white/50 text-sm">
              Drag & drop a receipt screenshot
            </p>
            <p className="text-white/30 text-xs mt-1">
              PNG, JPG, or WebP
            </p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/30">or paste text</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Text input */}
      <div className="relative">
        <FileText className="absolute left-3 top-3 h-4 w-4 text-white/30" />
        <textarea
          value={receiptText}
          onChange={(e) => setReceiptText(e.target.value)}
          placeholder="Paste receipt or confirmation email text..."
          disabled={!!imageBase64}
          className={[
            'w-full rounded-xl pl-10 pr-4 py-3 backdrop-blur-sm resize-none min-h-[100px]',
            'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
            'transition-all duration-200 outline-none',
            'focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/50',
            imageBase64 ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3 border border-red-500/20">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parse button */}
      <GlassButton
        type="button"
        variant="primary"
        onClick={handleParse}
        disabled={parsing || (!imageBase64 && !receiptText.trim())}
        className="w-full"
      >
        {parsing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing with AI...
          </span>
        ) : (
          'Parse Receipt'
        )}
      </GlassButton>
    </div>
  )
}
