'use client'

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] animate-[drift_20s_ease-in-out_infinite] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] animate-[drift_25s_ease-in-out_infinite_reverse] rounded-full bg-purple-500/10 blur-[120px]" />
      <div className="absolute -bottom-1/4 left-1/3 h-[400px] w-[400px] animate-[drift_18s_ease-in-out_infinite_2s] rounded-full bg-indigo-500/8 blur-[100px]" />
    </div>
  )
}
